mod mods;

use anyhow::Context;
use mcvm::core::io::files;
use mcvm::core::user::{User, UserKind};
use mcvm::core::util::versions::MinecraftVersionDeser;
use mcvm::data::config::instance::{read_instance_config, InstanceConfig};
use mcvm::data::config::profile::ProfileConfig;
use mcvm::data::id::{InstanceRef, ProfileID};
use mcvm::data::instance::Instance;
use mcvm::data::profile::update::update_profiles;
use mcvm::data::{config::Config, id::InstanceID};
use mcvm::io::files::paths::Paths;
use mcvm::shared::modifications::{ClientType, Proxy};
use mcvm::shared::Side;
use oauth2::ClientId;
use reqwest::Client;
use simple_error::bail;
use std::collections::HashMap;

use crate::api;
use crate::config::LocalBundleConfig;
use crate::mcvm::output::SmithedMCVMOutput;
use crate::minecraft::launch::mods::install_mods;

pub async fn launch_bundle(
    bundle_id: String,
    bundle: LocalBundleConfig,
    offline: bool,
    client: &Client,
    output: &mut SmithedMCVMOutput,
) -> anyhow::Result<()> {
    let instance = InstanceID::from(format!("smithed-bundle-{bundle_id}"));
    let profile_id = ProfileID::from(format!("smithed-bundle-{bundle_id}"));
    let instance_ref = InstanceRef::new(profile_id.clone(), instance.clone());
    let paths: Paths = Paths::new().await?;

    let mut config = Config::load(
        &paths.project.config_dir().join("mcvm.json"),
        true,
        &paths,
        output,
    )?;

    let user = "smithed-user".to_string();
    let user_kind = if offline {
        UserKind::Unverified
    } else {
        UserKind::Microsoft { xbox_uid: None }
    };
    config
        .users
        .add_user(User::new(user_kind, &user, "SmithedUser"));
    config.users.choose_user(&user)?;

    if !config.get_instance(&instance_ref).is_some() {
        let instance_config = InstanceConfig::Simple(Side::Client);
        let mut instances = HashMap::new();
        instances.insert(instance.clone(), instance_config.clone());
        let profile_config = ProfileConfig {
            version: MinecraftVersionDeser::Version(bundle.version.clone().into()),
            modloader: Default::default(),
            client_type: ClientType::Fabric,
            server_type: Default::default(),
            instances,
            packages: Default::default(),
            package_stability: Default::default(),
            proxy: Proxy::default(),
        };
        let mut profile = profile_config.to_profile(profile_id.clone());
        let instance_val = read_instance_config(
            instance.clone(),
            &instance_config,
            &profile,
            &[],
            &HashMap::new(),
        )?;
        profile.add_instance(instance_val);
        config.profiles.insert(profile_id.clone(), profile);
    }

    println!("Updating bundle mcvm profile");
    let profile_list = [profile_id.clone()];
    update_profiles(&paths, &mut config, &profile_list, false, false, output).await?;

    if let Some(profile) = config.profiles.get_mut(&instance_ref.profile) {
        let Some(instance) = profile.instances.get_mut(&instance_ref.instance) else {
            bail!("Instance does not exist in profile");
        };
        install_bundle_packs(&bundle, instance, &paths, client).await?;
        instance.ensure_dirs(&paths)?;
        let mods_dir = &instance.get_dirs().get().game_dir.join("mods");
        files::create_dir(&mods_dir)?;
        install_mods(client, &mods_dir, &bundle.version)
            .await
            .context("Failed to install mods")?;

        let mut handle = instance
            .launch(
                &paths,
                &mut config.users,
                &profile.version,
                ClientId::new(super::auth::CLIENT_ID.into()),
                output,
            )
            .await?;
        handle.wait()?;
    } else {
        bail!("Unknown instance '{}'", instance);
    }

    Ok(())
}

/// Install the packs on a bundle instance
async fn install_bundle_packs(
    bundle: &LocalBundleConfig,
    instance: &mut Instance,
    paths: &Paths,
    client: &Client,
) -> anyhow::Result<()> {
    instance
        .ensure_dirs(&paths)
        .context("Failed to create instance dirs")?;
    let game_dir = &instance.get_dirs().get().game_dir;
    let paxi_dir = game_dir.join("config/paxi");
    files::create_leading_dirs(&paxi_dir).context("Failed to create leading dirs for Paxi dir")?;
    files::create_dir(&paxi_dir).context("Failed to create Paxi dir")?;
    let datapacks_dir = paxi_dir.join("datapacks");
    files::create_dir(&datapacks_dir).context("Failed to create Paxi datapacks dir")?;
    let resource_packs_dir = paxi_dir.join("resourcepacks");
    files::create_dir(&resource_packs_dir).context("Failed to create Paxi resource packs dir")?;

    api::download_packs(
        client,
        bundle.packs.clone(),
        &datapacks_dir,
        &resource_packs_dir,
    )
    .await?;

    Ok(())
}

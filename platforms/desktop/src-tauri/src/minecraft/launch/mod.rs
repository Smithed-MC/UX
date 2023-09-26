mod mods;

use anyhow::Context;
use mcvm::data::config::instance::{read_instance_config, InstanceConfig};
use mcvm::data::config::profile::ProfileConfig;
use mcvm::data::id::ProfileID;
use mcvm::data::instance::Instance;
use mcvm::data::profile::update::update_profiles;
use mcvm::data::user::{AuthState, User, UserKind};
use mcvm::data::{config::Config, id::InstanceID};
use mcvm::io::files;
use mcvm::io::{files::paths::Paths, lock::Lockfile};
use mcvm::shared::modifications::ClientType;
use mcvm::shared::Side;
use mcvm::util::versions::MinecraftVersionDeser;
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
    let paths: Paths = Paths::new().await?;

    let mut lock = Lockfile::open(&paths)?;
    let mut config = Config::load(&paths.project.config_dir().join("mcvm.json"), true, output)?;

    let user = "smithed-user".to_string();
    let user_kind = if offline {
        UserKind::Unverified
    } else {
        UserKind::Microsoft { xbox_uid: None }
    };
    config
        .users
        .users
        .insert(user.clone(), User::new(user_kind, &user, "SmithedUser"));
    config.users.state = AuthState::UserChosen(user.clone());

    if !config.instances.contains_key(&instance) {
        let instance_config = InstanceConfig::Simple(Side::Client);
        let mut instances = HashMap::new();
        instances.insert(instance.clone(), instance_config.clone());
        let profile_config = ProfileConfig {
            version: MinecraftVersionDeser::Version(bundle.version.clone()),
            modloader: Default::default(),
            client_type: ClientType::Fabric,
            server_type: Default::default(),
            instances,
            packages: Default::default(),
            package_stability: Default::default(),
        };
        let mut profile = profile_config.to_profile(profile_id.clone());
        profile.add_instance(instance.clone());
        let instance_val = read_instance_config(
            instance.clone(),
            &instance_config,
            &profile,
            &HashMap::new(),
        )?;
        config.instances.insert(instance.clone(), instance_val);
        config.profiles.insert(profile_id.clone(), profile);
    }

    println!("Updating bundle mcvm profile");
    let profile_list = [profile_id.clone()];
    update_profiles(&paths, &mut config, &profile_list, false, false, output).await?;

    if let Some(instance) = config.instances.get_mut(&instance) {
        install_bundle_packs(&bundle, instance, &paths, client).await?;
        instance.ensure_dirs(&paths)?;
        let mods_dir = &instance.dirs.get().game_dir.join("mods");
        files::create_dir(&mods_dir)?;
        install_mods(client, &mods_dir, &bundle.version)
            .await
            .context("Failed to install mods")?;

        let (.., profile) = config
            .profiles
            .iter()
            .find(|(.., profile)| profile.instances.contains(&instance.id))
            .expect("Instance does not belong to any profiles");
        instance
            .launch(
                &paths,
                &mut lock,
                &mut config.users,
                &profile.version,
                ClientId::new(super::auth::CLIENT_ID.into()),
                output,
            )
            .await?
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
    let game_dir = &instance.dirs.get().game_dir;
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

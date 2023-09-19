use std::collections::HashMap;
use std::error::Error;

use mcvm::data::config::instance::{read_instance_config, InstanceConfig};
use mcvm::data::config::profile::ProfileConfig;
use mcvm::data::user::{AuthState, User, UserKind};
use mcvm::data::{config::Config, id::InstanceID};
use mcvm::io::{files::paths::Paths, lock::Lockfile};
use mcvm::shared::Side;
use mcvm::util::versions::{MinecraftLatestVersion, MinecraftVersionDeser};
use oauth2::ClientId;
use simple_error::bail;

use crate::mcvm::output::SmithedMCVMOutput;

pub async fn launch_instance(
    instance: &str,
    output: &mut SmithedMCVMOutput<'_>,
) -> Result<(), Box<dyn Error>> {
    let instance = InstanceID::from(instance);
    let paths: Paths = Paths::new().await?;

    let mut lock = Lockfile::open(&paths)?;
    let mut config = Config::load(&paths.project.config_dir().join("mcvm.json"), true, output)?;

    // switch_user(&mut config, String::from("CarbonSmasher")).await?;
    let user = "carbon".to_string();
    config.users.users.insert(
        user.clone(),
        User::new(
            UserKind::Microsoft { xbox_uid: None },
            &user,
            "CarbonSmasher",
        ),
    );
    config.users.state = AuthState::UserChosen(user.clone());

    if !config.instances.contains_key(&instance) {
        let instance_config = InstanceConfig::Simple(Side::Client);
        let mut instances = HashMap::new();
        instances.insert(instance.clone(), instance_config.clone());
        let profile_config = ProfileConfig {
            version: MinecraftVersionDeser::Latest(MinecraftLatestVersion::Release),
            modloader: Default::default(),
            client_type: Default::default(),
            server_type: Default::default(),
            instances,
            packages: Default::default(),
            package_stability: Default::default(),
        };
        let mut profile = profile_config.to_profile("foo".into());
        profile.add_instance(instance.clone());
        let instance_val = read_instance_config(
            instance.clone(),
            &instance_config,
            &profile,
            &HashMap::new(),
        )?;
        config.instances.insert(instance.clone(), instance_val);
        config.profiles.insert("foo".into(), Box::new(profile));
    }

    if let Some(instance) = config.instances.get_mut(&instance) {
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

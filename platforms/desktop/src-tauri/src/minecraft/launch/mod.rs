use std::{error::Error};

use mcvm::{io::files::paths::Paths, data::config::Config};
use simple_error::bail;

use crate::mcvm::switch_user;


pub async fn launch_instance(instance: String) -> Result<(), Box<dyn Error>> {

    let paths: Paths = Paths::new().await?;
    let mut config = Config::load(&paths.project.config_dir().join("mcvm.json"))?;

    switch_user(&mut config, String::from("TheNuclearNexus")).await?;

    if let Some(instance) = config.instances.get_mut(&instance) {
        let (.., profile) = config
            .profiles
            .iter()
            .find(|(.., profile)| profile.instances.contains(&instance.id))
            .expect("Instance does not belong to any profiles");
        instance
            .launch(&paths, &config.auth, false, None, &profile.version)
            .await?
    } else {
        bail!("Unknown instance '{}'", instance);
    }

    Ok(())
}

use std::{collections::HashMap, error::Error, fs};

use directories::ProjectDirs;
use mcvm::{
    core::user::{User, UserKind},
    data::config::Config,
};
use serde::{Deserialize, Serialize};
use simple_error::bail;

pub mod output;

#[derive(Serialize, Deserialize)]
pub struct MinecraftProfile {
    pub id: String,
    pub name: String,
}

#[derive(Deserialize, Serialize)]
pub struct MCVMInstance {
    r#type: String,
}

#[derive(Deserialize, Serialize)]
pub struct MCVMProfile {
    version: String,
    instances: HashMap<String, MCVMInstance>,
}

#[derive(Deserialize, Serialize)]
pub struct MCVMUser {
    pub name: String,
    pub uuid: String,
    pub r#type: String,
    pub token: Option<String>,
}

#[derive(Deserialize, Serialize)]
pub struct UsersConfig {
    pub default_user: String,
    pub profiles: HashMap<String, MCVMProfile>,
    pub users: HashMap<String, MCVMUser>,
}

#[derive(Serialize, Deserialize)]
pub struct UserStored {
    pub id: String,
    pub name: String,
    pub uuid: String,
    pub access_token: Option<String>,
}

pub fn load_config() -> Result<HashMap<String, User>, Box<dyn Error>> {
    let project: ProjectDirs = ProjectDirs::from("", "smithed", "smithed_launcher").unwrap();
    let config_json_path: std::path::PathBuf = project.config_dir().join("users.json");

    if !project.config_dir().exists() {
        fs::create_dir_all(project.config_dir())?;
    }

    if !config_json_path.exists() {
        return Ok(HashMap::new());
    }

    let config_json_data: String =
        fs::read_to_string(config_json_path).expect("Failed to read config");

    let config_stored: HashMap<String, UserStored> =
        serde_json::from_str(&config_json_data).unwrap();

    let mut config: HashMap<String, User> = HashMap::new();

    for (user_id, user_data) in config_stored {
        config.insert(
            user_id,
            User::new(
                UserKind::Microsoft { xbox_uid: None },
                &user_data.id,
                &user_data.name,
            ),
        );
    }

    Ok(config)
}

pub fn save_config(config: &mut HashMap<String, User>) -> Result<(), Box<dyn Error>> {
    let project: ProjectDirs = ProjectDirs::from("", "smithed", "launcher").unwrap();

    if !project.config_dir().exists() {
        fs::create_dir_all(project.config_dir())?;
    }

    let config_json_path: std::path::PathBuf = project.config_dir().join("users.json");

    let mut config_stored: HashMap<String, UserStored> = HashMap::new();

    for (user_id, user_data) in config {
        match user_data.get_kind() {
            UserKind::Microsoft { .. } => {
                config_stored.insert(
                    user_id.to_owned(),
                    UserStored {
                        id: user_data.get_id().to_owned(),
                        name: user_data.get_name().to_owned(),
                        uuid: user_data.get_uuid().unwrap().to_owned(),
                        access_token: user_data.get_access_token().map(|x| x.0.clone()),
                    },
                );
            }
            _ => {}
        }
    }

    fs::write(config_json_path, serde_json::to_string(&config_stored)?)?;

    Ok(())
}

pub async fn add_user(mc_profile: &MinecraftProfile) -> Result<(), Box<dyn Error>> {
    let mut user_config = load_config()?;

    user_config.insert(
        mc_profile.name.clone(),
        User::new(
            UserKind::Microsoft { xbox_uid: None },
            &mc_profile.id,
            &mc_profile.name,
        ),
    );

    save_config(&mut user_config).expect("Error while saving config");

    Ok(())
}

pub async fn switch_user(config: &mut Config, name: String) -> Result<(), Box<dyn Error>> {
    let mut users_config = load_config()?;

    if !users_config.contains_key(&name) {
        bail!("User not in config");
    }

    for user in users_config.values() {
        config.users.add_user(user.clone());
    }

    config.users.choose_user(&name)?;

    save_config(&mut users_config)?;

    Ok(())
}

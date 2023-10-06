use std::sync::Mutex;

use anyhow::anyhow;
use directories::ProjectDirs;
use mcvm::data::user::UserManager;
use reqwest::Client;
use tauri::async_runtime;

pub mod commands;

/// The shared tauri state
pub struct SmithedState {
    pub launched_game: Mutex<Option<LaunchedGame>>,
    pub project_dirs: ProjectDirs,
    pub client: Client,
    pub user_manager: Mutex<UserManager>,
}

impl SmithedState {
    pub fn new() -> anyhow::Result<Self> {
        Ok(Self {
            launched_game: Mutex::new(None),
            project_dirs: ProjectDirs::from("dev.smithed", "Smithed", "smithed_launcher")
                .ok_or(anyhow!("Failed to create project directories"))?,
            client: Client::new(),
            user_manager: Mutex::new(UserManager::new()),
        })
    }
}

/// The current game launch process
pub struct LaunchedGame {
    pub task_handle: LaunchHandle,
}

/// Type for the task handle of the launch process
type LaunchHandle = async_runtime::JoinHandle<anyhow::Result<()>>;

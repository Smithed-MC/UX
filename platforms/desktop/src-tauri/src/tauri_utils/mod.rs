use std::sync::Mutex;

use anyhow::anyhow;
use directories::ProjectDirs;
use tauri::async_runtime;

pub mod commands;

/// The shared tauri state
pub struct SmithedState {
    pub launched_game: Mutex<Option<LaunchedGame>>,
    pub project_dirs: ProjectDirs,
}

impl SmithedState {
    pub fn new() -> anyhow::Result<Self> {
        Ok(Self {
            launched_game: Mutex::new(None),
            project_dirs: ProjectDirs::from("dev.smithed", "Smithed", "smithed_launcher")
                .ok_or(anyhow!("Failed to create project directories"))?,
        })
    }
}

/// The current game launch process
pub struct LaunchedGame {
    pub task_handle: LaunchHandle,
}

impl LaunchedGame {
    /// Utility method to get the task handle since we cant do an if let on the launched game (which is in a mutex)
    pub fn get_task_hand(&mut self) -> &mut LaunchHandle {
        &mut self.task_handle
    }
}

/// Type for the task handle of the launch process
type LaunchHandle = async_runtime::JoinHandle<anyhow::Result<()>>;

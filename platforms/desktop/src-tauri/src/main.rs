#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

pub mod api_types;
pub mod config;
pub mod mcvm;
pub mod minecraft;
pub mod tauri_utils;

use tauri_utils::SmithedState;

use crate::tauri_utils::commands;

fn main() -> anyhow::Result<()> {
    tauri::Builder::default()
        .manage(SmithedState::new()?)
        .invoke_handler(tauri::generate_handler![
            /* REGISTER TAURI IPC COMMANDS */
            commands::launch_game,
            commands::stop_game,
            commands::add_bundle,
            commands::list_bundles,
            commands::remove_bundle,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}

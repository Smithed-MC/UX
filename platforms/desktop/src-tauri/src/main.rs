#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

pub mod mcvm;
pub mod minecraft;
pub mod tauri_utils;

use crate::tauri_utils::commands;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

fn main() {
    // let result = testGetAuth();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            /* REGISTER TAURI IPC COMMANDS */
            commands::get_minecraft_token,
            commands::get_device_code,
            commands::launch_game
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

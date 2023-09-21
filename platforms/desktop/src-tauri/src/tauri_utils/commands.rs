use std::collections::HashMap;

use tauri::async_runtime;

use crate::{
    config::{LocalBundleConfig, SmithedConfig},
    mcvm::output::SmithedMCVMOutput,
    minecraft::launch::launch_instance,
};

use super::{LaunchedGame, SmithedState};

#[tauri::command]
pub async fn launch_game(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, SmithedState>,
) -> Result<(), String> {
    let output = SmithedMCVMOutput::new(app_handle);
    let lock = state.launched_game.lock();
    let mut lock = lock.map_err(|x| x.to_string())?;
    *lock = Some(get_launched_game(output));
    Ok(())
}

fn get_launched_game(o: SmithedMCVMOutput) -> LaunchedGame {
    let task_handle = async_runtime::spawn(async move {
        let mut o = o;
        launch_instance("example-client".into(), &mut o).await?;
        Ok(())
    });
    LaunchedGame { task_handle }
}

#[tauri::command]
pub async fn stop_game(state: tauri::State<'_, SmithedState>) -> Result<(), String> {
    let lock = state.launched_game.lock();
    let mut lock = lock.map_err(|x| x.to_string())?;
    lock.as_mut().map(|game| game.task_handle.abort());

    Ok(())
}

#[tauri::command]
pub async fn add_bundle(
    bundle_id: String,
    bundle: LocalBundleConfig,
    state: tauri::State<'_, SmithedState>,
) -> Result<(), String> {
    let mut config = SmithedConfig::open(&state.project_dirs).map_err(|x| x.to_string())?;
    config.local_bundles.insert(bundle_id, bundle);
    config
        .write(&state.project_dirs)
        .map_err(|x| x.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn list_bundles(
    state: tauri::State<'_, SmithedState>,
) -> Result<HashMap<String, LocalBundleConfig>, String> {
    let config = SmithedConfig::open(&state.project_dirs).map_err(|x| x.to_string())?;

    Ok(config.local_bundles)
}

#[tauri::command]
pub async fn remove_bundle(
    bundle_id: String,
    state: tauri::State<'_, SmithedState>,
) -> Result<(), String> {
    let mut config = SmithedConfig::open(&state.project_dirs).map_err(|x| x.to_string())?;
    if config.local_bundles.contains_key(&bundle_id) {
        config.local_bundles.remove(&bundle_id);
    } else {
        return Err("Bundle does not exist".into());
    }
    config
        .write(&state.project_dirs)
        .map_err(|x| x.to_string())?;

    Ok(())
}

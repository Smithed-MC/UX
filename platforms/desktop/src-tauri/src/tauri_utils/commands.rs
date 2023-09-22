use std::collections::HashMap;

use directories::ProjectDirs;
use tauri::{async_runtime, Manager};

use crate::api_types::PackReference;
use crate::config::{LocalBundleConfig, SmithedConfig};
use crate::mcvm::output::SmithedMCVMOutput;
use crate::minecraft::launch::launch_bundle;

use super::{LaunchedGame, SmithedState};

#[tauri::command]
pub async fn launch_game(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, SmithedState>,
    bundle_id: String,
) -> Result<(), String> {
    let output = SmithedMCVMOutput::new(app_handle);
    let bundle = get_bundle_impl(&bundle_id, &state.project_dirs).await?;

    let lock = state.launched_game.lock();
    let mut lock = lock.map_err(|x| x.to_string())?;
    *lock = Some(get_launched_game(output, bundle_id, bundle));

    Ok(())
}

fn get_launched_game(
    o: SmithedMCVMOutput,
    bundle_id: String,
    bundle: LocalBundleConfig,
) -> LaunchedGame {
    let task_handle = async_runtime::spawn(async move {
        let mut o = o;
        launch_bundle(bundle_id, bundle, &mut o).await?;
        println!("Game closed");
        let app = o.get_app_handle();
        app.emit_all("game_finished", ())?;
        Ok(())
    });
    LaunchedGame { task_handle }
}

#[tauri::command]
pub async fn stop_game(state: tauri::State<'_, SmithedState>) -> Result<(), String> {
    println!("Stopping game...");
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
pub async fn get_bundle(
    bundle_id: String,
    state: tauri::State<'_, SmithedState>,
) -> Result<LocalBundleConfig, String> {
    get_bundle_impl(&bundle_id, &state.project_dirs).await
}

async fn get_bundle_impl(
    bundle_id: &str,
    project_dirs: &ProjectDirs,
) -> Result<LocalBundleConfig, String> {
    let config = SmithedConfig::open(project_dirs).map_err(|x| x.to_string())?;
    let bundle = config
        .local_bundles
        .get(bundle_id)
        .ok_or("Bundle does not exist".to_string())?;

    Ok(bundle.clone())
}

#[tauri::command]
pub async fn list_bundles(
    state: tauri::State<'_, SmithedState>,
) -> Result<HashMap<String, LocalBundleConfig>, String> {
    let config = SmithedConfig::open(&state.project_dirs).map_err(|x| x.to_string())?;

    Ok(config.local_bundles)
}

#[tauri::command]
pub async fn bundle_exists(
    bundle_id: String,
    state: tauri::State<'_, SmithedState>,
) -> Result<bool, String> {
    let config = SmithedConfig::open(&state.project_dirs).map_err(|x| x.to_string())?;

    Ok(config.local_bundles.contains_key(&bundle_id))
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

#[tauri::command]
pub async fn add_pack_to_bundle(
    bundle_id: String,
    pack: PackReference,
    state: tauri::State<'_, SmithedState>,
) -> Result<(), String> {
    let mut config = SmithedConfig::open(&state.project_dirs).map_err(|x| x.to_string())?;
    if let Some(bundle) = config.local_bundles.get_mut(&bundle_id) {
        bundle.packs.push(pack);
    } else {
        return Err("Bundle does not exist".into());
    }

    config
        .write(&state.project_dirs)
        .map_err(|x| x.to_string())?;

    Ok(())
}

use std::collections::HashMap;

use directories::ProjectDirs;
use mcvm::shared::output::{MCVMOutput, MessageContents, MessageLevel};
use reqwest::Client;
use tauri::{async_runtime, Manager};

use crate::api;
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
    offline: bool,
) -> Result<(), String> {
    let output = SmithedMCVMOutput::new(app_handle);
    let bundle = get_bundle_impl(&bundle_id, &state.project_dirs).await?;

    let lock = state.launched_game.lock();
    let mut lock = lock.map_err(|x| x.to_string())?;
    *lock = Some(get_launched_game(
        bundle_id,
        bundle,
        offline,
        &state.client,
        output,
    ));

    Ok(())
}

fn get_launched_game(
    bundle_id: String,
    bundle: LocalBundleConfig,
    offline: bool,
    client: &Client,
    o: SmithedMCVMOutput,
) -> LaunchedGame {
    println!("Launching game!");
    let client = client.clone();
    let task_handle = async_runtime::spawn(async move {
        let mut o = o;
        let res = launch_bundle(bundle_id, bundle, offline, &client, &mut o).await;
        if let Err(e) = res {
            o.display(MessageContents::Error(e.to_string()), MessageLevel::Important);
            return Err(e);
        }
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
    lock.take();

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
    println!(
        "Adding {} of version {} to bundle {bundle_id}",
        pack.id, pack.version
    );
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

#[tauri::command]
pub async fn get_pack_version_for_bundle(
    bundle_id: String,
    pack_id: String,
    state: tauri::State<'_, SmithedState>,
) -> Result<Option<String>, String> {
    let bundle = get_bundle_impl(&bundle_id, &state.project_dirs).await?;
    let pack = api::get_pack(&state.client, &pack_id)
        .await
        .map_err(|x| x.to_string())?;
    let version = pack.get_newest_version(&bundle.version);

    Ok(version.map(|x| x.name.clone()))
}

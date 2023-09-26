use std::collections::HashMap;
use std::fmt::Debug;

use directories::ProjectDirs;
use mcvm::shared::output::{MCVMOutput, MessageContents, MessageLevel};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::{async_runtime, Manager};

use crate::api;
use crate::api_types::{PackBundle, PackData, PackReference};
use crate::config::{LocalBundleConfig, SmithedConfig};
use crate::mcvm::output::SmithedMCVMOutput;
use crate::minecraft::launch::launch_bundle;

use super::{LaunchedGame, SmithedState};

#[tauri::command]
pub async fn launch_game(
    app_handle: tauri::AppHandle,
    mut state: tauri::State<'_, SmithedState>,
    bundle_id: String,
    offline: bool,
) -> Result<(), String> {
    let output = SmithedMCVMOutput::new(app_handle);
    let bundle = get_bundle_impl(&bundle_id, &state.project_dirs).await?;

    // Make sure the game is stopped first
    stop_game_impl(&mut state)?;

    let lock = state.launched_game.lock();
    let mut lock = fmt_err(lock)?;
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
            o.display(
                MessageContents::Error(format!("{e:?}")),
                MessageLevel::Important,
            );
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
pub async fn stop_game(mut state: tauri::State<'_, SmithedState>) -> Result<(), String> {
    println!("Stopping game...");
    stop_game_impl(&mut state)?;

    Ok(())
}

fn stop_game_impl(state: &mut tauri::State<'_, SmithedState>) -> Result<(), String> {
    let lock = state.launched_game.lock();
    let mut lock = fmt_err(lock)?;
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
    let mut config = fmt_err(SmithedConfig::open(&state.project_dirs))?;
    config.local_bundles.insert(bundle_id, bundle);
    fmt_err(config.write(&state.project_dirs))?;

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
    let config = fmt_err(SmithedConfig::open(project_dirs))?;
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
    let config = fmt_err(SmithedConfig::open(&state.project_dirs))?;

    Ok(config.local_bundles)
}

#[tauri::command]
pub async fn bundle_exists(
    bundle_id: String,
    state: tauri::State<'_, SmithedState>,
) -> Result<bool, String> {
    let config = fmt_err(SmithedConfig::open(&state.project_dirs))?;

    Ok(config.local_bundles.contains_key(&bundle_id))
}

#[tauri::command]
pub async fn remove_bundle(
    bundle_id: String,
    state: tauri::State<'_, SmithedState>,
) -> Result<(), String> {
    let mut config = fmt_err(SmithedConfig::open(&state.project_dirs))?;
    if config.local_bundles.contains_key(&bundle_id) {
        config.local_bundles.remove(&bundle_id);
    } else {
        return Err("Bundle does not exist".into());
    }
    fmt_err(config.write(&state.project_dirs))?;

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
    let mut config = fmt_err(SmithedConfig::open(&state.project_dirs))?;
    if let Some(bundle) = config.local_bundles.get_mut(&bundle_id) {
        bundle.packs.push(pack);
    } else {
        return Err("Bundle does not exist".into());
    }

    fmt_err(config.write(&state.project_dirs))?;

    Ok(())
}

#[tauri::command]
pub async fn remove_pack_from_bundle(
    bundle_id: String,
    pack_id: String,
    state: tauri::State<'_, SmithedState>,
) -> Result<(), String> {
    let mut config = fmt_err(SmithedConfig::open(&state.project_dirs))?;
    if let Some(bundle) = config.local_bundles.get_mut(&bundle_id) {
        let index = bundle.packs.iter().position(|x| x.id == pack_id.as_str());
        if let Some(index) = index {
            bundle.packs.remove(index);
        } else {
            println!("Did not remove pack from bundle as it is not in the bundle");
        }
    } else {
        return Err("Bundle does not exist".into());
    }

    fmt_err(config.write(&state.project_dirs))?;

    Ok(())
}

#[tauri::command]
pub async fn get_pack_version_for_bundle(
    bundle_id: String,
    pack_id: String,
    state: tauri::State<'_, SmithedState>,
) -> Result<Option<String>, String> {
    let bundle = get_bundle_impl(&bundle_id, &state.project_dirs).await?;
    let pack = fmt_err(api::get_pack(&state.client, &pack_id).await)?;
    let version = pack.get_newest_version(&bundle.version);

    Ok(version.map(|x| x.name.clone()))
}

/// Get the packs in a bundle. Returns a list of tuples with the pack reference and data.
#[tauri::command]
pub async fn get_bundle_packs(
    bundle_id: String,
    state: tauri::State<'_, SmithedState>,
) -> Result<Vec<(PackReference, PackData)>, String> {
    let bundle = get_bundle_impl(&bundle_id, &state.project_dirs).await?;
    let mut out_packs = Vec::new();
    for pack in bundle.packs {
        let pack_data = api::get_pack(&state.client, &pack.id).await;
        let pack_data = fmt_err(pack_data)?;
        out_packs.push((pack, pack_data));
    }

    Ok(out_packs)
}

/// Get a remote bundle
#[tauri::command]
pub async fn get_remote_bundle(
    bundle_id: String,
    state: tauri::State<'_, SmithedState>,
) -> Result<PackBundle, String> {
    let bundle = fmt_err(api::get_bundle(&state.client, &bundle_id).await)?;
    Ok(bundle)
}

/// Import a bundle to a new local bundle with an ID
#[tauri::command]
pub async fn import_bundle(
    bundle_id: String,
    local_bundle_id: String,
    state: tauri::State<'_, SmithedState>,
) -> Result<(), String> {
    let bundle = fmt_err(api::get_bundle(&state.client, &bundle_id).await)?;
    let bundle = LocalBundleConfig {
        version: bundle.version,
        packs: bundle.packs,
    };
    add_bundle(local_bundle_id, bundle, state).await
}

/// Errors for importing a bundle
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ImportBundleError {
    UnsupportedVersion,
}

fn fmt_err<T, E: Debug>(r: Result<T, E>) -> Result<T, String> {
    r.map_err(|x| format!("{x:?}"))
}

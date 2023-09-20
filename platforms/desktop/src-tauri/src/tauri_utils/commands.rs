use crate::{mcvm::output::SmithedMCVMOutput, minecraft::launch::launch_instance};

#[tauri::command]
pub async fn launch_game(mut app_handle: tauri::AppHandle) -> Result<(), String> {
    let mut output = SmithedMCVMOutput::new(&mut app_handle);
    let res = launch_instance("example-client".into(), &mut output).await;
    res.map_err(|x| x.to_string())?;
    Ok(())
}

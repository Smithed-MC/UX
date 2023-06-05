



use crate::minecraft::{auth::{self}, launch::launch_instance};


#[tauri::command]
pub async fn get_device_code() -> Result<String, ()> {
    let result = auth::get_device_code().await;

    match result.is_err() {
        true => Ok(format!("{}", "error!")),
        false => Ok(result.unwrap()),
    }
}

#[tauri::command]
pub async fn get_minecraft_token(device_code: String) -> Result<String, String> {
    let result = auth::complete_auth(device_code).await;
    if result.is_err() {
        let err = result.unwrap_err().to_string();
        return Err(err);
    }

    let token = result.unwrap();

    Ok(token)
}

#[tauri::command]
pub async fn launch_game() -> Result<(), ()> {
    launch_instance("example-client".to_owned()).await.expect("Failed to launch client");
    Ok(())
}
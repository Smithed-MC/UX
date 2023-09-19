use std::error::Error;

use chrono::Utc;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use simple_error::bail;

use crate::mcvm::{add_user, MinecraftProfile};

pub const CLIENT_ID: &str = "0cee860d-3586-4214-8dc4-ab45b3ec0a54";

pub async fn get_device_code() -> Result<String, Box<dyn Error>> {
    let client = reqwest::Client::new();
    let auth_url = "https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode".to_owned();
    let resp = client
        .post(auth_url)
        .body("scope=XboxLive.signin offline_access&client_id=0cee860d-3586-4214-8dc4-ab45b3ec0a54")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .send()
        .await?;

    Ok(resp.text().await?)
}

#[derive(Serialize, Deserialize, Clone)]
pub struct MSAToken {
    pub access_token: String,
    pub refresh_token: String,
    pub expires: i64,
    pub created: String,
}

pub async fn get_msa_token(device_code: String) -> Result<MSAToken, Box<dyn Error>> {
    let client: reqwest::Client = reqwest::Client::new();
    loop {
        let resp: reqwest::Response = client
            .post("https://login.microsoftonline.com/consumers/oauth2/v2.0/token".to_owned())
            .body("grant_type=urn:ietf:params:oauth:grant-type:device_code&client_id=0cee860d-3586-4214-8dc4-ab45b3ec0a54&device_code=".to_owned() + &device_code)
            .header("Content-Type", "application/x-www-form-urlencoded").send().await?;

        let text: String = resp.text().await?;
        let json: Value = serde_json::from_str(&text)?;

        if json["error"] == Value::Null {
            return Ok(MSAToken {
                access_token: json["access_token"].to_string(),
                refresh_token: json["refresh_token"].to_string(),
                expires: json["expires_in"].as_i64().unwrap(),
                created: Utc::now().to_string(),
            });
        } else {
            match &(json["error"].to_string()) as &str {
                "authorizing_declined" => {
                    bail!("declined");
                }
                "bad_verification_code" => {
                    bail!("bad verification code");
                }
                "expired_token" => {
                    bail!("expired token");
                }
                _ => {}
            }
        }
    }
}

async fn post_json(url: String, body: String) -> Result<reqwest::Response, reqwest::Error> {
    let client: Client = Client::new();

    client
        .post(url)
        .body(body)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .send()
        .await
}

pub async fn get_xbl_token(msa_token: MSAToken) -> Result<String, Box<dyn Error>> {
    let body = json!({
        "Properties": {
            "AuthMethod": "RPS",
            "SiteName": "user.auth.xboxlive.com",
            "RpsTicket": "d=".to_owned() + &msa_token.access_token
        },
        "RelyingParty": "http://auth.xboxlive.com",
        "TokenType": "JWT"
    });

    let resp = post_json(
        "https://user.auth.xboxlive.com/user/authenticate".to_owned(),
        body.to_string(),
    )
    .await?;

    let text = resp.text().await?;
    let token_response: Value = serde_json::from_str(&text)?;

    Ok(token_response["Token"].as_str().unwrap().to_owned())
}

#[derive(Serialize, Deserialize)]
pub struct XSTSToken {
    token: String,
    user_hash: String,
}

fn value_to_str(value: &Value) -> String {
    value.as_str().unwrap().to_owned()
}

pub async fn get_xsts_token(xbl_token: String) -> Result<XSTSToken, Box<dyn Error>> {
    let body = json!( {
       "Properties": {
           "SandboxId": "RETAIL",
           "UserTokens": [
               xbl_token
           ]
       },
       "RelyingParty": "rp://api.minecraftservices.com/",
       "TokenType": "JWT"
    });
    // eprintln!("Body: {}", body);

    let resp = post_json(
        "https://xsts.auth.xboxlive.com/xsts/authorize".to_owned(),
        body.to_string(),
    )
    .await
    .expect("An error occured while posting");

    // eprintln!("Received response, status {}", resp.status());
    let text = resp.text().await?;
    // eprint!("XSTS JSON Response: {}", text);
    let token_response: Value = serde_json::from_str(&text)?;

    Ok(XSTSToken {
        token: value_to_str(&token_response["Token"]),
        user_hash: value_to_str(&token_response["DisplayClaims"]["xui"][0]["uhs"]),
    })
}

pub async fn get_minecraft_token(xsts_token: XSTSToken) -> Result<String, Box<dyn Error>> {
    let body = json!({
        "xtoken": format!("XBL3.0 x={};{}", &xsts_token.user_hash, &xsts_token.token),
        "platform": "PC_LAUNCHER"
    });
    // eprintln!("{}", body.to_string());
    let resp = post_json(
        "https://api.minecraftservices.com/launcher/login".to_owned(),
        body.to_string(),
    )
    .await?;

    let text = resp.text().await?;
    // eprintln!("Minecraft Response: {text}");
    let token_response: Value = serde_json::from_str(&text)?;

    Ok(value_to_str(&token_response["access_token"]))
}

pub async fn get_minecraft_profile(
    minecraft_token: String,
) -> Result<MinecraftProfile, Box<dyn Error>> {
    let client = Client::new();
    let resp = client
        .get("https://api.minecraftservices.com/minecraft/profile")
        .header("Authorization", format!("Bearer {}", minecraft_token))
        .send()
        .await?;

    eprintln!("Status {}", resp.status());
    let text = resp.text().await?;
    eprintln!("{}", text);
    let profile: MinecraftProfile = serde_json::from_str(&text).unwrap();

    Ok(profile)
}

pub async fn complete_auth(device_code: String) -> Result<String, Box<dyn Error>> {
    let msa_token: MSAToken = get_msa_token(device_code).await?;
    // eprintln!("MSA: {}", msa_token.access_token);
    let xbl_token: String = get_xbl_token(msa_token).await?;
    // eprintln!("XBL: {}", xbl_token);
    let xsts_token: XSTSToken = get_xsts_token(xbl_token).await.expect("Failed to get XSTS");
    // eprintln!("XSTS: {}", xsts_token.token);
    let minecraft_token = get_minecraft_token(xsts_token)
        .await
        .expect("Error while getting minecraft token");
    let profile = get_minecraft_profile(minecraft_token.clone()).await?;

    add_user(&profile, minecraft_token.clone()).await?;

    Ok(minecraft_token)
}

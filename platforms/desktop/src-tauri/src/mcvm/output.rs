use mcvm::shared::output::{MCVMOutput, MessageLevel};
use serde::Serialize;
use tauri::{AppHandle, Manager};

pub struct SmithedMCVMOutput {
    app: AppHandle,
}

impl SmithedMCVMOutput {
    pub fn new(app: AppHandle) -> Self {
        Self { app }
    }
}

impl MCVMOutput for SmithedMCVMOutput {
    fn display_text(&mut self, text: String, _level: MessageLevel) {
        println!("{text}");
        let _ = self.app.emit_all("mcvm_output_message", MessageEvent(text));
    }

    fn display_special_ms_auth(&mut self, url: &str, code: &str) {
        self.display_text("Showing auth info".into(), MessageLevel::Important);
        let _ = self.app.emit_all(
            "mcvm_display_auth_info",
            AuthDisplayEvent {
                url: url.to_owned(),
                device_code: code.to_owned(),
            },
        );
    }
}

/// Event for a message
#[derive(Clone, Serialize)]
pub struct MessageEvent(String);

/// Event for the auth display
#[derive(Clone, Serialize)]
pub struct AuthDisplayEvent {
    url: String,
    device_code: String,
}

/// Event for a yes-no prompt
#[derive(Clone, Serialize)]
pub struct YesNoPromptEvent {
    default: bool,
    message: String,
}

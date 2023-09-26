use mcvm::shared::output::{MCVMOutput, Message, MessageContents, MessageLevel};
use serde::Serialize;
use tauri::{AppHandle, Manager};

pub struct SmithedMCVMOutput {
    app: AppHandle,
}

impl SmithedMCVMOutput {
    pub fn new(app: AppHandle) -> Self {
        Self { app }
    }

    pub fn get_app_handle(self) -> AppHandle {
        self.app
    }
}

impl MCVMOutput for SmithedMCVMOutput {
    fn display_text(&mut self, text: String, _level: MessageLevel) {
        self.disp(text);
    }

    fn display_message(&mut self, message: Message) {
        if !message.level.at_least(&MessageLevel::Extra) {
            return;
        }
        match message.contents {
            MessageContents::Associated(assoc, msg) => match *assoc {
                MessageContents::Progress { current, total } => {
                    let _ = self.app.emit_all(
                        "mcvm_output_progress",
                        AssociatedProgressEvent {
                            current,
                            total,
                            message: msg.default_format(),
                        },
                    );
                }
                _ => self.disp(format!(
                    "({}) {}",
                    assoc.default_format(),
                    msg.default_format()
                )),
            },
            MessageContents::Header(text) => {
                let _ = self.app.emit_all("mcvm_output_header", MessageEvent(text));
            }
            msg => self.disp(msg.default_format()),
        }
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

impl SmithedMCVMOutput {
    fn disp(&mut self, text: String) {
        println!("{text}");
        let _ = self.app.emit_all("mcvm_output_message", MessageEvent(text));
    }
}

/// Event for a message
#[derive(Clone, Serialize)]
pub struct MessageEvent(String);

/// Event for an associated progressbar
#[derive(Clone, Serialize)]
pub struct AssociatedProgressEvent {
    pub current: u32,
    pub total: u32,
    pub message: String,
}

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

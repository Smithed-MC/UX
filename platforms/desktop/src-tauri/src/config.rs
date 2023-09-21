use std::{collections::HashMap, fs::File, io::BufReader, path::PathBuf};

use anyhow::Context;
use directories::ProjectDirs;
use serde::{Deserialize, Serialize};

use crate::api_types::PackReference;

/// Smithed configuration file
#[derive(Serialize, Deserialize)]
pub struct SmithedConfig {
    pub local_bundles: HashMap<String, LocalBundleConfig>,
}

/// Config for a  local launchable bundle
#[derive(Serialize, Deserialize)]
pub struct LocalBundleConfig {
    pub version: String,
    pub packs: Vec<PackReference>,
}

impl SmithedConfig {
    /// Opens the config at the default path
    pub fn open(dirs: &ProjectDirs) -> anyhow::Result<SmithedConfig> {
        let path = Self::path(dirs);
        if path.exists() {
            let file = File::open(path).context("Failed to open config file")?;
            let mut file = BufReader::new(file);
            let out = serde_json::from_reader(&mut file).context("Failed to parse config file")?;
            Ok(out)
        } else {
            Ok(Self::default())
        }
    }

    /// Writes the config to the config file
    pub fn write(self, dirs: &ProjectDirs) -> anyhow::Result<()> {
        let text = serde_json::to_string_pretty(&self).context("Failed to serialize config")?;

        let path = Self::path(dirs);
        std::fs::write(path, text).context("Failed to write config file")?;

        Ok(())
    }

    /// Get the path to the config
    fn path(dirs: &ProjectDirs) -> PathBuf {
        dirs.config_dir().join("smithed.json")
    }
}

impl Default for SmithedConfig {
    fn default() -> Self {
        SmithedConfig {
            local_bundles: HashMap::new(),
        }
    }
}

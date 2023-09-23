use serde::{Deserialize, Serialize};

/// A reference to a pack and its version, contained in a bundle
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PackReference {
    pub id: String,
    pub version: String,
}

/// Data for a pack
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PackData {
    pub id: String,
    pub versions: Vec<PackVersion>,
}

/// Single version for a pack
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PackVersion {
    pub name: String,
    pub downloads: PackVersionDownloads,
    pub supports: Vec<String>,
    pub dependencies: Vec<PackReference>,
}

/// Download links for a pack version
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PackVersionDownloads {
    pub datapack: reqwest::Url,
    #[serde(rename = "resourcepack")]
    pub resource_pack: reqwest::Url,
}

impl PackData {
    /// Get the newest version of this pack that supports a given Minecraft version
    pub fn get_newest_version(&self, minecraft_version: &str) -> Option<&PackVersion> {
        // Newest version is at the end, so we go in reverse order
        self.versions.iter().rev().find(|vers| {
            vers.supports
                .iter()
                .any(|supported| supported == minecraft_version)
        })
    }
}

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
    pub display: PackDisplay,
}

/// Display info for a pack
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PackDisplay {
    pub name: String,
    pub description: String,
    pub icon: String,
    pub hidden: bool,
    pub web_page: Option<String>,
    pub urls: Option<PackDisplayURLs>,
}

/// Display URLs for a pack
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PackDisplayURLs {
    pub homepage: Option<String>,
    pub source: Option<String>,
    pub discord: Option<String>,
}

/// Single version for a pack
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PackVersion {
    pub name: String,
    pub downloads: PackVersionDownloads,
    pub supports: Vec<String>,
    pub dependencies: Option<Vec<PackReference>>,
}

/// Download links for a pack version
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PackVersionDownloads {
    pub datapack: Option<String>,
    #[serde(rename = "resourcepack")]
    pub resource_pack: Option<String>,
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

/// Data for a bundle
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PackBundle {
    pub owner: String,
    pub name: String,
    pub version: String,
    pub packs: Vec<PackReference>,
    pub public: bool,
    pub uid: Option<String>,
}

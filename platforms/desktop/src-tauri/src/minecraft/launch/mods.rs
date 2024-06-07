use std::path::Path;

use anyhow::{bail, Context};
use mcvm::core::net::download;
use reqwest::Client;

/// Install mods so that datapacks work
pub async fn install_mods(
    client: &Client,
    mods_dir: &Path,
    mc_version: &str,
) -> anyhow::Result<()> {
    // We need Paxi for global datapacks and resource packs, which depends on Yung's API and Fabric API
    let (paxi, yungs, fabric_api) = match mc_version {
        "1.17" => (
			"https://www.curseforge.com/api/v1/mods/418881/files/3120081/download",
            None,
            "https://cdn.modrinth.com/data/P7dR8mSH/versions/0.36.0%2B1.17/fabric-api-0.36.0%2B1.17.jar"
		),
        "1.17.1" => (
			"https://www.curseforge.com/api/v1/mods/418881/files/3425423/download",
            None,
            "https://cdn.modrinth.com/data/P7dR8mSH/versions/0.46.1%2B1.17/fabric-api-0.46.1%2B1.17.jar"
		),
        "1.18" => (
			"https://www.curseforge.com/api/v1/mods/418881/files/3631270/download",
            None,
            "https://cdn.modrinth.com/data/P7dR8mSH/versions/0.44.0%2B1.18/fabric-api-0.44.0%2B1.18.jar"
		),
		"1.18.1" => (
			"https://www.curseforge.com/api/v1/mods/418881/files/3631270/download",
            Some("https://www.curseforge.com/api/v1/mods/421649/files/4428185/download"),
            "https://cdn.modrinth.com/data/P7dR8mSH/versions/0.46.6%2B1.18/fabric-api-0.46.6%2B1.18.jar"
		),
        "1.18.2" => (
			"https://www.curseforge.com/api/v1/mods/418881/files/3706642/download",
            Some("https://www.curseforge.com/api/v1/mods/421649/files/4428185/download"),
            "https://cdn.modrinth.com/data/P7dR8mSH/versions/95QMsRyb/fabric-api-0.76.0%2B1.18.2.jar"
		),
        "1.19" => (
			"https://cdn.modrinth.com/data/CU0PAyzb/versions/PGslvGfk/Paxi-1.19.2-Fabric-3.0.jar",
            Some("https://cdn.modrinth.com/data/Ua7DFN59/versions/IxuGYnWF/YungsApi-1.19.2-Fabric-3.8.9.jar"),
            "https://cdn.modrinth.com/data/P7dR8mSH/versions/0.58.0%2B1.19/fabric-api-0.58.0%2B1.19.jar"
		),
        "1.19.2" => (
			"https://cdn.modrinth.com/data/CU0PAyzb/versions/PGslvGfk/Paxi-1.19.2-Fabric-3.0.jar",
            Some("https://cdn.modrinth.com/data/Ua7DFN59/versions/IxuGYnWF/YungsApi-1.19.2-Fabric-3.8.9.jar"),
            "https://cdn.modrinth.com/data/P7dR8mSH/versions/fO05PwUR/fabric-api-0.76.1%2B1.19.2.jar"
		),
        "1.19.4" => (
			"https://cdn.modrinth.com/data/CU0PAyzb/versions/t0EvcKWk/Paxi-1.19.4-Fabric-3.2.0.jar",
			Some("https://cdn.modrinth.com/data/Ua7DFN59/versions/h32n7OPC/YungsApi-1.19.4-Fabric-3.10.1.jar"),
			"https://cdn.modrinth.com/data/P7dR8mSH/versions/LKgVmlZB/fabric-api-0.87.0%2B1.19.4.jar"
		),
    	"1.20" => (
			"https://cdn.modrinth.com/data/CU0PAyzb/versions/UVPLKCqf/Paxi-1.20-Fabric-4.0.jar",
			Some("https://cdn.modrinth.com/data/Ua7DFN59/versions/NmrTF2A5/YungsApi-1.20-Fabric-4.0.1.jar"),
			"https://cdn.modrinth.com/data/P7dR8mSH/versions/n2c5lxAo/fabric-api-0.83.0%2B1.20.jar"
		),
		"1.20.1" => (
			"https://cdn.modrinth.com/data/CU0PAyzb/versions/UVPLKCqf/Paxi-1.20-Fabric-4.0.jar",
			Some("https://cdn.modrinth.com/data/Ua7DFN59/versions/NmrTF2A5/YungsApi-1.20-Fabric-4.0.1.jar"),
			"https://cdn.modrinth.com/data/P7dR8mSH/versions/1sf8i9fy/fabric-api-0.89.0%2B1.20.1.jar"
		),
		_ => bail!("Unsupported Minecraft version"),
	};

    let paxi_path = mods_dir.join("Smithed_mod_Paxi.jar");
    let yungs_path = mods_dir.join("Smithed_mod_YUNGS_API.jar");
    let fabric_api_path = mods_dir.join("Smithed_mod_Fabric_API.jar");

    download::file(paxi, &paxi_path, client)
        .await
        .context("Failed to download Paxi")?;
    if let Some(yungs) = yungs {
        download::file(yungs, &yungs_path, client)
            .await
            .context("Failed to download YUNG's API")?;
    }
    download::file(fabric_api, &fabric_api_path, client)
        .await
        .context("Failed to download Fabric API")?;

    Ok(())
}

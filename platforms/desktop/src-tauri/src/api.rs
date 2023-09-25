use std::{
    fs::File,
    io::{BufWriter, Cursor},
    path::Path,
};

use mcvm::net::download;
use reqwest::Client;
use zip::ZipArchive;

use crate::api_types::{PackData, PackReference, PackBundle};

/// Get a pack from the API
pub async fn get_pack(client: &Client, id: &str) -> anyhow::Result<PackData> {
    let url = format!("{API_URL}/packs/{id}");
    // let text = download::text(url.clone(), client).await?;
    // println!("Pack response: {text}");
    download::json(url, client).await
}

/// Get a bundle from the API
pub async fn get_bundle(client: &Client, id: &str) -> anyhow::Result<PackBundle> {
    let url = format!("{API_URL}/bundles/{id}");
    // let text = download::text(url.clone(), client).await?;
    // println!("Pack response: {text}");
    download::json(url, client).await
}

/// Download and weld packs from the API
pub async fn download_packs(
    client: &Client,
    packs: Vec<PackReference>,
    datapacks_dir: &Path,
    resource_packs_dir: &Path,
) -> anyhow::Result<()> {
    println!("DOWNLOADING");
    let url = format_download_packs_url(packs);

    let bytes = download::bytes(url, client).await?;
    println!("DONE DOWNLOADING");
    let mut cursor = Cursor::new(bytes);
    let mut zip = ZipArchive::new(&mut cursor)?;
    println!("ZIP OPENED WITH SIZE {}", zip.len());
    for i in 0..zip.len() {
        let mut file = zip.by_index(i)?;
        println!("OPENED ZIP FILE");
        let path = if file.name().contains("resource") {
            Some(resource_packs_dir)
        } else if file.name().contains("datapack") {
            Some(datapacks_dir)
        } else {
            None
        };
        if let Some(path) = path {
            let out_file = File::create(path.join(WELDED_PACK_FILENAME))?;
            println!("OPENED OUT FILE");
            let mut out_file = BufWriter::new(out_file);
            println!("COPYING FILE");
            std::io::copy(&mut file, &mut out_file)?;
            println!("DONE COPYING FILE");
        }
    }
    println!("EXTRACTED");

    Ok(())
}

fn format_download_packs_url(packs: Vec<PackReference>) -> String {
    let mut url = format!("{API_URL}/download");
    if !packs.is_empty() {
        url.push('?');
    }

    for (i, pack) in packs.iter().enumerate() {
        let mut param = String::new();
        if i > 0 {
            param.push('&');
        }
        param.push_str(&format!("pack={}@{}", pack.id, pack.version));
        url.push_str(&param);
    }

    url
}

/// The API URL
pub const API_URL: &str = "https://api.smithed.dev/v2";

/// The filename of the welded pack
pub const WELDED_PACK_FILENAME: &str = "SmithedWeldedPack.zip";

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_download_packs_url_format() {
        let packs = vec![
            PackReference {
                id: "foo".into(),
                version: "1".into(),
            },
            PackReference {
                id: "bar".into(),
                version: "1.2.5".into(),
            },
        ];
        let url = format_download_packs_url(packs);
        assert_eq!(url, format!("{API_URL}/download?pack=foo@1&pack=bar@1.2.5"))
    }
}

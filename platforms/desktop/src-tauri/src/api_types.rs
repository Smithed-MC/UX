use serde::{Serialize, Deserialize};

/// A reference to a pack and its version, contained in a bundle
#[derive(Serialize, Deserialize, Clone)]
pub struct PackReference {
	pub id: String,
	pub version: String,
}

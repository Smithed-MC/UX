// Tauri types

export type ConfiguredLocalBundles = {
	[id: string]: LocalBundleConfig;
};

export interface LocalBundleConfig {
	version: string;
	packs: PackReference[];
}

export interface PackReference {
	id: string;
	version: string;
}

// Tauri types

import { MinecraftVersion, PackReference } from "data-types";

export type ConfiguredLocalBundles = {
	[id: string]: LocalBundleConfig;
};

export interface LocalBundleConfig {
	version: MinecraftVersion;
	packs: PackReference[];
}

export const availableMinecraftVersionsChooseBox: ChooseBoxChoice[] = [
	{ content: "1.17", value: "1.17" },
	{ content: "1.17.1", value: "1.17.1" },
	{ content: "1.18", value: "1.18" },
	{ content: "1.18.1", value: "1.18.1" },
	{ content: "1.18.2", value: "1.18.2" },
	{ content: "1.19", value: "1.19" },
	{ content: "1.19.4", value: "1.19.4" },
	{ content: "1.20", value: "1.20" },
	{ content: "1.20.1", value: "1.20.1" },
];

export type ChooseBoxChoice = { value: string; content: string };

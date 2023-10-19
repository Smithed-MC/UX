// Tauri types

import {
	MinecraftVersion,
	PackReference,
	supportedMinecraftVersions,
} from '@smithed-mc/data-types';

export type ConfiguredLocalBundles = {
	[id: string]: LocalBundleConfig;
};

export interface LocalBundleConfig {
	version: MinecraftVersion;
	packs: PackReference[];
}

export const availableMinecraftVersionsChooseBox: ChooseBoxChoice[] =
	supportedMinecraftVersions.map((version) => {
		return { content: version, value: version };
	});

export type ChooseBoxChoice = { value: string; content: string };

export interface AssociatedProgressEvent {
	current: number;
	total: number;
	message: string;
}

export type OutputMessageEvent = string;

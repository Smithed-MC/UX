import { invoke } from "@tauri-apps/api"
import { ChooseBoxChoice, ConfiguredLocalBundles } from "./types"

export async function getChooseBoxBundles() {
	try {
		const choices: ConfiguredLocalBundles = await invoke("list_bundles")
		let choicesMapped: ChooseBoxChoice[] = []
		for (let choice in choices) {
			choicesMapped.push({ value: choice, content: choice })
		}

		return choicesMapped
	} catch (e) {
		console.error("Failed to get available bundles: " + e)
	}

	return []
}

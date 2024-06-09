import { ChooseBox, IconTextButton, svg } from "components"
import { useEffect, useState } from "react"
import { ChooseBoxChoice, LocalBundleConfig } from "../types"
import { getChooseBoxBundles } from "../util"
import { invoke } from "@tauri-apps/api"
import { PackReference } from "data-types"

function AddToBundle({ onFinish, packId }: AddToBundleProps) {
	const [selected, setSelected] = useState<string | undefined>(undefined)
	const [available, setAvailable] = useState<ChooseBoxChoice[]>([])

	let [error, setError] = useState<
		undefined | "none_selected" | "unsupported_pack" | "already_in_bundle"
	>(undefined)

	useEffect(() => {
		async function get() {
			let bundles = await getChooseBoxBundles()
			setAvailable(bundles)
		}
		get()
	}, [])

	async function getPackVersion() {
		try {
			const newestVersion: string | undefined = await invoke(
				"get_pack_version_for_bundle",
				{ bundleId: selected, packId: packId }
			)
			return newestVersion
		} catch (e) {
			console.error("Failed to check for pack support: " + e)
			return undefined
		}
	}

	async function isInBundle(bundleId: string) {
		try {
			let bundle: LocalBundleConfig = await invoke("get_bundle", {
				bundleId: bundleId,
			})
			return bundle.packs.find((pack) => pack.id == packId) !== undefined
		} catch (e) {
			console.error("Failed to check if bundle exists: " + e)
			return true
		}
	}

	return (
		<div className="container popup">
			<h2>Add pack to local bundle</h2>
			<ChooseBox
				className={error === "none_selected" ? "invalidInput" : ""}
				choices={available}
				placeholder="Choose a bundle"
				onChange={(val) => {
					if (!Array.isArray(val)) {
						setSelected(val)
					}
				}}
			/>
			<br />
			<div className="container" style={{ flexFlow: "row", gap: "1rem" }}>
				<IconTextButton
					className="highlightButtonLike"
					text="Cancel"
					icon={svg.Cross}
					style={{ width: "fit-content" }}
					onClick={() => {
						onFinish(undefined, undefined)
					}}
				/>
				<IconTextButton
					className={
						error == "unsupported_pack"
							? "invalidInput"
							: "accentedButtonLike"
					}
					title={
						error == "unsupported_pack"
							? "Pack is unsupported for this Minecraft version"
							: ""
					}
					text="Add to bundle"
					icon={svg.Plus}
					style={{ width: "fit-content" }}
					onClick={async () => {
						if (selected === undefined) {
							setError("none_selected")
							return
						}
						const packVersion = await getPackVersion()
						if (packVersion === undefined || packVersion === null) {
							setError("unsupported_pack")
							return
						}
						if (await isInBundle(selected)) {
							setError("already_in_bundle")
							return
						}
						onFinish(selected, packVersion)
					}}
				/>
			</div>
		</div>
	)
}

export interface AddToBundleProps {
	packId: string
	onFinish: (bundle?: string, version?: string) => {}
}

export default AddToBundle

import { ChooseBox, IconInput, IconTextButton, svg } from "components"
import { useEffect, useState } from "react"
import { ChooseBoxChoice, LocalBundleConfig } from "../types"
import { getChooseBoxBundles } from "../util"
import { invoke } from "@tauri-apps/api"
import { PackBundle } from "data-types"

function ImportBundle({ bundleId, onFinish }: ImportBundleProps) {
	const [bundle, setBundle] = useState<PackBundle | undefined>(undefined)
	const [name, setName] = useState("")

	let [error, setError] = useState<
		undefined | "bundle_exists" | "empty_name"
	>(undefined)

	useEffect(() => {
		async function get() {
			const remoteBundle: PackBundle = await invoke("get_remote_bundle", {
				bundleId: bundleId,
			})
			setBundle(remoteBundle)
			setName(remoteBundle.name)
		}
		if (bundle === undefined) {
			get()
		}
	})

	async function checkIfExists() {
		try {
			let exists: boolean = await invoke("bundle_exists", {
				bundleId: name,
			})
			return exists
		} catch (e) {
			console.error("Failed to check if bundle exists: " + e)
			return true
		}
	}

	return (
		<div className="container popup">
			<h2>Import bundle</h2>
			<IconInput
				type="text"
				className={
					error == "bundle_exists" || error == "empty_name"
						? "invalidInput"
						: ""
				}
				title={
					error == "bundle_exists"
						? "Bundle with this name already exists"
						: error == "empty_name"
							? "Name cannot be empty"
							: ""
				}
				placeholder="Bundle name"
				icon={svg.Edit}
				onChange={(e) => {
					setName(e.currentTarget.value)
				}}
				value={name}
			/>
			<br />
			<div className="container" style={{ flexFlow: "row", gap: "1rem" }}>
				<IconTextButton
					className="highlightButtonLike"
					text="Cancel"
					icon={svg.Cross}
					style={{ width: "fit-content" }}
					onClick={async () => {
						onFinish(undefined, undefined)
					}}
				/>
				<IconTextButton
					className={"accentedButtonLike"}
					text="Import"
					icon={svg.Download}
					reverse={true}
					style={{ width: "fit-content" }}
					onClick={async () => {
						if (name === "") {
							setError("empty_name")
							return
						}
						if (await checkIfExists()) {
							setError("bundle_exists")
							return
						}
						if (bundle === undefined) {
							return
						}
						const bundleConfig: LocalBundleConfig = {
							version: bundle.version,
							packs: bundle.packs,
						}
						onFinish(name, bundleConfig)
					}}
				/>
			</div>
		</div>
	)
}

export interface ImportBundleProps {
	bundleId: string
	onFinish: (
		id: string | undefined,
		bundle: LocalBundleConfig | undefined
	) => {}
}

export default ImportBundle

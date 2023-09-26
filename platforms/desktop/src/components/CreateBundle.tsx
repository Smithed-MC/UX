import { ChooseBox, IconInput, IconTextButton, svg } from "components";
import { MinecraftVersion } from "data-types";
import { availableMinecraftVersionsChooseBox } from "../types";
import { invoke } from "@tauri-apps/api";
import { useState } from "react";

function CreateBundle({ onFinish }: CreateBundleProps) {
	const [name, setName] = useState("");
	const [version, setVersion] = useState<MinecraftVersion>("1.20.1");
	const [error, setError] = useState<
		undefined | "bundle_exists" | "empty_name" | "name_too_long"
	>(undefined);

	async function checkIfExists() {
		try {
			let exists: boolean = await invoke("bundle_exists", { bundleId: name });
			return exists;
		} catch (e) {
			console.error("Failed to check if bundle exists: " + e);
			return true;
		}
	}

	return (
		<div className="container popup createBundlePopup">
			<h2>Create new bundle</h2>
			<IconInput
				type="text"
				className={
					error == "bundle_exists" ||
					error == "empty_name" ||
					error == "name_too_long"
						? "invalidInput"
						: ""
				}
				title={
					error == "bundle_exists"
						? "Bundle with this name already exists"
						: error == "empty_name"
						? "Name cannot be empty"
						: error == "name_too_long"
						? "Name must be less than 17 characters"
						: ""
				}
				placeholder="Bundle name"
				icon={svg.Edit}
				onChange={(e) => {
					setName(e.currentTarget.value);
				}}
				value={name}
			/>
			<br />
			<ChooseBox
				choices={availableMinecraftVersionsChooseBox}
				placeholder="Select version"
				defaultValue={"1.20.1"}
				onChange={(value) => {
					if (!Array.isArray(value)) {
						setVersion(value);
					}
				}}
				style={{ width: "100%" }}
			/>
			<br />
			<br />
			<div className="container" style={{ flexFlow: "row", gap: "1rem" }}>
				<IconTextButton
					className="highlightButtonLike"
					text="Cancel"
					icon={svg.Cross}
					style={{ width: "fit-content" }}
					onClick={async () => {
						onFinish(undefined, undefined);
					}}
				/>
				<IconTextButton
					className="accentedButtonLike"
					text="Save bundle"
					style={{ width: "fit-content" }}
					onClick={async () => {
						if (name === "") {
							setError("empty_name");
						} else if (await checkIfExists()) {
							setError("bundle_exists");
						} else if (name.length > 16) {
							setError("name_too_long");
						} else {
							onFinish(name, version);
						}
					}}
				/>
			</div>
		</div>
	);
}

interface CreateBundleProps {
	onFinish: (
		name: string | undefined,
		version: MinecraftVersion | undefined
	) => void;
}

export default CreateBundle;

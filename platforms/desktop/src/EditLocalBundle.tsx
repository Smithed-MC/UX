import { invoke } from "@tauri-apps/api";
import { useLoaderData, useNavigate } from "react-router-dom";
import { LocalBundleConfig } from "./types";
import { IconTextButton, svg } from "components";

export async function loadEditBundleData({
	params,
}: any): Promise<BundleData | null> {
	const id: string = params.id;

	try {
		const bundle: LocalBundleConfig = await invoke("get_bundle", {
			bundleId: id,
		});
		return { id, bundle };
	} catch (e) {
		console.error("Failed to get local bundle data: " + e);
		return null;
	}
}

interface BundleData {
	id: string;
	bundle: LocalBundleConfig;
}

function EditLocalBundle({}: EditLocalBundleProps) {
	const data = useLoaderData() as BundleData;
	const id: string = data.id;
	const bundle: LocalBundleConfig = data.bundle;
	const navigate = useNavigate();

	async function deleteBundle() {
		try {
			await invoke("remove_bundle", { bundleId: id });
			navigate("/launch");
		} catch (e) {
			console.error("Failed to delete bundle: " + e);
		}
	}

	return (
		<div className="container editLocalBundleContainer">
			<div
				className="container"
				style={{ flexDirection: "row", gap: "0.7rem" }}
			>
				<svg.Edit />
				<div className="bigText">Editing local bundle '{id}'</div>
			</div>
			<br />
			<br />
			<IconTextButton
				className="disturbingButtonLike"
				text="Delete bundle"
				icon={svg.Cross}
				style={{ width: "fit-content" }}
				onClick={deleteBundle}
			/>
		</div>
	);
}

export interface EditLocalBundleProps {}

export default EditLocalBundle;

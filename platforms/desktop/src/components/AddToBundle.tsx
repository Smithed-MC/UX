import { ChooseBox, IconTextButton, svg } from "components";
import { useEffect, useState } from "react";
import { ChooseBoxChoice } from "../types";
import { getChooseBoxBundles } from "../util";

function AddToBundle({ onFinish }: AddToBundleProps) {
	const [selected, setSelected] = useState<string | undefined>(undefined);
	const [available, setAvailable] = useState<ChooseBoxChoice[]>([]);

	let [error, setError] = useState<undefined | "none_selected">(undefined);

	useEffect(() => {
		async function get() {
			let bundles = await getChooseBoxBundles();
			setAvailable(bundles);
		}
		get();
	});

	return (
		<div className="container popup">
			<h2>Add pack to local bundle</h2>
			<ChooseBox
				className={error == "none_selected" ? "invalidInput" : ""}
				choices={available}
				placeholder="Choose a bundle"
				// style={{width: "150%"}}
				onChange={(val) => {
					if (!Array.isArray(val)) {
						setSelected(val);
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
					onClick={async () => {
						onFinish(undefined);
					}}
				/>
				<IconTextButton
					className="accentedButtonLike"
					text="Add to bundle"
					icon={svg.Plus}
					style={{ width: "fit-content" }}
					onClick={async () => {
						if (selected === undefined) {
							setError("none_selected");
						} else {
							onFinish(selected);
						}
					}}
				/>
			</div>
		</div>
	);
}

export interface AddToBundleProps {
	onFinish: (bundle?: string) => {};
}

export default AddToBundle;

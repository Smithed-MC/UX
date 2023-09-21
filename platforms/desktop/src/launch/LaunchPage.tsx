import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Event, listen } from "@tauri-apps/api/event";
import { clipboard } from "@tauri-apps/api";
import { WebviewWindow } from "@tauri-apps/api/window";
import { ChooseBox, IconInput, IconTextButton, svg } from "components";
import { ConfiguredLocalBundles, LocalBundleConfig } from "../types";

import "./LaunchPage.css";

function LaunchPage() {
	const [authDisplay, setAuthDisplay] = useState<AuthDisplayEvent | undefined>(
		undefined
	);

	async function launchGame() {
		console.log("3 2 1 blastoff!");
		try {
			let launch_promise = invoke("launch_game");
			let listener_promise = listen(
				"mcvm_display_auth_info",
				(event: Event<AuthDisplayEvent>) => {
					let url = event.payload.url;
					let device_code = event.payload.device_code;
					setAuthDisplay({ url, device_code });
				}
			);

			await Promise.all([launch_promise, listener_promise]);
		} catch (e) {
			console.error("Failed to launch game: " + e);
		}
	}

	async function stopGame() {
		console.log("Stopping game...");
		try {
			await invoke("stop_game");
		} catch (e) {
			console.error("Failed to stop game: " + e);
		}
	}

	return (
		<div className="container">
			<br />
			{authDisplay && <AuthPopup {...authDisplay} />}
			<LaunchFooter onLaunch={launchGame} onCancel={stopGame} />
		</div>
	);
}

function LaunchFooter({ onLaunch, onCancel }: LaunchFooterProps) {
	return (
		<div className="launchFooter container">
			<div className="launchFooterLeft container">
				<BundleSelector />
			</div>
			<div className="launchFooterCenter container">
				<LaunchButton onLaunch={onLaunch} onCancel={onCancel} />
			</div>
			<div className="launchFooterRight container"></div>
		</div>
	);
}

interface LaunchFooterProps {
	onLaunch: () => void;
	onCancel: () => void;
}

function LaunchButton({ onLaunch, onCancel }: LaunchButtonProps) {
	let [state, setState] = useState(LaunchButtonState.ClickToLaunch);

	function onClick() {
		if (state == LaunchButtonState.ClickToLaunch) {
			setState(LaunchButtonState.Running);
			onLaunch();
		} else if (state == LaunchButtonState.ClickToCancel) {
			onCancel();
			setState(LaunchButtonState.ClickToLaunch);
		}
	}
	return (
		<div id="launch-button" className="launchButton">
			<IconTextButton
				className={"accentedButtonLike"}
				text={
					state == LaunchButtonState.ClickToLaunch
						? "Launch"
						: state == LaunchButtonState.Running
						? "Running"
						: state == LaunchButtonState.ClickToCancel
						? "Click to cancel"
						: "Invalid state"
				}
				icon={
					state == LaunchButtonState.ClickToLaunch
						? svg.Play
						: state == LaunchButtonState.Running
						? "..."
						: state == LaunchButtonState.ClickToCancel
						? svg.Cross
						: "Invalid state"
				}
				style={{ width: "fit-content" }}
				onClick={onClick}
				onMouseOver={() => {
					if (state == LaunchButtonState.Running) {
						setState(LaunchButtonState.ClickToCancel);
					}
				}}
				onMouseLeave={() => {
					if (state == LaunchButtonState.ClickToCancel) {
						setState(LaunchButtonState.Running);
					}
				}}
				reverse={state == LaunchButtonState.Running}
			/>
		</div>
	);
}

interface LaunchButtonProps {
	onLaunch: () => void;
	onCancel: () => void;
}

enum LaunchButtonState {
	ClickToLaunch = "clickToLaunch",
	Running = "running",
	ClickToCancel = "clickToCancel",
}

function BundleSelector({}: BundleSelectorProps) {
	type Choice = { value: string; content: string };

	let [available, setAvailable] = useState<Choice[]>([]);
	let [showCreate, setShowCreate] = useState(false);

	useEffect(() => {
		updateChoices();
	});

	async function updateChoices() {
		try {
			const choices: ConfiguredLocalBundles = await invoke("list_bundles");
			let choicesMapped: Choice[] = [];
			for (let choice in choices) {
				choicesMapped.push({ value: choice, content: choice });
			}

			choicesMapped.push({ value: "__createNew", content: "Create new" });

			setAvailable(choicesMapped);
		} catch (e) {
			console.error("Failed to get available bundles: " + e);
		}
	}

	function createNew() {
		setShowCreate(true);
	}

	async function addBundle(name: string) {
		setShowCreate(false);
		
		try {
			// await invoke("add_bundle", { bundle_id: name, bundle:  });
		} catch (e) {
			console.error("Failed to add bundle: " + e);
		}
	}

	return (
		<>
			<div className="bundleSelector">
				<ChooseBox
					choices={available}
					placeholder="Bundle"
					flip={true}
					beforeOpen={updateChoices}
					onChange={(value) => {
						if (value == "__createNew") {
							createNew();
						}
					}}
				/>
			</div>
			{showCreate && <CreateBundlePopup onFinish={addBundle} />}
		</>
	);
}

interface BundleSelectorProps {}

interface AuthDisplayEvent {
	url: string;
	device_code: string;
}

function AuthPopup({ url, device_code }: AuthDisplayEvent) {
	return (
		<div className="container launchPopup authPopup">
			Copy this code:
			<br />
			<br />
			<CopyCodeButton code={device_code} />
			<br />
			Then open the login page:
			<br />
			<br />
			<LoginWindowButton url={url} />
		</div>
	);
}

function CopyCodeButton({ code }: CopyCodeButtonProps) {
	let [clicked, setClicked] = useState(false);

	return (
		<IconTextButton
			className={clicked ? "successButtonLike" : "accentedButtonLike"}
			text={clicked ? "Copied!" : "Click to copy"}
			icon={clicked ? svg.Check : svg.Copy}
			style={{ width: "fit-content" }}
			onClick={async () => {
				setClicked(true);
				await clipboard.writeText(code);
				setTimeout(() => {
					setClicked(false);
				}, 3000);
			}}
		/>
	);
}

interface CopyCodeButtonProps {
	code: string;
}

function LoginWindowButton({ url }: LoginWindowButtonProps) {
	let [opening, setOpening] = useState(false);

	return (
		<IconTextButton
			className={opening ? "buttonLike" : "accentedButtonLike"}
			text={opening ? "Opening..." : "Open Login Page"}
			icon={svg.Globe}
			style={{ width: "fit-content" }}
			onClick={() => {
				setOpening(true);
				new WebviewWindow("microsoft_login", {
					url: url,
				});
				setTimeout(() => {
					setOpening(false);
				}, 3000);
			}}
		/>
	);
}

interface LoginWindowButtonProps {
	url: string;
}

function CreateBundlePopup({ onFinish }: CreateBundlePopupProps) {
	let [name, setName] = useState("");

	return (
		<div className="container launchPopup createBundlePopup">
			<h2>Create new bundle</h2>
			<IconInput
				type="email"
				placeholder="Bundle name"
				icon={svg.Edit}
				onChange={(e) => {
					setName(e.currentTarget.value);
				}}
				value={name}
			/>
			<IconTextButton
				className="accentedButtonLike"
				text="Save bundle"
				icon={svg.Save}
				style={{ width: "fit-content" }}
				onClick={async () => {
					onFinish(name);
				}}
			/>
		</div>
	);
}

interface CreateBundlePopupProps {
	onFinish: (name: string) => void;
}

export default LaunchPage;

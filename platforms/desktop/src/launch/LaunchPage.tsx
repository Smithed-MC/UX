import "./LaunchPage.css";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Event, listen } from "@tauri-apps/api/event";
import { app, clipboard } from "@tauri-apps/api";
import { WebviewWindow } from "@tauri-apps/api/window";
import {
	ChooseBox,
	IconInput,
	IconTextButton,
	SvgButton,
	svg,
} from "components";
import {
	ChooseBoxChoice,
	ConfiguredLocalBundles,
	LocalBundleConfig,
	availableMinecraftVersionsChooseBox,
} from "../types";
import { MinecraftVersion } from "data-types";
import { Smithed } from "components/svg";
import { getChooseBoxBundles } from "../util";

function LaunchPage() {
	const [authDisplay, setAuthDisplay] = useState<AuthDisplayEvent | undefined>(
		undefined
	);
	const [bundle, setBundle] = useState<string | undefined>(undefined);
	const [online, setOnline] = useState(true);
	const [appVersion, setAppVersion] = useState<undefined | string>(undefined);

	useEffect(() => {
		async function getVersion() {
			const version = await app.getVersion();
			setAppVersion(version);
		}
		if (appVersion == undefined) {
			getVersion();
		}
	});

	async function launchGame() {
		console.log("3 2 1 blastoff!");
		try {
			let launch_promise = invoke("launch_game", { bundleId: bundle });
			let auth_listener_promise = listen(
				"mcvm_display_auth_info",
				(event: Event<AuthDisplayEvent>) => {
					let url = event.payload.url;
					let device_code = event.payload.device_code;
					setAuthDisplay({ url, device_code });
				}
			);
			let close_listener_promise = listen("game_finished", () => {
				setAuthDisplay(undefined);
			});

			await Promise.all([
				launch_promise,
				auth_listener_promise,
				close_listener_promise,
			]);
		} catch (e) {
			console.error("Failed to launch game: " + e);
		}
	}

	async function stopGame() {
		console.log("Stopping game...");
		setAuthDisplay(undefined);
		try {
			await invoke("stop_game");
		} catch (e) {
			console.error("Failed to stop game: " + e);
		}
	}

	return (
		<div className="container">
			<div className="container smithedLogoContainer">
				<Smithed className="bigSmithedLogo" />
				<div
					className="bigSmithedText"
					style={{
						fontSize: "24px",
						lineHeight: "30px",
						fontWeight: "700",
						fontFamily: "Lexend",
						color: "var(--foreground)",
						textDecoration: "none",
					}}
				>
					Smithed
				</div>
				<div
					className="smithedVersion"
					style={{
						fontSize: "24px",
						lineHeight: "30px",
						fontWeight: "700",
						fontFamily: "Lexend",
						color: "var(--highlight)",
						textDecoration: "none",
					}}
				>
					{appVersion}
				</div>
			</div>
			{authDisplay && <AuthPopup {...authDisplay} />}
			<LaunchFooter
				onLaunch={launchGame}
				onCancel={stopGame}
				onSelectBundle={setBundle}
				onSetOnline={setOnline}
			/>
		</div>
	);
}

function LaunchFooter({
	onLaunch,
	onCancel,
	onSelectBundle,
	onSetOnline,
}: LaunchFooterProps) {
	const [bundleSelected, setBundleSelected] = useState(false);
	const [isOnline, setIsOnline] = useState(true);
	const [error, setError] = useState<undefined | "no_bundle">(undefined);

	async function tryLaunch() {
		if (!bundleSelected) {
			setError("no_bundle");
			return;
		}
		onLaunch();
	}

	return (
		<div className="launchFooter container">
			<div className="launchFooterLeft container">
				<BundleSelector
					onSetBundle={(id) => {
						onSelectBundle(id);
						setBundleSelected(true);
					}}
				/>
			</div>
			<div className="launchFooterCenter container">
				<LaunchButton
					onLaunch={tryLaunch}
					onCancel={onCancel}
					bundleSelected={bundleSelected}
					error={error == "no_bundle" ? "No bundle selected" : ""}
				/>
			</div>
			<div className="launchFooterRight container">
				<ChooseBox
					choices={[
						{
							value: "online",
							content: "Play online",
						},
						{
							value: "offline",
							content: "Play offline",
						},
					]}
					placeholder="Mode"
					defaultValue="online"
					flip={true}
					onChange={(value) => {
						if (value == "online") {
							setIsOnline(true);
						} else if (value == "offline") {
							setIsOnline(false);
						}
					}}
				/>
			</div>
		</div>
	);
}

interface LaunchFooterProps {
	onLaunch: () => void;
	onCancel: () => void;
	onSelectBundle: (id: string) => void;
	onSetOnline: (online: boolean) => void;
}

function LaunchButton({
	bundleSelected,
	onLaunch,
	onCancel,
	error,
}: LaunchButtonProps) {
	let [state, setState] = useState(LaunchButtonState.SelectBundle);

	if (state == LaunchButtonState.SelectBundle && bundleSelected) {
		setState(LaunchButtonState.ClickToLaunch);
	}

	useEffect(() => {
		listen;
	});

	async function onClick() {
		if (state == LaunchButtonState.ClickToLaunch) {
			setState(LaunchButtonState.Running);
			onLaunch();
			await listen("game_finished", () => {
				setState(LaunchButtonState.ClickToLaunch);
			});
		} else if (state == LaunchButtonState.ClickToCancel) {
			onCancel();
			setState(LaunchButtonState.ClickToLaunch);
		}
	}
	return (
		<div id="launch-button" className="launchButton">
			<IconTextButton
				className={`${
					state == LaunchButtonState.ClickToCancel
						? "invalidButtonLike"
						: state == LaunchButtonState.SelectBundle
						? "highlightButtonLike"
						: "accentedButtonLike"
				} ${error ? "invalidInput" : ""}`}
				text={
					state == LaunchButtonState.SelectBundle
						? "Select bundle"
						: state == LaunchButtonState.ClickToLaunch
						? "Launch"
						: state == LaunchButtonState.Running
						? "Running"
						: state == LaunchButtonState.ClickToCancel
						? "Click to cancel"
						: "Invalid state"
				}
				title={
					state == LaunchButtonState.ClickToCancel
						? "May cause data loss!"
						: error
				}
				icon={
					state == LaunchButtonState.SelectBundle
						? svg.Play
						: state == LaunchButtonState.ClickToLaunch
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
	bundleSelected: boolean;
	onLaunch: () => void;
	onCancel: () => void;
	error?: string;
}

enum LaunchButtonState {
	SelectBundle = "selectBundle",
	ClickToLaunch = "clickToLaunch",
	Running = "running",
	ClickToCancel = "clickToCancel",
}

function BundleSelector({ onSetBundle }: BundleSelectorProps) {
	let [available, setAvailable] = useState<ChooseBoxChoice[]>([]);
	let [showCreate, setShowCreate] = useState(false);

	useEffect(() => {
		updateChoices();
	});

	async function updateChoices() {
		let choices = await getChooseBoxBundles();
		choices.push({ value: "__createNew", content: "Create new" });
		setAvailable(choices);
	}

	function createNew() {
		setShowCreate(true);
	}

	async function addBundle(name: string, version: MinecraftVersion) {
		try {
			let bundle: LocalBundleConfig = { version: version, packs: [] };
			await invoke("add_bundle", { bundleId: name, bundle: bundle });
		} catch (e) {
			console.error("Failed to add bundle: " + e);
		}

		setShowCreate(false);
	}

	return (
		<>
			{showCreate && <CreateBundlePopup onFinish={addBundle} />}
			<div className="bundleSelector">
				<ChooseBox
					choices={available}
					placeholder="Bundle"
					flip={true}
					beforeOpen={updateChoices}
					onChange={(value) => {
						if (value == "__createNew") {
							createNew();
						} else {
							if (!Array.isArray(value)) {
								onSetBundle(value);
							}
						}
					}}
				/>
			</div>
		</>
	);
}

interface BundleSelectorProps {
	onSetBundle: (id: string) => void;
}

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
	let [version, setVersion] = useState<MinecraftVersion>("1.20.1");
	let [error, setError] = useState<undefined | "bundle_exists" | "empty_name">(
		undefined
	);

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
		<div className="container launchPopup createBundlePopup">
			<h2>Create new bundle</h2>
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
					setName(e.currentTarget.value);
				}}
				value={name}
			/>
			<br />
			<ChooseBox
				choices={availableMinecraftVersionsChooseBox}
				placeholder="Select Minecraft version"
				defaultValue={"1.20.1"}
				onChange={(value) => {
					if (!Array.isArray(value)) {
						setVersion(value);
					}
				}}
			/>
			<br />
			<br />
			<IconTextButton
				className="accentedButtonLike"
				text="Save bundle"
				icon={svg.Save}
				style={{ width: "fit-content" }}
				onClick={async () => {
					if (name === "") {
						setError("empty_name");
					} else if (await checkIfExists()) {
						setError("bundle_exists");
					} else {
						onFinish(name, version);
					}
				}}
			/>
		</div>
	);
}

interface CreateBundlePopupProps {
	onFinish: (name: string, version: MinecraftVersion) => void;
}

export default LaunchPage;

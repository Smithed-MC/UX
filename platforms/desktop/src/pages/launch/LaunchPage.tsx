import "./LaunchPage.css";
import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Event, UnlistenFn, listen } from "@tauri-apps/api/event";
import { app, clipboard } from "@tauri-apps/api";
import { WebviewWindow } from "@tauri-apps/api/window";
import { ChooseBox, IconTextButton, svg } from "components";
import {
	AssociatedProgressEvent,
	ChooseBoxChoice,
	LocalBundleConfig,
	OutputMessageEvent,
} from "../../types";
import { MinecraftVersion } from '@smithed-mc/data-types';
import { Smithed } from "components/svg";
import { getChooseBoxBundles } from "../../util";
import BundleList from "./BundleList";
import CreateBundle from "../../components/CreateBundle";
import LaunchConsole, {
	LaunchConsoleProps,
	createProgressBar,
} from "./LaunchConsole";

function LaunchPage() {
	const [authDisplay, setAuthDisplay] = useState<AuthDisplayEvent | undefined>(
		undefined
	);
	const [bundle, setBundle] = useState<string | undefined>(undefined);
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

	return (
		<div className="container launchContainer">
			<div className="container launchContentContainer">
				<div className="container smithedLogoContainer">
					<Smithed className="bigSmithedLogo" />
					<div className="bigText bigSmithedText">Smithed</div>
					<div className="bigText smithedVersion">{appVersion}</div>
				</div>
				<br />
				<BundleList onSelect={setBundle} />
				{authDisplay && <AuthPopup {...authDisplay} />}
			</div>

			<LaunchFooter onSetAuthDisplay={setAuthDisplay} selectedBundle={bundle} />
		</div>
	);
}

function LaunchFooter({ selectedBundle, onSetAuthDisplay }: LaunchFooterProps) {
	const [online, setOnline] = useState(true);
	const [consoleProps, setConsoleProps] = useState<LaunchConsoleProps>({
		messages: [],
	});
	const [showConsole, setShowConsole] = useState(false);

	const [error, setError] = useState<undefined | "no_bundle">(undefined);
	const [unlistens, setUnlistens] = useState<UnlistenFn[]>([]);

	function updateConsole(msg: string) {
		setConsoleProps((current) => {
			return {
				messages: current.messages.concat(msg),
			};
		});
	}

	function clearConsole() {
		let console: LaunchConsoleProps = { messages: [] };
		setConsoleProps(console);
	}

	async function launchGame() {
		console.log("3 2 1 blastoff!");
		try {
			for (let unlisten of unlistens) {
				unlisten();
			}
			setShowConsole(true);
			clearConsole();
			let launchPromise = invoke("launch_game", {
				bundleId: selectedBundle,
				offline: !online,
			});

			let closeListenerPromise = listen("game_finished", () => {
				onSetAuthDisplay(undefined);
				setShowConsole(false);
			});

			let auth = listen(
				"mcvm_display_auth_info",
				(event: Event<AuthDisplayEvent>) => {
					let url = event.payload.url;
					let device_code = event.payload.device_code;
					onSetAuthDisplay({ url, device_code });
				}
			);

			let message = listen(
				"mcvm_output_message",
				(event: Event<OutputMessageEvent>) => {
					updateConsole(event.payload);
				}
			);

			let header = listen(
				"mcvm_output_header",
				(event: Event<OutputMessageEvent>) => {
					updateConsole(event.payload);
				}
			);

			let progress = listen(
				"mcvm_output_progress",
				(event: Event<AssociatedProgressEvent>) => {
					updateConsole(createProgressBar(event.payload));
				}
			);

			let [_, ...eventUnlistens] = await Promise.all([
				launchPromise,
				closeListenerPromise,
				auth,
				message,
				header,
				progress,
			]);
			setUnlistens(eventUnlistens);
		} catch (e) {
			console.error("Failed to launch game: " + e);
		}
	}

	async function tryLaunch() {
		if (selectedBundle === undefined) {
			setError("no_bundle");
			return;
		}
		await launchGame();
	}

	async function stopGame() {
		console.log("Stopping game...");
		onSetAuthDisplay(undefined);
		setShowConsole(false);
		try {
			await invoke("stop_game");
		} catch (e) {
			console.error("Failed to stop game: " + e);
		}
	}

	return (
		<div className="launchFooter container">
			<div className="launchFooterLeft container">
				{showConsole && <LaunchConsole {...consoleProps} />}
				<div className="editBundleContainer">
					<IconTextButton
						className={
							selectedBundle ? "secondaryButtonLike" : "highlightButtonLike"
						}
						text={selectedBundle ? "Edit bundle" : "Select bundle"}
						icon={svg.Edit}
						style={{ width: "fit-content" }}
						href={
							selectedBundle !== undefined
								? `/editLocalBundle/${selectedBundle}`
								: ""
						}
					/>
				</div>
			</div>
			<div className="launchFooterCenter container">
				<LaunchButton
					onLaunch={tryLaunch}
					onCancel={stopGame}
					selectedBundle={selectedBundle}
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
							setOnline(true);
						} else if (value == "offline") {
							setOnline(false);
						}
					}}
					style={{ width: "75%" }}
				/>
			</div>
		</div>
	);
}

interface LaunchFooterProps {
	onSetAuthDisplay: (value: AuthDisplayEvent | undefined) => void;
	selectedBundle: string | undefined;
}

function LaunchButton({
	selectedBundle,
	onLaunch,
	onCancel,
	error,
}: LaunchButtonProps) {
	const [state, setState] = useState(LaunchButtonState.SelectBundle);

	if (state == LaunchButtonState.SelectBundle && selectedBundle !== undefined) {
		setState(LaunchButtonState.ClickToLaunch);
	}

	if (
		state == LaunchButtonState.ClickToLaunch &&
		selectedBundle === undefined
	) {
		setState(LaunchButtonState.SelectBundle);
	}

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
						? `Launch bundle '${selectedBundle}'`
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
				iconElement={
					state == LaunchButtonState.SelectBundle ? (
						<svg.Play fill="white" />
					) : state == LaunchButtonState.ClickToLaunch ? (
						<svg.Play fill="white" />
					) : state == LaunchButtonState.Running ? (
						"..."
					) : state == LaunchButtonState.ClickToCancel ? (
						<svg.Cross />
					) : (
						""
					)
				}
				style={{ width: "fit-content" }}
				onClick={onClick}
				onMouseEnter={() => {
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
	selectedBundle: string | undefined;
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

	async function addBundle(
		name: string | undefined,
		version: MinecraftVersion | undefined
	) {
		if (name !== undefined && version !== undefined) {
			try {
				let bundle: LocalBundleConfig = { version: version, packs: [] };
				await invoke("add_bundle", { bundleId: name, bundle: bundle });
			} catch (e) {
				console.error("Failed to add bundle: " + e);
			}
		}

		setShowCreate(false);
	}

	return (
		<>
			{showCreate && <CreateBundle onFinish={addBundle} />}
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
		<div className="container popup authPopup">
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
			iconElement={clicked ? <svg.Check /> : <svg.Copy fill="white" />}
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

export default LaunchPage;

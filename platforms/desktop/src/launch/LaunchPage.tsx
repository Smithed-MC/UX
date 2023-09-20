import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Event, listen } from "@tauri-apps/api/event";
import { clipboard } from "@tauri-apps/api";
import { WebviewWindow } from "@tauri-apps/api/window";
import { IconTextButton, svg } from "components";

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
					console.log("Got message");
					let url = event.payload.url;
					let device_code = event.payload.device_code;
					setAuthDisplay({ url, device_code });
				}
			);

			await Promise.all([launch_promise, listener_promise]);
		} catch (e) {
			console.log("Failed to launch game: " + e);
		}
	}

	return (
		<div className="container">
			<IconTextButton
				className="accentedButtonLike"
				text={"Launch"}
				icon={svg.Play}
				style={{ width: "fit-content" }}
				onClick={launchGame}
			/>
			<br />
			{authDisplay && <AuthDisplay {...authDisplay} />}
		</div>
	);
}

interface AuthDisplayEvent {
	url: string;
	device_code: string;
}

function AuthDisplay({ url, device_code }: AuthDisplayEvent) {
	return (
		<div className="container">
			Copy this code:
			<br />
			<br />
			<IconTextButton
				className="buttonLike"
				text={"Copy code"}
				icon={svg.Copy}
				style={{ width: "fit-content" }}
				onClick={async () => {
					await clipboard.writeText(device_code);
				}}
			/>
			<br />
			Then open the login page:
			<br />
			<br />
			<IconTextButton
				className="buttonLike"
				text={"Open Login Page"}
				icon={svg.Right}
				style={{ width: "fit-content" }}
				onClick={() => {
					openMicrosoftLogin(url);
				}}
				reverse={true}
			/>
		</div>
	);
}

function openMicrosoftLogin(url: string) {
	new WebviewWindow("microsoft_login", {
		url: url,
	});
}

export default LaunchPage;

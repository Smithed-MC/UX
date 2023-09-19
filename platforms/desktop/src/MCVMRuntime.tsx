import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Event, listen } from "@tauri-apps/api/event";
import { clipboard } from "@tauri-apps/api";
import { WebviewWindow } from "@tauri-apps/api/window";

function MCVMRuntime() {
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
			<button onClick={launchGame}>Launch</button>
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
			Open this link:
			<a
				onClick={() => {
					openMicrosoftLogin(url);
				}}
			>
				{url}
			</a>
			<br />
			And put in the code:
			<div id="device-code">
				{device_code}
				<div
					id="device-code-copy"
					onClick={async () => {
						await clipboard.writeText(device_code);
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						height="1em"
						viewBox="0 0 448 512"
					>
						<path d="M384 336H192c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16l140.1 0L400 115.9V320c0 8.8-7.2 16-16 16zM192 384H384c35.3 0 64-28.7 64-64V115.9c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1H192c-35.3 0-64 28.7-64 64V320c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H256c35.3 0 64-28.7 64-64V416H272v32c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V192c0-8.8 7.2-16 16-16H96V128H64z" />
					</svg>
				</div>
			</div>
		</div>
	);
}

function openMicrosoftLogin(url: string) {
	new WebviewWindow("microsoft_login", {
		url: url,
	});
}

export default MCVMRuntime;

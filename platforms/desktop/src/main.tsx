import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import LaunchPage from "./launch/LaunchPage";
import { ClientInject, populateRouteProps, subRoutes } from "client";
import { IconTextButton, svg } from "components";
import AddToBundle from "./components/AddToBundle";
import { invoke } from "@tauri-apps/api";
import { PackReference } from "data-types";
import EditLocalBundle, { loadEditBundleData } from "./EditLocalBundle";

// Injection code to modify the client so it works with the launcher
const launchRoute = {
	path: "launch",
	element: <LaunchPage />,
};

if (!subRoutes.includes(launchRoute)) {
	subRoutes.push(launchRoute);
}

const editLocalBundleRoute = {
	path: "editLocalBundle/:id",
	element: <EditLocalBundle />,
	loader: loadEditBundleData,
};

if (!subRoutes.includes(editLocalBundleRoute)) {
	subRoutes.push(editLocalBundleRoute);
}

let inject: ClientInject = {
	getNavbarTabs: () => {
		return [
			<IconTextButton
				className="navBarOption start"
				text="Launch"
				href="/launch"
				icon={svg.Play}
			/>,
			<IconTextButton
				className="navBarOption middle"
				text="Browse"
				href="/browse"
				icon={svg.Browse}
			/>,
			<IconTextButton
				className="navBarOption middle"
				text="Discord"
				href="https://smithed.dev/discord"
				target="_blank"
				icon={svg.Discord}
			/>,
		];
	},
	enableFooter: false,
	logoUrl: "/launch",
	packDownloadButton: (id, openPopup, closePopup) => (
		<IconTextButton
			className="accentedButtonLike"
			iconElement={<svg.Plus fill="var(--foreground)" />}
			text={"Add to local bundle"}
			onClick={() => {
				const element = (
					<AddToBundle
						packId={id}
						onFinish={async (bundleId, packVersion) => {
							if (bundleId !== undefined && packVersion !== undefined) {
								const ref: PackReference = {
									id: id,
									version: packVersion,
								};
								try {
									await invoke("add_pack_to_bundle", {
										bundleId: bundleId,
										pack: ref,
									});
								} catch (e) {
									console.error("Failed to add pack to bundle: " + e);
								}
							}
							closePopup();
						}}
					/>
				);
				openPopup(element);
			}}
			reverse
		/>
	),
	showBackButton: true,
};

populateRouteProps({ platform: "desktop", inject: inject });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);

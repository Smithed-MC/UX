import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import LaunchPage from "./launch/LaunchPage";
import { ClientInject, populateDefaultRouteProps, subRoutes } from "client";
import { IconTextButton, svg } from "components";

// Injection code to modify the client so it works with the launcher
const launchRoute = {
	path: "launch",
	element: <LaunchPage />,
};
if (!subRoutes.includes(launchRoute)) {
	subRoutes.push(launchRoute);
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
};

populateDefaultRouteProps({ platform: "desktop", inject: inject });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);

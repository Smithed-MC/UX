import React from "react"
import ReactDOM from "react-dom/client"
import "./style.css"
import LaunchPage from "./pages/launch/LaunchPage"
import ClientParent, { subRoutes } from "client"
import { IconTextButton, NavButton, svg } from "components"
import AddToBundle from "./components/AddToBundle"
import { invoke } from "@tauri-apps/api"
import { PackReference } from "data-types"
import EditLocalBundle from "./pages/EditLocalBundle"
import ImportBundle from "./components/ImportBundle"
import { defaultContext, IClientContext } from "client/src/context"

// Injection code to modify the client so it works with the launcher
const launchRoute = {
	path: "launch",
	element: <LaunchPage />,
}

if (!subRoutes.includes(launchRoute)) {
	subRoutes.push(launchRoute)
}

const editLocalBundleRoute = {
	path: "editLocalBundle/:id",
	element: <EditLocalBundle />,
}

if (!subRoutes.includes(editLocalBundleRoute)) {
	subRoutes.push(editLocalBundleRoute)
}

const context: IClientContext = {
	navbarTabs: [
			<NavButton
				className="navBarOption start"
				selectedClass="successButtonLike"
				text="Launch"
				to="/launch"
				iconElement={<svg.Play fill="white" />}
			/>,
			...defaultContext.navbarTabs
	],
	enableFooter: false,
	logoUrl: "/launch",
	packDownloadButton: ({id, openPopup, closePopup}) => (
		<IconTextButton
			className="accentedButtonLike"
			iconElement={<svg.Plus fill="var(--foreground)" />}
			text={"Add to local bundle"}
			onClick={() => {
				const element = (
					<AddToBundle
						packId={id}
						onFinish={async (bundleId, packVersion) => {
							if (
								bundleId !== undefined &&
								packVersion !== undefined
							) {
								const ref: PackReference = {
									id: id,
									version: packVersion,
								}
								try {
									await invoke("add_pack_to_bundle", {
										bundleId: bundleId,
										pack: ref,
									})
								} catch (e) {
									console.error(
										"Failed to add pack to bundle: " + e
									)
								}
							}
							closePopup()
						}}
					/>
				)
				openPopup(element)
			}}
			reverse
		/>
	),
	bundleDownloadButton: ({id, openPopup, closePopup}) => (
		<IconTextButton
			className="accentedButtonLike"
			iconElement={<svg.Download fill="var(--foreground)" />}
			text={"Import"}
			onClick={() => {
				const element = (
					<ImportBundle
						bundleId={id}
						onFinish={async (bundleId, bundle) => {
							if (
								bundleId !== undefined &&
								bundle !== undefined
							) {
								try {
									await invoke("add_bundle", {
										bundleId: bundleId,
										bundle: bundle,
									})
								} catch (e) {
									console.error(
										"Failed to add imported bundle: " + e
									)
								}
							}
							closePopup()
						}}
					/>
				)
				openPopup(element)
			}}
			reverse
		/>
	),
	showBackButton: true,
}

// populateRouteProps({ platform: "desktop",   })

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<ClientParent context={context} />
	</React.StrictMode>
)

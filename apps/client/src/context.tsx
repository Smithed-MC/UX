import {
	DownloadButton,
	IconInput,
	IconTextButton,
	Link,
	NavButton,
} from "components"
import { svg } from "components"
import { Browse, Download, Popout, Right, Search } from "components/svg"
import { getAuth } from "firebase/auth"
import { createContext } from "react"
import ContentSearch from "./widget/ContentSearch"

export interface IClientContext {
	navbarTabs: readonly JSX.Element[]
	enableFooter: boolean
	logoUrl: string
	packDownloadButton: DownloadButton
	bundleDownloadButton: DownloadButton
	showBackButton: boolean
}

export const defaultContext: IClientContext = {
	navbarTabs: [
		<NavButton className="navBarOption start" to="/packs" key="browse">
			Packs
		</NavButton>,
		<NavButton
			className="navBarOption"
			to="https://weld.smithed.dev"
			key="weld"
		>
			Weld <Popout />
		</NavButton>,
		<ContentSearch/>,
	],
	enableFooter: true,
	logoUrl: "/",
	packDownloadButton: ({ id, ...props }) => (
		<IconTextButton
			className="accentedButtonLike"
			iconElement={
				<Right
					fill="var(--foreground)"
					style={{ transform: "rotate(90deg)" }}
				/>
			}
			text={"Download"}
			reverse
			to={import.meta.env.VITE_API_SERVER + `/download?pack=${id}`}
			rel="nofollow"
			{...props}
		/>
	),
	showBackButton: false,
	bundleDownloadButton: ({ id }) => (
		<IconTextButton
			text={"Download"}
			iconElement={<Download fill="var(--foreground)" />}
			className="bundleButtonLike bundleControlButton"
			reverse={true}
			to={import.meta.env.VITE_API_SERVER + `/bundles/${id}/download`}
			onClick={async (e) => {
				e.preventDefault()
				window.open(
					import.meta.env.VITE_API_SERVER +
						`/bundles/${id}/download?token=` +
						(await getAuth().currentUser?.getIdToken())
				)
			}}
		/>
	),
}

export const ClientContext = createContext<IClientContext>(defaultContext)

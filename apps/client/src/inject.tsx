import { DownloadButton, IconTextButton, NavButton } from "components"
import { svg } from "components"
import { Download, Right } from "components/svg"

export interface ClientInject {
	getNavbarTabs: () => JSX.Element[]
	enableFooter: boolean
	logoUrl: string
	packDownloadButton: DownloadButton
	bundleDownloadButton: DownloadButton
	showBackButton: boolean
}

export function getDefaultInject(): ClientInject {
	return {
		getNavbarTabs: () => [
			<NavButton
				className="navBarOption start"
				text="Packs"
				href="/packs"
				key="browse"
				icon={svg.Browse}
				selectedClass="accentedButtonLike"
			/>,
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
				href={import.meta.env.VITE_API_SERVER + `/download?pack=${id}`}
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
				href={
					import.meta.env.VITE_API_SERVER + `/bundles/${id}/download`
				}
			/>
		),
	}
}

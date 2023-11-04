import { DownloadButton, IconTextButton } from "components";
import { svg } from "components";
import { Download } from "components/svg";

export interface ClientInject {
	getNavbarTabs: () => JSX.Element[];
	enableFooter: boolean;
	logoUrl: string;
	packDownloadButton: DownloadButton;
	bundleDownloadButton: DownloadButton;
	showBackButton: boolean;
}



export function getDefaultInject(): ClientInject {
	return {
		getNavbarTabs: () => [
			<IconTextButton
				className="navBarOption start"
				text="Home"
				href="/"
				key="home"
				icon={svg.Home}
			/>,
			<IconTextButton
				className="navBarOption middle"
				text="Browse"
				href="/browse"
				key="browse"
				icon={svg.Browse}
			/>,
			<IconTextButton
				className="navBarOption middle"
				text="Discord"
				href="https://smithed.dev/discord"
				key="discord"
				icon={svg.Discord}
			/>
		],
		enableFooter: true,
		logoUrl: "/",
		packDownloadButton: ({id}) => (
			<IconTextButton
				className="accentedButtonLike"
				iconElement={<Download fill="var(--foreground)" />}
				text={"Download"}
				reverse
				href={`https://api.smithed.dev/v2/download?pack=${id}`}
				rel="nofollow"
			/>
		),
		showBackButton: false,
		bundleDownloadButton: ({id}) => (
			<IconTextButton
				text={"Download"}
				iconElement={<Download fill="var(--foreground)" />}
				className="bundleButtonLike bundleControlButton"
				reverse={true}
				href={`https://api.smithed.dev/v2/bundles/${id}/download`}
			/>
		),
	};
}

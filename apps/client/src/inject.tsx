import { DownloadButton, IconTextButton } from "components";
import { svg } from "components";
import { Download, Right } from "components/svg";

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
		packDownloadButton: ({id, ...props}) => (
			<IconTextButton
				className="accentedButtonLike"
				iconElement={<Right fill="var(--foreground)" style={{transform: 'rotate(90deg)'}}/>}
				text={"Download"}
				reverse
				href={import.meta.env.VITE_API_SERVER + `/download?pack=${id}`}
				rel="nofollow"
				{...props}
			/>
		),
		showBackButton: false,
		bundleDownloadButton: ({id}) => (
			<IconTextButton
				text={"Download"}
				iconElement={<Download fill="var(--foreground)" />}
				className="bundleButtonLike bundleControlButton"
				reverse={true}
				href={import.meta.env.VITE_API_SERVER + `/bundles/${id}/download`}
			/>
		),
	};
}

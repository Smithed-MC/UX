import { IconTextButton } from "components";
import { svg } from "components";
import { Download } from "components/svg";

export interface ClientInject {
	getNavbarTabs: () => JSX.Element[];
	enableFooter: boolean;
	logoUrl: string;
	packDownloadButton: PackDownloadButtonFn;
	showBackButton: boolean;
}

export type PackDownloadButtonFn = (
	id: string,
	openPopup: (element: JSX.Element) => void,
	closePopup: () => void
) => JSX.Element;

export function getDefaultInject(): ClientInject {
	return {
		getNavbarTabs: () => [
			<>
				<IconTextButton
					className="navBarOption start"
					text="Home"
					href="/"
					icon={svg.Home}
				/>
			</>,
			<>
				{" "}
				<IconTextButton
					className="navBarOption middle"
					text="Browse"
					href="/browse"
					icon={svg.Browse}
				/>
			</>,
			<>
				{" "}
				<IconTextButton
					className="navBarOption middle"
					text="Discord"
					href="https://smithed.dev/discord"
					icon={svg.Discord}
				/>
			</>,
		],
		enableFooter: true,
		logoUrl: "/",
		packDownloadButton: (id) => (
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
	};
}

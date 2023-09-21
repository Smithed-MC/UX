import { IconTextButton } from "components";
import { svg } from "components";

export interface ClientInject {
	getNavbarTabs: () => JSX.Element[];
	enableFooter: boolean;
}

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
	};
}

import "./Header.css";

function Header({ onTabChange }: HeaderProps) {
	return (
		<div className="container">
			<div className="header-title">Smithed</div>
			<div className="header-tablist">
				<Tab name="Browse" type={TabType.Browse} onClick={onTabChange} />
				<Tab name="Launch" type={TabType.Launch} onClick={onTabChange} />
			</div>
		</div>
	);
}

export interface HeaderProps {
	onTabChange: (tab: TabType) => void;
}

function Tab({ name }: TabProps) {
	return <div className="header-tab">{name}</div>;
}

interface TabProps {
	name: string;
	type: TabType;
	onClick: (tab: TabType) => void;
}

export enum TabType {
	Browse = "browse",
	Launch = "launch",
}

export default Header;

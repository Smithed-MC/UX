/// <reference types="vite-plugin-svgr/client" />
import { CSSProperties, useEffect, useRef, useState } from "react"
import {
	useAppDispatch,
	useAppSelector,
	useFirebaseUser,
	useSmithedUser,
} from "hooks"

import "./style.css"
import "./NavBar.css"
import {
	AddToBundle,
	Check,
	Cross,
	Download,
	Jigsaw,
	Logo,
	NewFolder,
	Plus,
	Right,
	Settings,
	Trash,
} from "./svg.js"
import IconTextButton, { IconTextButtonProps } from "./IconTextButton"
import { Account as AccountSvg } from "components/svg.js"
import { BundleUpdater, PackBundle, PackData, UserData } from "data-types"
import Link from "./Link"
import Modal from "./Modal"
import { getAuth } from "firebase/auth"


var previousState = false


export default function NavBar({ tabs, logoUrl, onSignout }: NavBarProps) {
	const user = useSmithedUser()

	return (
		<nav
			className="container navBarContainer"
			style={{
				flexDirection: "row",
				width: "100%",
				boxSizing: "border-box",
				justifyContent: "start",
				zIndex: 1,
			}}
		>
			<Link
				style={{
					display: "flex",
					fontSize: "24px",
					lineHeight: "30px",
					fontWeight: "700",
					fontFamily: "Lexend",
					color: "var(--foreground)",
					textDecoration: "none",
					alignItems: "center",
				}}
				to={logoUrl}
			>
				<Logo style={{ width: "1.5rem", height: "1.5rem" }} />
				<span className="navBarHide" style={{ marginLeft: "1rem" }}>
					Smithed
				</span>
			</Link>
			{tabs}
			<div
				style={{
					display: "flex",
					flexDirection: "row",
					gap: "1rem",
					marginLeft: "auto",
					// overflow: "hidden",
				}}
			>
				{user && <UserButton user={user} onSignout={onSignout} />}
				{!user && (
					<IconTextButton
						className="navBarOption navBarAccount"
						text={"Login"}
						to={"/account"}
						icon={AccountSvg}
						reverse={true}
					/>
				)}
			</div>
			{/* {editBundleOpen && (
				<EditBundle close={() => setEditBundleOpen(false)} />
			)} */}
		</nav>
	)
}

export interface NavBarProps {
	tabs: readonly JSX.Element[]
	logoUrl: string
	onSignout: () => void
}

function NavModalOption(props: IconTextButtonProps) {
	return (
		<IconTextButton
			reverse
			{...props}
			style={{
				backgroundColor: "transparent",
				width: "100%",
				...props.style,
			}}
		/>
	)
}

function UserButton({
	user,
	onSignout,
}: {
	user: UserData
	onSignout: () => void
}) {
	const [fallback, setFallback] = useState(false)
	return (
		<Modal
			className="navBarModal"
			trigger={
				<span className="container" style={{ flexDirection: "row" }}>
					<IconTextButton
						style={{
							width: "100%",
							backgroundColor: "transparent",
							height: "2.5rem",
						}}
						className="navBarOption navBarAccount"
						text={
							<div
								className="container"
								style={{
									flexDirection: "row",
									gap: "1rem",
								}}
							>
								{!fallback && (
									<img
										className="navBarHide"
										style={{
											width: "2rem",
											height: "2rem",
											borderRadius:
												"calc(var(--defaultBorderRadius) * 0.5)",
										}}
										src={
											import.meta.env.VITE_API_SERVER +
											`/users/${user.uid}/pfp`
										}
										onError={() => setFallback(true)}
									/>
								)}
								{fallback && (
									<div
										className="navBarHide container"
										style={{
											width: "2rem",
											height: "2rem",
											borderRadius:
												"calc(var(--defaultBorderRadius) * 0.5)",
											backgroundColor: "var(--bold)",
										}}
									>
										<AccountSvg
											style={{
												width: "1rem",
												height: "1rem",
											}}
										/>
									</div>
								)}
								{user.displayName}
							</div>
						}
						iconElement={
							<Right
								style={{
									transform: "rotate(90deg)",
								}}
							/>
						}
						reverse
					/>
				</span>
			}
			content={() => (
				<div className="container">
					<NavModalOption
						text="Open profile"
						icon={AccountSvg}
						href={"/" + user?.displayName}
					/>
					<NavModalOption
						text="New pack"
						icon={Plus}
						href={"/packs/new/edit"}
					/>
					<NavModalOption
						text="New bundle"
						icon={NewFolder}
						href={"/bundles/new/edit"}
					/>
					<NavModalOption
						text="Settings"
						icon={Settings}
						href={"/settings"}
					/>
					<NavModalOption
						style={{ color: "var(--disturbing)" }}
						text="Logout"
						iconElement={
							<Right
								style={{
									color: "var(--disturbing)",
								}}
							/>
						}
						onClick={() => {
							getAuth().signOut()
							onSignout
						}}
						href=""
					/>
				</div>
			)}
		/>
	)
}

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
import { BundleUpdater, PackBundle, PackData } from "data-types"
import Link from "./Link"
import Modal from "./Modal"
import { getAuth } from "firebase/auth"

interface NavButtonProps {
	onOpen: () => void
	onClose: () => void
	style?: CSSProperties
}

var previousState = false

interface EditBundleProps {
	close: () => void
}

export default function NavBar({ tabs, logoUrl, onSignout }: NavBarProps) {
	const [open, setOpen] = useState(previousState)

	const [editBundleOpen, setEditBundleOpen] = useState(false)

	const navBarOptions = useRef<HTMLDivElement>(null)

	const user = useSmithedUser()

	function onOpen() {
		setOpen(true)
		navBarOptions.current?.style.setProperty(
			"animation",
			"navbarPullup 0.5s 1"
		)
	}

	function onClose() {
		const duration = 0.75
		const animation = `navbarSlidedown ${duration}s 1`
		navBarOptions.current?.style.setProperty("animation", animation)
		setTimeout(
			() => {
				if (
					navBarOptions.current?.style.animationName ===
					"navbarSlidedown"
				)
					setOpen(false)
			},
			duration * 1000 - 100
		)
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

	return (
		<div
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
					display: 'flex',
					fontSize: "24px",
					lineHeight: "30px",
					fontWeight: "700",
					fontFamily: "Lexend",
					color: "var(--foreground)",
					textDecoration: "none",
					alignItems: 'center'
				}}
				to={logoUrl}
			>
				<Logo style={{ width: "1.5rem", height: "1.5rem" }} />
				<span className="navBarHide" style={{marginLeft: "1rem"}}>Smithed</span>
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
				{user && (
					<Modal
						className="navBarModal"
						trigger={
							<span
								className="container"
								style={{ flexDirection: "row" }}
							>
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
											<img
												className="navBarHide"
												style={{
													width: "2rem",
													height: "2rem",
													borderRadius:
														"calc(var(--defaultBorderRadius) * 0.5)",
												}}
												src={
													import.meta.env
														.VITE_API_SERVER +
													`/users/${user.uid}/pfp`
												}
											/>
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
						content={(ctx) => (
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
				)}
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
		</div>
	)
}

export interface NavBarProps {
	tabs: readonly JSX.Element[]
	logoUrl: string
	onSignout: () => void
}

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
import { Check, Cross, Download, Jigsaw, Logo, Trash } from "./svg.js"
import { IconTextButton } from "./IconTextButton"
import { Account as AccountSvg } from "components/svg.js"
import {
	selectSelectedBundle,
	selectUsersBundles,
	setUsersBundles,
} from "store"
import { BundleUpdater, PackBundle, PackData } from "data-types"

interface NavButtonProps {
	onOpen: () => void
	onClose: () => void
	style?: CSSProperties
}

var previousState = false

interface EditBundleProps {
	close: () => void
}
export function EditBundle({ close }: EditBundleProps) {
	const bundles = useAppSelector(selectUsersBundles)
	const selectedBundle = useAppSelector(selectSelectedBundle)
	const user = useFirebaseUser()
	const dispatch = useAppDispatch()

	const curBundle = bundles.find((b) => b.uid === selectedBundle)

	const [packs, setPacks] = useState<
		{ id: string; version: string; pack: PackData }[]
	>([])

	async function fetchPackData(id: string, version: string) {
		const resp = await fetch(
			import.meta.env.VITE_API_SERVER + `/packs/${id}`
		)
		return { id, version, pack: await resp.json() }
	}

	async function loadPacks() {
		if (curBundle === undefined) return
		setPacks(
			await Promise.all(
				BundleUpdater(curBundle).versions[0].packs.map((p) =>
					fetchPackData(p.id, p.version)
				)
			)
		)
	}

	useEffect(() => {
		loadPacks()
	}, [selectedBundle])

	if (curBundle === undefined) return <div></div>

	return (
		<div
			className="container"
			style={{
				position: "fixed",
				width: "100%",
				height: "100%",
				top: 0,
				left: 0,
				backgroundColor: "rgba(0, 0, 0, 50%)",
				animation: "fadeInBackground 0.5s",
			}}
		>
			<div
				className="container"
				style={{
					backgroundColor: "var(--background)",
					border: "0.125rem solid var(--border)",
					boxSizing: "border-box",
					padding: 16,
					borderRadius: "var(--defaultBorderRadius)",
					gap: 16,
					animation: "slideInContent 0.5s ease-in-out",
					alignItems: "start",
				}}
			>
				<span style={{ fontWeight: 600, fontSize: "1.25rem" }}>
					{curBundle.name}
				</span>
				{packs.length > 0 && (
					<div
						className="container"
						style={{
							alignItems: "start",
							gap: "0.5rem",
							width: "100%",
						}}
					>
						<span style={{ fontWeight: 600 }}>Packs:</span>
						{packs.map((p) => (
							<div
								className="container"
								key={p.id}
								style={{
									flexDirection: "row",
									gap: "0.5rem",
									width: "100%",
									justifyContent: "start",
								}}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="4"
									height="4"
									viewBox="0 0 4 4"
									fill="none"
								>
									<circle
										cx="2"
										cy="2"
										r="2"
										fill="var(--foreground)"
									/>
								</svg>
								{p.pack.display.name}{" "}
								<span style={{ color: "var(--border)" }}>
									{!p.version.startsWith("v") && "v"}
									{p.version}
								</span>
								<div style={{ flexGrow: 1 }} />
								<button
									className="invalidButtonLike"
									style={{
										padding: "0.5rem",
										aspectRatio: "1/1",
									}}
									onClick={() => {
										setPacks(
											packs.filter(
												(pack) => pack.id !== p.id
											)
										)
									}}
								>
									<Trash
										style={{ fill: "var(--disturbing)" }}
									/>
								</button>
							</div>
						))}
					</div>
				)}
				<div
					className="container"
					style={{ flexDirection: "row", width: "100%", gap: "1rem" }}
				>
					<IconTextButton
						className="invalidButtonLike"
						icon={Cross}
						text={"Cancel"}
						onClick={close}
					/>
					{packs.length > 0 && (
						<a
							className="buttonLike"
							style={{
								fill: "var(--foreground)",
								padding: "0.5rem",
							}}
							href={
								import.meta.env.VITE_API_SERVER +
								`/bundles/${curBundle.uid}/download`
							}
						>
							<Download />
						</a>
					)}
					{packs.length > 0 && (
						<IconTextButton
							className="accentedButtonLike"
							icon={Check}
							text={"Save"}
							onClick={async () => {
								if (user == null) return

								const newBundle: PackBundle = {
									...curBundle,
									packs: packs.map((p) => ({
										id: p.id,
										version: p.version,
									})),
								}

								const resp = await fetch(
									import.meta.env.VITE_API_SERVER +
										`/bundles/${curBundle.uid}?token=${await user.getIdToken()}`,
									{
										method: "PUT",
										body: JSON.stringify({
											data: newBundle,
										}),
										headers: {
											"Content-Type": "application/json",
										},
									}
								)

								if (!resp.ok) return alert(await resp.text())

								let newBundles = [...bundles]

								newBundles.splice(
									newBundles.findIndex(
										(b) => b.uid === selectedBundle
									),
									1
								)
								newBundles.push(newBundle)

								dispatch(setUsersBundles(newBundles))

								close()
							}}
						/>
					)}
				</div>
			</div>
		</div>
	)
}

export function NavBar(props: NavBarProps) {
	const [open, setOpen] = useState(previousState)

	const [editBundleOpen, setEditBundleOpen] = useState(false)

	const navBarOptions = useRef<HTMLDivElement>(null)

	const selectedBundle = useAppSelector(selectSelectedBundle)
	const bundles = useAppSelector(selectUsersBundles)

	const user = useSmithedUser()

	useEffect(() => {
		if (selectedBundle === "") setEditBundleOpen(false)
	}, [selectedBundle])

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

	const curBundle = bundles.find((b) => b.uid === selectedBundle)

	return (
		<div
			className="container navBarContainer"
			style={{
				flexDirection: "row",
				width: "100%",
				boxSizing: "border-box",
				zIndex: 1,
			}}
		>
			<Logo
				className="navBarHide"
				style={{ width: "1.5rem", height: "1.5rem" }}
			/>
			<a
				className="navBarHide"
				style={{
					fontSize: "24px",
					lineHeight: "30px",
					fontWeight: "700",
					fontFamily: "Lexend",
					color: "var(--foreground)",
					textDecoration: "none",
				}}
				href={props.logoUrl}
			>
				Smithed
			</a>
			<div
				className="navBarHide"
				style={{
					width: 1,
					height: 36,
					background: "var(--foreground)",
				}}
			/>

			{props.getTabs && props.getTabs()}
			<div
				style={{
					display: "flex",
					flexGrow: 1,
					flexDirection: "row",
					gap: "2rem",
					justifyContent: "end",
					overflow: "hidden",
				}}
			>
				{/* {selectedBundle !== "" && !import.meta.env.SSR && (
					<IconTextButton
						style={{
							flexGrow: 1,
							overflow: "hidden",
							maxWidth: "min-content",
						}}
						className="navBarOption middle navBarBundle"
						text={
							<div
								style={{
									display: "flex",
									flexShrink: 1,
									flexDirection: "row",
									color: "var(--warning)",
									gap: "0.25rem",
								}}
							>
								<span
									style={{
										WebkitLineClamp: 1,
										margin: 0,
										textOverflow: "ellipsis",
										overflow: "hidden",
										width: "calc(100%)",
										whiteSpace: "nowrap",
									}}
								>
									{curBundle?.name}
								</span>
								<span style={{ flexShrink: 0 }}>
									[{curBundle?.packs.length}]
								</span>
							</div>
						}
						iconElement={<Jigsaw style={{ flexShrink: 0 }} />}
						reverse
						onClick={() => setEditBundleOpen(!editBundleOpen)}
					/>
				)} */}
				<IconTextButton
					className="navBarOption end"
					text={user?.displayName ?? "Login"}
					href={"/" + (user?.displayName ?? "account")}
					icon={AccountSvg}
					reverse={true}
				/>
			</div>
			{/* {editBundleOpen && (
				<EditBundle close={() => setEditBundleOpen(false)} />
			)} */}
		</div>
	)
}

export interface NavBarProps {
	getTabs: (() => JSX.Element[]) | undefined
	logoUrl: string
}

import { open } from "@tauri-apps/api/shell"
import {
	IconTextButton,
	Link,
	markdownOptions,
	MarkdownRenderer,
	Modal,
} from "components"
import {
	Cross,
	CurlyBraces,
	Discord,
	Download,
	Github,
	Globe,
	Jigsaw,
	Picture,
	Plus,
	Right,
	Star,
	Warning,
} from "components/svg"
import {
	BundleUpdater,
	fullMinecraftVersions,
	MinecraftVersion,
	PackBundle_v2,
	PackData,
	PackMetaData,
	PackVersion,
	supportedMinecraftVersions,
	UserData,
} from "data-types"
import React, {
	MouseEventHandler,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react"
import { useLoaderData, useNavigate } from "react-router-dom"
import "./packInfo.css"
import { coerce, compare } from "semver"
import { prettyTimeDifference } from "formatters"
import { useAppDispatch, useAppSelector, useFirebaseUser } from "hooks"
import {
	selectSelectedBundle,
	selectUsersBundles,
	setSelectedBundle,
	setUsersBundles,
} from "store"
import { CreateBundle } from "./bundle"
import BackButton from "./BackButton"
import { ClientContext } from "../context"

interface PackInfoProps {
	id: string
	fixed: boolean
	onClose: () => void
	style?: React.CSSProperties
}



function WidgetOption({
	isLatest,
	onClick,
	children,
	icon,
}: {
	isLatest: boolean
	onClick?: () => void
	children?: any
	icon?: JSX.Element
}) {
	return (
		<div
			className={`buttonLike container accentedButtonLike`}
			style={{
				width: "100%",
				flexDirection: "row",
				justifyContent: "start",
				gap: "1rem",
				backgroundColor: "transparent",
			}}
			onClick={onClick}
		>
			{children}
			<div style={{ flexGrow: 1 }} />
			{isLatest && <Star style={{ fill: "var(--border)" }} />}
			<div
				style={{
					width: "0.125rem",
					height: "100%",
					background: "var(--foreground)",
					opacity: 0.25,
				}}
			/>
			{icon ?? <Right />}
		</div>
	)
}

function SupportedVersionWidget({
	longestVersion,
	latestVersion,
	attachedVersion,
	minecraftVersion,
	onClick,
}: {
	minecraftVersion: string
	longestVersion: string
	latestVersion: string
	attachedVersion: string
	onClick: (v: string) => void
}) {
	const isLatest = latestVersion === attachedVersion

	return (
		<WidgetOption
			isLatest={isLatest}
			onClick={() => onClick(minecraftVersion)}
		>
			<span
				style={{
					fontWeight: 600,
					position: "relative",
				}}
			>
				<span style={{ opacity: 0 }}>{longestVersion}</span>
				<span style={{ position: "absolute", left: 0 }}>
					{minecraftVersion}
				</span>
			</span>
			<span style={{ opacity: 0.25, paddingRight: "2rem" }}>
				{!attachedVersion.startsWith("v") && "v"}
				{attachedVersion}
			</span>
		</WidgetOption>
	)
}

function RenderSupportedVersions({
	packData,
	onClick,
}: {
	packData: { versions: PackVersion[] }
	onClick: (v: string) => void
}) {
	const {
		latestPackVersion,
		gameToPackVersionMap,
		supportedVersions,
		longestVersion,
	} = useMemo(() => {
		const sortedPackVersions = packData?.versions.sort((a, b) =>
			compare(coerce(a.name) ?? "", coerce(b.name) ?? "")
		)

		const latestPackVersion = sortedPackVersions.at(-1)!.name

		const gameToPackVersionMap: Record<string, string> = {}
		for (const v of sortedPackVersions) {
			v.supports.forEach(
				(mcVersion) => (gameToPackVersionMap[mcVersion] = v.name)
			)
		}

		const supportedVersions = [...supportedMinecraftVersions]
			.sort((a, b) => compare(coerce(a) ?? "", coerce(b) ?? ""))
			.reverse()
			.filter(
				(mcVersion) =>
					packData.versions.find((v) =>
						v.supports.includes(mcVersion)
					) !== undefined
			)

		const longestVersion = [...supportedVersions]
			.sort((a, b) => a.length - b.length)
			.at(-1)!

		return {
			latestPackVersion,
			gameToPackVersionMap,
			supportedVersions,
			longestVersion,
		}
	}, [packData, supportedMinecraftVersions])

	if (supportedVersions.length === 0) {
		return <span>No available versions</span>
	}

	return (
		<>
			{supportedVersions.map((v) => (
				<SupportedVersionWidget
					minecraftVersion={v}
					latestVersion={latestPackVersion}
					longestVersion={longestVersion}
					attachedVersion={gameToPackVersionMap[v]}
					onClick={onClick}
					key={v}
				/>
			))}
		</>
	)
}

function showPackVersions(
	packData: PackData,
	gameVersion: string,
	onClick: (v: PackVersion) => void,
	download?: boolean
) {
	const versions = packData.versions
		.filter((v) => v.supports.includes(gameVersion))
		.sort((a, b) => compare(coerce(a.name) ?? "", coerce(b.name) ?? ""))
		.reverse()

	const longestVersion =
		versions.length >= 1
			? versions.reduce((p, n) => (p.name.length > n.name.length ? p : n))
					.name
			: ""

	return versions.map((v, idx) => {
		return (
			<WidgetOption
				isLatest={idx === 0}
				onClick={() => onClick(v)}
				icon={download ? <Download /> : undefined}
			>
				<span style={{ fontWeight: 600, position: "relative" }}>
					<span style={{ opacity: 0 }}>{longestVersion}</span>
					<span style={{ position: "absolute", left: 0 }}>
						{v.name}
					</span>
				</span>
			</WidgetOption>
		)
	})
}

export function AddToBundleModal({
	trigger,
	isOpen,
	close,
	packData,
	id,
}: {
	trigger: JSX.Element
	isOpen: boolean
	close: () => void
	packData?: PackData
	id: string
}) {
	const selectedBundleUid = useAppSelector(selectSelectedBundle)
	const bundles = useAppSelector(selectUsersBundles)

	let selectedBundle: PackBundle_v2 | undefined = undefined
	let foundBundle
	if ((foundBundle = bundles.find((b) => b.uid === selectedBundleUid))) {
		selectedBundle = BundleUpdater(foundBundle)

		selectedBundle.versions.sort((a, b) => -compare(a.name, b.name))
	}

	const dispatch = useAppDispatch()

	const user = useFirebaseUser()

	const [page, setPage] = useState<
		"mcVersion" | "packVersion" | "bundle" | "createBundle"
	>(selectedBundleUid === "" ? "mcVersion" : "packVersion")
	const [direction, setDirection] = useState<"left" | "right">("right")

	const [minecraftVersion, setMinecraftVersion] = useState<
		MinecraftVersion | undefined
	>(
		selectedBundleUid !== ""
			? selectedBundle?.versions[0].supports[0]
			: undefined
	)
	const [bundle, setBundle] = useState<PackBundle_v2 | undefined>(
		selectedBundleUid !== "" ? selectedBundle : undefined
	)

	const changePage = (direction: "left" | "right") => {
		const pages = ["mcVersion", "bundle", "packVersion"]
		const idx = pages.findIndex((p) => p === page)

		const directionNumber = direction === "left" ? -1 : 1

		if (idx + directionNumber < 0) return
		if (idx + directionNumber >= pages.length) return

		setPage(
			pages[idx + directionNumber] as
				| "mcVersion"
				| "packVersion"
				| "bundle"
				| "createBundle"
		)
		setDirection(direction)
	}

	const SelectMinecraftVersionPage = () => (
		<div className="container addToBundlePage">
			<div
				className="container"
				style={{ animationName: "slideIn" + direction, gap: "1.5rem" }}
			>
				<div
					className="container"
					style={{ gap: "1rem", width: "100%" }}
				>
					<label style={{ fontWeight: 600 }}>
						Choose Minecraft version
					</label>
					<RenderSupportedVersions
						packData={packData!}
						onClick={(v: string) => {
							setMinecraftVersion(v)
							changePage("right")
						}}
					/>
				</div>
				<div
					className="container compactButton"
					style={{
						flexDirection: "row",
						gap: "0.5rem",
						fontWeight: "700",
					}}
					onClick={() => {
						close()
					}}
				>
					<Right style={{ transform: "rotate(180deg)" }} />
					Close
				</div>
				<span
					className="container"
					style={{
						flexDirection: "row",
						gap: "0.5rem",
						color: "var(--border)",
						fontSize: "0.75rem",
						fontWeight: 600,
					}}
				>
					<Warning
						style={{
							fill: "var(--border)",
							width: "0.75rem",
							height: "0.75rem",
						}}
					/>
					Symbol means that the version is outdated
				</span>
			</div>
		</div>
	)
	const SelectPackVersionPage = () => {
		return (
			<div className="container addToBundlePage">
				<div
					className="container"
					style={{
						animationName: "slideIn" + direction,
						gap: "1.5rem",
					}}
				>
					<div
						className="container"
						style={{ gap: "1rem", width: "100%" }}
					>
						<label style={{ fontWeight: 600, textAlign: "center" }}>
							Choose Datapack version for "{bundle?.display.name}"
						</label>
						{showPackVersions(
							packData!,
							bundle?.versions[0].supports[0] ?? "",
							async (v) => {
								if (bundle === undefined) return

								const versions = [...bundle.versions]

								const latestVersion = versions.splice(0)[0]
								const packs = [...latestVersion.packs]

								const containedPack = packs.findIndex(
									(p) => p.id === id
								)
								if (containedPack != -1) {
									packs.splice(containedPack, 1)
								}
								packs.push({
									id: id,
									version: v.name,
								})

								const newData: PackBundle_v2 = {
									...bundle,
									versions: [
										{
											...latestVersion,
											packs: packs,
										},
										...versions,
									],
								}
								newData.versions[0].packs = packs
								// console.log(newData)

								const resp = await fetch(
									import.meta.env.VITE_API_SERVER +
										`/bundles/${bundle.uid}?token=${await user?.getIdToken()}`,
									{
										method: "PUT",
										headers: {
											"Content-Type": "application/json",
										},
										body: JSON.stringify({
											data: newData,
										}),
									}
								)

								if (!resp.ok) alert(await resp.text())

								setPage("mcVersion")
								setDirection("right")

								const newBundles = [...bundles]
								newBundles.splice(
									newBundles.findIndex(
										(b) => b.uid === bundle.uid
									),
									1
								)
								newBundles.push(newData)

								dispatch(setUsersBundles(newBundles))
								dispatch(setSelectedBundle(bundle.uid))
								close()
							}
						)}
					</div>
					{packData?.versions?.length === 0 && (
						<span style={{ color: "var(--disturbing)" }}>
							Pack has no versions for {minecraftVersion}
						</span>
					)}
					<div
						className="container compactButton"
						style={{
							flexDirection: "row",
							gap: "0.5rem",
							fontWeight: "700",
						}}
						onClick={() => {
							if (packData?.versions?.length === 0) {
								setPage("mcVersion")
								setDirection("left")
							} else {
								changePage("left")
							}
						}}
					>
						<Right style={{ transform: "rotate(180deg)" }} />
						Back
					</div>
					<span
						className="container"
						style={{
							flexDirection: "row",
							gap: "0.5rem",
							color: "var(--border)",
							fontSize: "0.75rem",
							fontWeight: 600,
						}}
					>
						<Warning
							style={{
								fill: "var(--border)",
								width: "0.75rem",
								height: "0.75rem",
							}}
						/>
						Symbol means that the version is outdated
					</span>
				</div>
			</div>
		)
	}
	const SelectBundlePage = () => {
		return (
			<div className="container addToBundlePage">
				<div
					className="container"
					style={{
						animationName: "slideIn" + direction,
						gap: "1.5rem",
					}}
				>
					<div
						className="container"
						style={{ gap: "1rem", width: "100%" }}
					>
						<label style={{ fontWeight: 600 }}>
							Choose Bundle for {minecraftVersion}
						</label>

						{bundles
							.map((b) => {
								b = BundleUpdater(b)
								b.versions.sort(
									(a, b) => -compare(a.name, b.name)
								)
								return b
							})
							.filter(
								(b) =>
									b.versions[0].supports[0] ===
									minecraftVersion
							)
							.map((b) => {
								return (
									<WidgetOption
										isLatest={true}
										onClick={() => {
											setBundle(b)
											changePage("right")
										}}
									>
										{b.display.name}
									</WidgetOption>
								)
							})}

						<IconTextButton
							icon={Plus}
							text={"New"}
							onClick={() => setPage("createBundle")}
						/>
						<div
							className="container compactButton"
							style={{
								flexDirection: "row",
								gap: "0.5rem",
								fontWeight: "700",
							}}
							onClick={() => {
								changePage("left")
							}}
						>
							<Right style={{ transform: "rotate(180deg)" }} />
							Back
						</div>
					</div>
				</div>
			</div>
		)
	}

	const CreateBundlePage = () => (
		<div className="container addToBundlePage">
			<CreateBundle
				minecraftVersion={minecraftVersion}
				showCloseButton
				close={() => setPage("bundle")}
				finish={(bundle) => {
					// console.log(bundle)
					setBundle(bundle)
					setPage("packVersion")
					setDirection("right")
				}}
			/>
		</div>
	)

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				position: "relative",
			}}
		>
			{trigger}
			{isOpen && (
				<div
					style={{
						position: "absolute",
						display: "block",
						zIndex: 100,
						top: "calc(100% + 0.5rem)",
						left: "50%",
					}}
				>
					<div
						className="container"
						style={{
							width: "25.125rem",
							boxSizing: "border-box",
							marginLeft: "-50%",
							animation: "fadeIn 0.25s ease-in-out",
						}}
					>
						{/* <svg xmlns="http://www.w3.org/2000/svg" width="36" height="30" viewBox="0 0 36 30" fill="none">
                    <path d="M18.866 3.5L18 2L17.134 3.5L3.27757 27.5L2.41154 29H4.14359H31.8564H33.5885L32.7224 27.5L18.866 3.5Z" fill="#121213" stroke="#4B4B4B" stroke-width="2" />
                </svg> */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="34"
							height="30"
							viewBox="0 0 34 30"
							fill="none"
							style={{ zIndex: 1, marginBottom: "-0.25rem" }}
						>
							<path
								d="M17 0L33.8875 29.25H0.112505L17 0Z"
								fill="var(--bold)"
							/>
						</svg>
						<div>
							{page === "mcVersion" && (
								<SelectMinecraftVersionPage />
							)}
							{page === "bundle" && <SelectBundlePage />}
							{page === "packVersion" && (
								<SelectPackVersionPage />
							)}
							{page === "createBundle" && <CreateBundlePage />}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

function DownloadPackModal({
	children,
	packData,
	packId,
}: {
	children: JSX.Element
	packData: PackData
	packId: string
}) {
	const [page, setPage] = useState<"mode" | "gameVersion" | "packVersion">(
		"gameVersion"
	)

	const [gameVersion, setMinecraftVersion] = useState<string>()
	const [packVersion, setPackVersion] = useState<PackVersion>()
	const [showAllVersions, setShowAllVersions] = useState<string>()

	function download(packVersion: PackVersion | undefined, mode: string) {
		const url =
			import.meta.env.VITE_API_SERVER +
			`/download?pack=${packId}${packVersion ? "@" + packVersion.name : ""}&version=${gameVersion}&mode=${mode}`
		window.open(url)
	}

	function DownloadOption({
		text,
		value,
		icon,
		color,
	}: {
		text: string
		value: string
		icon: JSX.Element | string
		color?: string
	}) {
		return (
			<div
				className="container compactButton"
				style={{
					flexDirection: "row",
					gap: "1rem",
					width: "100%",
					padding: "0.5rem 1rem",
					boxSizing: "border-box",
					color: color,
				}}
				onClick={() => {
					download(packVersion, value)
				}}
			>
				<span style={{ flexGrow: 1 }}>{text}</span>
				<div
					style={{
						width: "0.125rem",
						height: "1.25rem",
						opacity: 0.25,
						background: color ?? "var(--foreground)",
					}}
				/>
				{icon}
			</div>
		)
	}

	const packVersions = showPackVersions(
		packData!,
		gameVersion!,
		(v) => {
			let mode = ""

			// If no resourcepack is set, auto download the datapack
			if (!v.downloads.resourcepack || v.downloads.resourcepack === "") {
				mode = "datapack"
			} else if (!v.downloads.datapack || v.downloads.datapack === "") {
				// Same for the datapack
				mode = "resourcepack"
			} else {
				// Otherwise open the modal
				setPage("mode")
				setPackVersion(v)
			}

			if (mode !== "") download(v, mode)
		},
		true
	)

	const BackButton = ({
		page,
	}: {
		page: "mode" | "gameVersion" | "packVersion"
	}) => (
		<div
			className="container compactButton"
			style={{
				flexDirection: "row",
				gap: "0.5rem",
				margin: "0.5rem 0rem",
			}}
			onClick={() => setPage(page)}
		>
			<Right style={{ transform: "rotate(180deg)" }} /> Back
		</div>
	)

	const CloseButton = ({ close }: { close: MouseEventHandler }) => (
		<div
			className="container compactButton"
			style={{
				flexDirection: "row",
				gap: "0.5rem",
				margin: "0.5rem 0rem",
			}}
			onClick={close}
		>
			<Cross /> Close
		</div>
	)

	return (
		<Modal
			trigger={children}
			onClose={() => {
				setPage(
					supportedMinecraftVersions.length > 1
						? "gameVersion"
						: "packVersion"
				)
			}}
			content={({ close }) => (
				<>
					{page === "mode" && (
						<>
							<DownloadOption
								value="datapack"
								text={"Datapack"}
								icon={<Jigsaw />}
							/>
							<DownloadOption
								value="resourcepack"
								text={"Resourcepack"}
								icon={<Picture />}
							/>
							<DownloadOption
								value="both"
								text={"Combined"}
								icon={<CurlyBraces />}
								color={"var(--success)"}
							/>

							<div
								style={{
									width: "100%",
									height: "0.125rem",
									backgroundColor: "var(--border)",
								}}
							/>
							<BackButton page="packVersion" />
						</>
					)}

					{page === "gameVersion" && (
						<div
							className="container"
							style={{ width: "max-content", gap: "0.5rem" }}
						>
							<span
								style={{
									fontWeight: 700,
									width: "100%",
									padding: "0.5rem 1rem",
									boxSizing: "border-box",
									textAlign: "center",
								}}
							>
								Choose Minecraft Version
							</span>

							<RenderSupportedVersions
								packData={packData!}
								onClick={(v) => {
									setMinecraftVersion(v)
									setPage("packVersion")
								}}
							/>
							<div
								style={{
									width: "100%",
									height: "0.125rem",
									backgroundColor: "var(--border)",
								}}
							/>
							<CloseButton close={close} />
						</div>
					)}

					{page === "packVersion" && (
						<div
							className={`container packDownloadVersions ${showAllVersions ? "showAll" : ""}`}
							style={{ width: "max-content", gap: "0.5rem" }}
						>
							<span
								style={{
									fontWeight: 700,
									width: "100%",
									padding: "0.5rem 1rem",
									boxSizing: "border-box",
									textAlign: "center",
								}}
							>
								Choose Pack Version
							</span>
							<div
								style={{
									width: "100%",
									height: "0.125rem",
									backgroundColor: "var(--border)",
								}}
							/>
							{packVersions}

							<div
								style={{
									width: "100%",
									height: "0.125rem",
									backgroundColor: "var(--border)",
								}}
							/>
							<BackButton page={"gameVersion"} />
						</div>
					)}
				</>
			)}
		/>
	)
}



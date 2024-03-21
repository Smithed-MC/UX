import { open } from "@tauri-apps/api/shell"
import {
	DownloadButton,
	IconTextButton,
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
	PackBundle,
	PackBundle_v2,
	PackData,
	PackEntry,
	PackMetaData,
	PackVersion,
	supportedMinecraftVersions,
	UserData,
} from "data-types"
import React, {
	createContext,
	MouseEventHandler,
	useRef,
	useState,
	version,
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

interface PackInfoProps {
	yOffset: number
	packEntry?: PackEntry
	packData?: PackData
	id: string
	fixed: boolean
	onClose: () => void
	style?: React.CSSProperties
	downloadButton: DownloadButton
	showBackButton: boolean
}

if (
	!import.meta.env.SSR &&
	window.__TAURI_IPC__ !== undefined &&
	markdownOptions !== undefined
) {
	markdownOptions.a = ({ children, ...props }) => (
		<a
			{...props}
			target="_blank"
			href={undefined}
			onClick={(e) => {
				open(props.href ?? "")
			}}
		>
			{children}
		</a>
	)
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

function showSupportedVersions(
	packData: PackData,
	onClick: (v: string) => void
) {
	const longestVersion = [...fullMinecraftVersions]
		.sort((a, b) => a.length - b.length)
		.at(-1)!

	return [...fullMinecraftVersions]
		.sort((a, b) => compare(coerce(a) ?? "", coerce(b) ?? ""))
		.reverse()
		.filter(
			(mcVersion) =>
				packData.versions.find((v) =>
					v.supports.includes(mcVersion)
				) !== undefined
		)
		.map((v) => {
			const sortedVersions = packData?.versions
				.sort((a, b) =>
					compare(coerce(a.name) ?? "", coerce(b.name) ?? "")
				)
				.reverse()
			const attachedVersion = sortedVersions?.find((ver) =>
				ver.supports.includes(v)
			)
			const latestVersion = sortedVersions?.at(0)

			const isLatest = latestVersion === attachedVersion

			return (
				<WidgetOption isLatest={isLatest} onClick={() => onClick(v)}>
					<span
						style={{
							fontWeight: 600,
							position: "relative",
						}}
					>
						<span style={{ opacity: 0 }}>{longestVersion}</span>
						<span style={{ position: "absolute", left: 0 }}>
							{v}
						</span>
					</span>
					<span style={{ opacity: 0.25, paddingRight: "2rem" }}>
						{!attachedVersion?.name.startsWith("v") && "v"}
						{attachedVersion?.name}
					</span>
				</WidgetOption>
			)
		})
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
					{showSupportedVersions(packData!, (v) => {
						setMinecraftVersion(v)
						changePage("right")
					})}
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

	const supportedVersions = showSupportedVersions(packData!, (v) => {
		setMinecraftVersion(v)
		setPage("packVersion")
	})

	const navigate = useNavigate()

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

							{supportedVersions}

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
							{supportedVersions.length > 1 ? (
								<BackButton page={"gameVersion"} />
							) : (
								<CloseButton close={close} />
							)}
						</div>
					)}
				</>
			)}
		/>
	)
}

export default function PackInfo({
	yOffset,
	packEntry,
	id,
	fixed,
	onClose,
	style,
	downloadButton: DownloadButton,
	showBackButton,
}: PackInfoProps) {
	const loaderData = useLoaderData() as any
	// console.log(loaderData)

	const packData: PackData | undefined = loaderData.packData
	const metaData: PackMetaData | undefined = loaderData.metaData
	const owner: UserData | undefined = loaderData.owner
	const fullview: string = loaderData.fullview
	// console.log(fullview)
	const [showBundleSelection, setShowBundleSelection] = useState(false)
	const [injectPopup, setInjectPopup] = useState<undefined | JSX.Element>(
		undefined
	)

	const parentDiv = useRef<HTMLDivElement>(null)
	const spinnerDiv = useRef<HTMLDivElement>(null)

	return (
		<div
			className="container packInfoRoot"
			style={{ width: "100%", gap: "4rem", ...style }}
		>
			<div className="packPageHeader" style={{}}>
				<div className="packDetailsContainer">
					<img
						src={packData?.display.icon}
						style={{
							gridArea: "icon",
							borderRadius: "var(--defaultBorderRadius)",
						}}
					></img>
					<label
						style={{
							gridArea: "name",
							fontSize: "1.5rem",
							fontWeight: 600,
						}}
					>
						{packData?.display.name}
					</label>
					<label style={{ gridArea: "byLine" }}>
						by <a href={`/${owner?.uid}`}>{owner?.displayName}</a>
						<label className="packDetailsUpdateInfo">
							{` ∙ ${metaData?.stats.updated ? "Updated" : "Uploaded"} ${prettyTimeDifference(metaData?.stats.updated ?? metaData?.stats.added ?? 0)} ago`}
						</label>
					</label>
				</div>
				<div className="downloadContainer">
					{/* <AddToBundleModal
						trigger={
							<div
								className="buttonLike"
								style={{ display: "flex" }}
								onClick={() => setShowBundleSelection(true)}
							>
								<Plus />
							</div>
						}
						packData={packData}
						isOpen={showBundleSelection}
						close={() => setShowBundleSelection(false)}
						id={id}
					/> */}
					<div className="container" style={{ gap: "0.5rem" }}>
						<DownloadPackModal packData={packData!} packId={id}>
							<DownloadButton
								id={id}
								openPopup={(element) => {
									setInjectPopup(element)
								}}
								closePopup={() => {
									setInjectPopup(undefined)
								}}
							/>
						</DownloadPackModal>

						<label style={{ color: "var(--border)" }}>
							{(() => {
								const version = packData?.versions
									.sort((a, b) =>
										compare(
											coerce(a.name) ?? "",
											coerce(b.name) ?? ""
										)
									)
									.at(-1)

								if (
									version?.supports[0] ===
									version?.supports.at(-1)
								)
									return version?.supports[0]

								return `${version?.supports[0]} — ${version?.supports.at(-1)}`
							})()}
						</label>
					</div>
				</div>
				<div className="userButtonsContainer">
					{showBackButton && <BackButton />}
					{packData?.display.urls?.discord &&
						packData?.display.urls?.discord.length > 0 && (
							<IconTextButton
								className={"packInfoMediaButton"}
								icon={Discord}
								text={"Join Discord"}
								href={packData?.display.urls?.discord}
							/>
						)}
					{packData?.display.urls?.homepage &&
						packData?.display.urls?.homepage.length > 0 && (
							<IconTextButton
								className={"packInfoMediaButton"}
								iconElement={<Globe fill="var(--foreground)" />}
								text={"Official website"}
								href={packData?.display.urls?.homepage}
							/>
						)}
					{packData?.display.urls?.source &&
						packData?.display.urls?.source.length > 0 && (
							<IconTextButton
								className={"packInfoMediaButton"}
								icon={Github}
								text={"Source code"}
								href={packData?.display.urls?.source}
							/>
						)}
					<IconTextButton
						className="accentedButtonLike packInfoSmallDownload packInfoMediaButton"
						iconElement={<Download fill="var(--foreground)" />}
						text={"Download"}
						href={
							import.meta.env.VITE_API_SERVER +
							`/download?pack=${id}`
						}
						rel="nofollow"
					/>
				</div>
			</div>
			<div style={{ maxWidth: "53rem" }}>
				{fullview !== undefined && fullview !== "" && (
					<MarkdownRenderer style={{}}>{fullview}</MarkdownRenderer>
				)}
			</div>
			{injectPopup}
		</div>
	)
}

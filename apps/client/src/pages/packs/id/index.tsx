import { Link, useLoaderData, useNavigate, useParams } from "react-router-dom"
import {
	PackData,
	Image,
	PackMetaData,
	PackVersion,
	UserData,
} from "data-types"
import {
	CategoryBar,
	CategoryChoice,
	DownloadButton,
	IconTextButton,
	markdownOptions,
	MarkdownRenderer,
	Modal,
} from "components"
import "./index.css"
import "../../../widget/packInfo.css"
import { Helmet } from "react-helmet"
import {
	Discord,
	Globe,
	Github,
	Download,
	File,
	Picture,
	CurlyBraces,
	Jigsaw,
} from "components/svg"
import { prettyTimeDifference } from "formatters"
import { useContext, useState } from "react"
import { compare, coerce, SemVer } from "semver"
import { ClientContext } from "../../../context"
import BackButton from "../../../widget/BackButton"
import { useCurrentBundle, useQueryParams } from "hooks"
import { DownloadPackModal } from "../../../widget/downloadPackWidget"

if (
	!import.meta.env.SSR &&
	window.__TAURI_IPC__ !== undefined &&
	markdownOptions !== undefined
) {
	markdownOptions.a = ({ children, ...props }) => (
		<Link
			{...props}
			target="_blank"
			to={""}
			onClick={(e) => {
				e.preventDefault()
				open(props.href ?? "")
			}}
		>
			{children}
		</Link>
	)
}

export default function Packs() {
	const { id: id } = useParams()
	const loaderData = useLoaderData() as any
	const clientContext = useContext(ClientContext)
	const navigate = useNavigate()
	const tab = useQueryParams().tab ?? "readme"

	const DownloadButton = clientContext.packDownloadButton

	const packData: PackData = loaderData.packData!
	const metaData: PackMetaData = loaderData.metaData
	const owner: UserData | undefined = loaderData.owner
	const fullview: string = loaderData.fullview
	// console.log(fullview)
	const [injectPopup, setInjectPopup] = useState<undefined | JSX.Element>(
		undefined
	)
	return (
		<div
			className="packPage"
			style={{ width: "100%", boxSizing: "border-box" }}
		>
			<Helmet>
				<title>{packData.display.name}</title>
				<meta
					name="description"
					content={packData.display.description}
				/>
				<meta name="og:image" content={packData.display.icon} />
				<meta name="og:site_name" content="Smithed" />
				<link rel="canonical" href={`https://${import.meta.env.VITE_NIGHTLY ? "nightly.smithed.dev" : "smithed.net"}/packs/${packData.id}`}/>
			</Helmet>
			<div
				className="container"
				style={{
					gap: 16,
					height: "100%",
					boxSizing: "border-box",
					width: "100%",
					justifyContent: "safe start",
					alignItems: "safe center",
				}}
			>
				<div
					className="container packInfoRoot"
					style={{ width: "100%", gap: "4rem" }}
				>
					<div className="packPageHeader">
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
								by{" "}
								<Link to={`/${owner?.uid}`}>
									{owner?.displayName}
								</Link>
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
							<div
								className="container"
								style={{ gap: "0.5rem" }}
							>
								<DownloadPackModal
									packData={packData!}
									packId={id!}
								>
									<DownloadButton
										id={id!}
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
							{clientContext.showBackButton && <BackButton />}
							{packData?.display.urls?.discord &&
								packData?.display.urls?.discord.length > 0 && (
									<IconTextButton
										className={"packInfoMediaButton"}
										icon={Discord}
										text={"Join Discord"}
										to={packData?.display.urls?.discord}
									/>
								)}
							{packData?.display.urls?.homepage &&
								packData?.display.urls?.homepage.length > 0 && (
									<IconTextButton
										className={"packInfoMediaButton"}
										iconElement={
											<Globe fill="var(--foreground)" />
										}
										text={"Official website"}
										to={packData?.display.urls?.homepage}
									/>
								)}
							{packData?.display.urls?.source &&
								packData?.display.urls?.source.length > 0 && (
									<IconTextButton
										className={"packInfoMediaButton"}
										icon={Github}
										text={"Source code"}
										to={packData?.display.urls?.source}
									/>
								)}
							<IconTextButton
								className="accentedButtonLike packInfoSmallDownload packInfoMediaButton"
								iconElement={
									<Download fill="var(--foreground)" />
								}
								text={"Download"}
								to={
									import.meta.env.VITE_API_SERVER +
									`/download?pack=${id}`
								}
								rel="nofollow"
							/>
						</div>
					</div>
					<CategoryBar
						defaultValue={tab as string}
						onChange={(v) => navigate("?tab=" + v)}
					>
						<CategoryChoice
							icon={<File />}
							value="readme"
							text="ReadMe"
						/>
						<CategoryChoice
							icon={<Picture />}
							value="gallery"
							text="Gallery"
							hidden={packData.display.gallery === undefined}
						/>
						<CategoryChoice
							icon={<Download />}
							value="versions"
							text="Versions"
						/>
					</CategoryBar>
					{tab == "readme" && <PackReadMe readme={fullview} />}
					{tab == "gallery" && (
						<PackGallery
							id={id!}
							gallery={packData.display.gallery!}
						/>
					)}
					{tab == "versions" && (
						<PackVersions id={id!} versions={packData.versions} />
					)}
					{injectPopup}
				</div>
			</div>
		</div>
	)
}

export interface PacksProps {
	packDownloadButton: DownloadButton
	showBackButton: boolean
}

function PackReadMe({ readme }: { readme: string }) {
	return (
		<div style={{ maxWidth: "53rem", width: "100%" }}>
			<MarkdownRenderer>{readme}</MarkdownRenderer>
		</div>
	)
}

function PackGallery({ id, gallery }: { id: string; gallery: Image[] }) {
	return (
		<div
			style={{
				maxWidth: "53rem",
				display: "grid",
				gridTemplateColumns: "50% 50%",
				gap: "2rem",
			}}
		>
			{gallery.map((v, i) => (
				<img
					key={i}
					style={{
						width: "100%",
						borderRadius: "var(--defaultBorderRadius)",
						border: "0.125rem solid var(--border)",
					}}
					src={`https://api.smithed.dev/v2/packs/${id}/gallery/${i}`}
				/>
			))}
		</div>
	)
}

function PackVersions({
	id,
	versions,
}: {
	id: string
	versions: PackVersion[]
}) {
	return (
		<div style={{ maxWidth: "53rem" }} className="packVersions">
			{versions
				.sort(
					(a, b) =>
						-compare(coerce(a.name) ?? "", coerce(b.name) ?? "")
				)
				.map((version, i) => (
					<PackVersionEntry
						id={id}
						key={version.name}
						version={version}
						latest={i === 0}
					/>
				))}
		</div>
	)
}

function download(id: string, version: string | undefined, mode: string) {
	const url =
		import.meta.env.VITE_API_SERVER +
		`/download?pack=${id}${version ? "@" + version : ""}&mode=${mode}`
	window.open(url)
}

function DownloadOption({
	id,
	version,
	text,
	value,
	icon,
	color,
}: {
	id: string
	version: string
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
				download(id, version, value)
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

function PackVersionEntry({
	id,
	version,
	latest,
}: {
	id: string
	version: PackVersion
	latest?: boolean
}) {
	version.supports.sort((a, b) => compare(coerce(a) ?? "", coerce(b) ?? ""))
	const semver = new SemVer(version.name)
	return (
		<>
			<span>
				<span style={{ fontWeight: 600 }}>
					{version.name}
					{latest ? " - Latest" : ""}
				</span>
				<br />
				{version.supports.length > 1 && (
					<>
						{version.supports[0]} - {version.supports.at(-1)}
					</>
				)}
				{version.supports.length == 1 && <>{version.supports[0]}</>}
			</span>
			<div className="container" style={{ alignItems: "start" }}>
				{version.downloads.datapack &&
					!version.downloads.resourcepack &&
					"Datapack"}
				{!version.downloads.datapack &&
					version.downloads.resourcepack &&
					"Resourcepack"}
				{version.downloads.datapack &&
					version.downloads.resourcepack &&
					"Data & Resourcepack"}
			</div>
			<div className="container" style={{ alignItems: "end" }}>
				{version.downloads.datapack &&
					!version.downloads.resourcepack && (
						<a
							className="buttonLike"
							style={{
								backgroundColor: "var(--accent)",
							}}
							href={`${import.meta.env.VITE_API_SERVER}/download?pack=${id}@${version.name}&mode=datapack`}
						>
							<Download />
						</a>
					)}
				{!version.downloads.datapack &&
					version.downloads.resourcepack && (
						<a
							className="buttonLike"
							style={{
								backgroundColor: "var(--accent)",
							}}
							href={`${import.meta.env.VITE_API_SERVER}/download?pack=${id}@${version.name}&mode=resourcepack`}
						>
							<Download />
						</a>
					)}
				{version.downloads.datapack &&
					version.downloads.resourcepack && (
						<Modal
							trigger={
								<button
									style={{
										backgroundColor: "var(--accent)",
									}}
								>
									<Download />
								</button>
							}
							content={({}) => (
								<>
									<DownloadOption
										value="datapack"
										text={"Datapack"}
										icon={<Jigsaw />}
										id={id}
										version={version.name}
									/>
									<DownloadOption
										value="resourcepack"
										text={"Resourcepack"}
										icon={<Picture />}
										id={id}
										version={version.name}
									/>
									<DownloadOption
										value="both"
										text={"Combined"}
										icon={<CurlyBraces />}
										color={"var(--success)"}
										id={id}
										version={version.name}
									/>
								</>
							)}
						/>
					)}
			</div>
		</>
	)
}

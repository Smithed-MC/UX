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
import { CreateBundle } from "./bundle"
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
	onClick?: (e: React.MouseEvent) => void
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

function RenderPackVersions({
	packData,
	gameVersion,
	onSelect,
	download,
}: {
	packData: PackData
	gameVersion: string
	onSelect: (e: React.MouseEvent, v: PackVersion) => void
	download?: boolean
}) {
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
				onClick={(e) => onSelect(e, v)}
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

function downloadPack(
	packId: string,
	gameVersion: string,
	packVersion: PackVersion | undefined,
	mode: string
) {
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
	packId,
	packVersion,
	gameVersion,
}: {
	text: string
	value: string
	icon: JSX.Element | string
	color?: string
	packId: string
	packVersion: PackVersion
	gameVersion: string
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
				downloadPack(packId, gameVersion, packVersion, value)
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

function BackButton({ onClick }: { onClick: () => void }) {
	return (
		<div
			className="container compactButton"
			style={{
				flexDirection: "row",
				gap: "0.5rem",
				margin: "0.5rem 0rem",
			}}
			onClick={onClick}
		>
			<Right style={{ transform: "rotate(180deg)" }} /> Back
		</div>
	)
}

function CloseButton({ close }: { close: MouseEventHandler }) {
	return (
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
}

export function DownloadPackModal({
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
						<DownloadModePage
							onBack={() => setPage("packVersion")}
							packId={packId}
							packVersion={packVersion!}
							gameVersion={gameVersion!}
						/>
					)}

					{page === "gameVersion" && (
						<GameVersionPage
							packData={packData!}
							onSelect={(v) => {
								setMinecraftVersion(v)
								setPage("packVersion")
							}}
							onClose={close}
						/>
					)}

					{page === "packVersion" && (
						<PackVersionPage
							packData={packData!}
							gameVersion={gameVersion!}
							onSelect={(e, v) => {
								let mode = ""

								// If no resourcepack is set, auto download the datapack
								if (
									!v.downloads.resourcepack ||
									v.downloads.resourcepack === ""
								) {
									mode = "datapack"
								} else if (
									!v.downloads.datapack ||
									v.downloads.datapack === ""
								) {
									// Same for the datapack
									mode = "resourcepack"
								} else {
									// Otherwise open the modal
									setPage("mode")
									setPackVersion(v)
								}

								if (mode !== "")
									downloadPack(packId, gameVersion!, v, mode)
							}}
							showAllVersions={false}
							onBack={() => setPage("gameVersion")}
							backEnabled={true}
						/>
					)}
				</>
			)}
		/>
	)
}

export function GameVersionPage({
	packData,
	onSelect,
	onClose,
}: {
	packData: PackData
	onSelect: (v: string) => void
	onClose: React.MouseEventHandler
}) {
	return (
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

			<RenderSupportedVersions packData={packData} onClick={onSelect} />
			<div
				style={{
					width: "100%",
					height: "0.125rem",
					backgroundColor: "var(--border)",
				}}
			/>
			<CloseButton close={onClose} />
		</div>
	)
}

export function PackVersionPage({
	showAllVersions,
	packData,
	gameVersion,
	backEnabled,
	onBack,
	onSelect,
}: {
	showAllVersions: boolean
	packData: PackData
	gameVersion: string
	backEnabled: boolean
	onBack: () => void
	onSelect: (e: React.MouseEvent, v: PackVersion) => void
}) {
	return (
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
			<RenderPackVersions
				packData={packData}
				gameVersion={gameVersion}
				onSelect={onSelect}
				download={true}
			/>
			{backEnabled && (
				<>
					<div
						style={{
							width: "100%",
							height: "0.125rem",
							backgroundColor: "var(--border)",
						}}
					/>
					<BackButton onClick={onBack} />
				</>
			)}
		</div>
	)
}

function DownloadModePage({
	onBack,
	packId,
	packVersion,
	gameVersion,
}: {
	onBack: () => void
	packId: string
	packVersion: PackVersion
	gameVersion: string
}) {
	return (
		<>
			<DownloadOption
				value="datapack"
				text={"Datapack"}
				icon={<Jigsaw />}
				packId={packId}
				packVersion={packVersion}
				gameVersion={gameVersion}
			/>
			<DownloadOption
				value="resourcepack"
				text={"Resourcepack"}
				icon={<Picture />}
				packId={packId}
				packVersion={packVersion}
				gameVersion={gameVersion}
			/>
			<DownloadOption
				value="both"
				text={"Combined"}
				icon={<CurlyBraces />}
				color={"var(--success)"}
				packId={packId}
				packVersion={packVersion}
				gameVersion={gameVersion}
			/>

			<div
				style={{
					width: "100%",
					height: "0.125rem",
					backgroundColor: "var(--border)",
				}}
			/>
			<BackButton onClick={onBack} />
		</>
	)
}

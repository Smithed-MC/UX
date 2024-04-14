import { IconTextButton } from "components";
import { List, Pin } from "components/svg";
import { BundleVersion, PackData, PackVersion } from "data-types";
import { useState, useEffect } from "react";
import { compare, coerce } from "semver";

function PackVersionOption({
	version,
	selected,
	onClick,
}: {
	version: PackVersion
	selected: boolean
	onClick: () => void
}) {
	return (
		<button
			key={version.name}
			style={{
				width: "100%",
				color: selected ? "var(--warning)" : undefined,
				backgroundColor: "transparent",
				justifyContent: "start",
				display: "flex",
				flexDirection: "row",
			}}
			onClick={onClick}
		>
			{version.name}

			{selected && (
				<>
					<div style={{ flexGrow: 1 }} />
					<div
						style={{
							height: "1.125rem",
							border: "0.075rem solid var(--warning)",
							opacity: 0.5,
						}}
					/>
					<Pin style={{ color: "var(--warning)" }} />
				</>
			)}
		</button>
	)
}

export default function RenderPackVersionOptions({
		packRef,
		versions: initialVersions,
		openState,
		setPackVersion,
		selectedVersion,
		cachedPacks
	}: {
		packRef: { id: string; version?: string }
		versions: PackVersion[]
		openState: boolean
		setPackVersion: (v: string) => void
		selectedVersion: BundleVersion|undefined
		cachedPacks: Record<string, PackData>
	}) {
		const versionsSort = (a: PackVersion, b: PackVersion) =>
			a.name === packRef.version
				? -1
				: b.name === packRef.version
					? 1
					: -compare(coerce(a.name) ?? "", coerce(b.name) ?? "")

		const [showAllVersions, setShowAllVersions] = useState(false)
		const [versions, setVersions] = useState(initialVersions)

		const versionsInCurrentRange = versions
			.sort(versionsSort)
			.filter(
				(v) =>
					selectedVersion?.supports.find((mcVersion) =>
						v.supports.includes(mcVersion)
					) || v.name === packRef.version
			)

		useEffect(() => {
			if (!openState) setShowAllVersions(false)
		}, [openState])

		const displayedVersions = showAllVersions
			? versions
			: versionsInCurrentRange.slice(0, 5)

		return (
			<div
				className="container"
				style={{
					gap: "1rem",
					minWidth: "8rem",
					overflowY:
						displayedVersions.length > 5 ? "auto" : undefined,
					height: "max-content",
					maxHeight:
						displayedVersions.length > 5
							? "calc((2.25rem * 5) + 4rem)"
							: undefined,
				}}
			>
				{displayedVersions.map((v) => (
					<PackVersionOption
						key={v.name}
						version={v}
						selected={v.name === packRef.version}
						onClick={() => {
							setPackVersion(v.name)
							setVersions([...versions].sort(versionsSort))
						}}
					/>
				))}
				{!showAllVersions &&
					versionsInCurrentRange.length < versions.length && (
						<IconTextButton
							iconElement={
								<List
									style={{
										color: "color-mix(in srgb, var(--foreground) 50%, transparent)",
									}}
								/>
							}
							text={`...${versions.length - versionsInCurrentRange.length} more`}
							reverse
							style={{
								backgroundColor: "transparent",
								color: "color-mix(in srgb, var(--foreground) 50%, transparent)",
							}}
							onClick={() => setShowAllVersions(true)}
						/>
					)}
			</div>
		)
	}
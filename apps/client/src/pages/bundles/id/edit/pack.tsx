import { Modal, IconTextButton } from "components"
import { getBadges } from "components/GalleryPackCard"
import { Trash, Right } from "components/svg"
import { BundleVersion, PackData, PackReference } from "data-types"
import { useState } from "react"
import { Link } from "react-router-dom"
import RenderPackVersionOptions from "./renderPackVersionOptions"

export function Pack({
	packData,
	packRef,
	selectedVersion,
	cachedPacks,
}: {
	packData: PackData & { author: string }
	packRef: { id: string; version?: string }
	selectedVersion: BundleVersion|undefined
	cachedPacks: Record<string, PackData>
}) {
	const [packVersion, setPackVersion] = useState(packRef.version)

	return (
		<div
			className="container"
			style={{
				padding: "1rem",
				borderRadius: "var(--defaultBorderRadius)",
				backgroundColor: "var(--section)",
				flexDirection: "column",
				width: "100%",
				boxSizing: "border-box",
				justifyContent: "start",
				alignItems: "start",
				gap: "0.5rem",
			}}
		>
			<div
				className="container"
				style={{
					boxSizing: "border-box",
					flexDirection: "row",
					gap: "0.5rem",
					width: "100%",
				}}
			>
				<Link
					to={"/packs/" + packRef.id}
					style={{
						fontWeight: 600,
						fontSize: "1.5rem",
						color: "var(--foreground)",
						textDecoration: "none",
						height: "2rem",
						maxHeight: "2rem",
						lineHeight: "2rem",
						WebkitLineClamp: 1,
						textOverflow: "ellipsis",
						WebkitBoxOrient: "vertical",
						display: "-webkit-box",
						overflow: "hidden",
					}}
				>
					{packData.display.name}
				</Link>
				{packVersion && (
					<div
						style={{
							padding: "0.5rem 1rem",
							borderRadius: "var(--defaultBorderRadius)",
							backgroundColor: "var(--highlight)",
							boxSizing: "border-box",
							color: "color-mix(in srgb, var(--foreground) 50%, transparent)",
						}}
					>
						{packVersion.startsWith("v") ? "" : "v"}
						{packVersion}
					</div>
				)}
				<div style={{ flexGrow: 1 }} />
				{(() => {
					const badges = getBadges(packData, "")

					if (badges.length == 0) return <></>

					return (
						<div
							className="container"
							style={{
								padding: "0.5rem 1rem",
								borderRadius: "var(--defaultBorderRadius)",
								backgroundColor: "var(--bold)",
								boxSizing: "border-box",
								height: "2.25rem",
								alignItems: "center",
								flexDirection: "row",
								gap: "0.5rem",
							}}
						>
							{badges}
						</div>
					)
				})()}
			</div>
			<div
				style={{
					height: "2.5rem",
					maxHeight: "2.5rem",
					lineHeight: "1.25rem",
					WebkitLineClamp: 2,
					textOverflow: "ellipsis",
					WebkitBoxOrient: "vertical",
					display: "-webkit-box",
					overflow: "hidden",
				}}
			>
				{packData.display.description}
			</div>
			<div
				className="container"
				style={{
					gap: "0.5rem",
					flexDirection: "row",
					width: "100%",
				}}
			>
				<span style={{ opacity: 0.5 }}>
					by{" "}
					<Link
						style={{ color: "var(--foreground)" }}
						to={"/" + packData.author}
					>
						{packData.author}
					</Link>
				</span>
				<div style={{ flexGrow: 1 }} />
				{packVersion && (
					<button
						className="buttonLike"
						style={{
							backgroundColor: "var(--highlight)",
						}}
					>
						<Trash />
					</button>
				)}
				<Modal
					trigger={
						<IconTextButton
							className="accentedButtonLike"
							iconElement={
								<Right style={{ transform: "rotate(90deg)" }} />
							}
							text={packVersion ? "Edit" : "Add"}
							reverse
						/>
					}
					content={({ openState }) => (
						<RenderPackVersionOptions
							packRef={packRef}
							versions={packData.versions}
							openState={openState}
							setPackVersion={(v) => {
								if (packRef.version === undefined) {
									selectedVersion?.packs.push(
										packRef as PackReference
									)
									cachedPacks[packRef.id] = packData
								}

								packRef.version = v
								setPackVersion(v)
							}}
							selectedVersion={selectedVersion}
							cachedPacks={cachedPacks}
						/>
					)}
				/>
			</div>
		</div>
	)
}

import { Trash } from "components/svg"
import { BundleVersion, PackVersion } from "data-types"
import { useRef, useEffect } from "react"
import { valid } from "semver"
import { useErrorEventHandlers } from "./errorEvents"

export default function VersionSelectOption({
	index,
	version,
	allVersions,
	setSelectedVersion,
	selectedVersion,
	onDelete,
}: {
	readonly version: PackVersion|BundleVersion
	readonly index: number
	readonly setSelectedVersion: (v: any) => void
	readonly selectedVersion?: { name: string }
	allVersions: { name: string }[]
	onDelete: (removed: {name: string}, versions: {name: string}[]) => void
}) {
	const select = (version: PackVersion|BundleVersion) => {
		const matches = allVersions.filter(
			(v) => v.name === selectedVersion?.name
		)

		if (matches.length > 1) return alert("Resolve version name conflict!")

		if (
			selectedVersion !== undefined &&
			valid(selectedVersion?.name) == null
		)
			return alert("Selected version name is not valid SemVer")

		setSelectedVersion(version)
	}

	const ref = useRef<HTMLElement>()

	useErrorEventHandlers(ref, (hasError) => {
		const option = document.getElementById(`versions/${index}_select`)

		option?.style.setProperty(
			"color",
			hasError ? "var(--disturbing)" : null
		)

		if (hasError) option?.classList.add("hasError")
		else option?.classList.remove("hasError")
	})

	useEffect(() => {
		ref.current = document.getElementById(`versions/${index}`)!
	}, [])

	return (
		<span
			className={`versionChoice ${version === selectedVersion ? "selected" : ""}`}
			id={`versions/${index}_select`}
			key={version.name}
			onClick={(e) => {
				if (!(e.target instanceof HTMLSpanElement)) return
				
				select(version)
			}}
		>
			<span id={`packVersionOption${version.name}`}>{version.name}</span>
			{allVersions.length > 1 && (
				<div
					id="trashButton"
					className="container"
					style={{
						position: "absolute",
						right: "0.75rem",
						top: 0,
						height: "100%",
						transition: "all 0.2s ease-in-out",
					}}
				>
					<button
						style={{
							backgroundColor: "transparent",
							width: "2rem",
							height: "2rem",
							padding: 0,
							justifyContent: "center"
						}}
						onClick={(e) => {
							e.preventDefault()
							
							const removed = allVersions.splice(index, 1)[0]
							

							if (selectedVersion === version) {
								setSelectedVersion(
									allVersions[
										allVersions.length === index
											? index - 1
											: index
									]
								)
							}

							onDelete(removed, allVersions)
						}}
					>
						<Trash />
					</button>
				</div>
			)}
		</span>
	)
}

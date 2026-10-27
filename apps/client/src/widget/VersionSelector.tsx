import { FullscreenModal } from "components"
import { supportedMinecraftVersions } from "data-types"
import { CSSProperties, useEffect, useRef, useState } from "react"
import "./VersionSelector.css"

function isDevVersion(v: string): boolean {
	return v.includes("-")
}

function getBaseVersion(v: string): string {
	if (!isDevVersion(v)) return v
	return v.split("-")[0]
}

function getMinorVersion(v: string): string {
	const base = getBaseVersion(v)
	return base.split(".").slice(0, 2).join(".")
}

function groupVersions(versions: string[]): Record<string, string[]> {
	const groups: Record<string, string[]> = {}

	versions.forEach((v) => {
		const minor = getMinorVersion(v)
		if (isDevVersion(v)) {
			const key = `${minor} Snapshots`
			if (!groups[key]) groups[key] = []
			groups[key].push(v)
		} else {
			const key = minor
			if (!groups[key]) groups[key] = []
			groups[key].push(v)
		}
	})

	return groups
}

function compareVersions(a: string, b: string): number {
	const indexA = supportedMinecraftVersions.indexOf(a)
	const indexB = supportedMinecraftVersions.indexOf(b)
	if (indexA > indexB) return 1
	if (indexA < indexB) return -1
	return 0
}

function sortGroupsByVersion(groups: string[]): string[] {
	const groupsWithBase: { key: string; base: string }[] = groups.map((key) => {
		const isDev = key.includes(" Snapshots")
		const base = isDev ? key.split(" ")[0] : key
		return { key, base }
	})

	return groupsWithBase
		.sort((a, b) => {
			if (a.base !== b.base) return compareVersions(a.base, b.base)
			const aIsDev = a.key.includes(" Snapshots")
			const bIsDev = b.key.includes(" Snapshots")
			if (aIsDev && !bIsDev) return 1
			if (!aIsDev && bIsDev) return -1
			return 0
		})
		.map(({ key }) => key)
}

type Group = {
	key: string
	versions: string[]
}

function filterGameVersions(
	versions: string[],
	searchQuery: string,
	showDev: boolean,
): Group[] {
	const filtered = versions.filter((v) => {
		if (!showDev && isDevVersion(v)) {
			return false
		}
		return searchQuery
			? v.toLowerCase().includes(searchQuery.toLowerCase())
			: true
	})

	const groups = groupVersions(filtered)
	const sortedKeys = sortGroupsByVersion(Object.keys(groups))

	const result: Group[] = []

	return sortedKeys.map((key) => {
		let versions = [...groups[key]]

		versions.sort((a, b) => {
			const baseA = getBaseVersion(a)
			const baseB = getBaseVersion(b)
			return compareVersions(baseA, baseB)
		})

		return { key, versions }
	})
}

export default function VersionSelector({
	versions: initialVersions = [],
	placeholder = "Version",
	className,
	style,
	onChange,
	onClose,
}: {
	versions?: string[]
	placeholder?: string
	className?: string
	style?: CSSProperties
	onChange?: (versions: string[]) => void
	onClose?: (versions: string[]) => void
}) {
	const [selected, setSelected] = useState<string[]>(initialVersions)
	const [searchQuery, setSearchQuery] = useState("")
	const [versionFilter, setVersionFilter] = useState<'release' | 'all'>('release')
	const [anchorVersion, setAnchorVersion] = useState<string | null>(null)
	const [isHoldingShift, setIsHoldingShift] = useState(false)
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Shift") setIsHoldingShift(true)
		}
		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.key === "Shift") setIsHoldingShift(false)
		}
		window.addEventListener("keydown", handleKeyDown)
		window.addEventListener("keyup", handleKeyUp)
		return () => {
			window.removeEventListener("keydown", handleKeyDown)
			window.removeEventListener("keyup", handleKeyUp)
		}
	}, [])

	const filteredVersions = filterGameVersions(
		supportedMinecraftVersions,
		searchQuery,
		versionFilter === "all",
	)

	const handleVersionClick = (e: React.MouseEvent, version: string) => {
		e.stopPropagation()

		const isShift = isHoldingShift

		let newSelected: string[]

		if (isShift && anchorVersion) {
			const allVersions = filteredVersions.flatMap((g) => g.versions)
			const anchorIdx = allVersions.indexOf(anchorVersion)
			const targetIdx = allVersions.indexOf(version)

			if (anchorIdx === -1 || targetIdx === -1) {
				newSelected = selected.includes(version)
					? selected.filter((v) => v !== version)
					: [...selected, version]
			} else {
				const start = Math.min(anchorIdx, targetIdx)
				const end = Math.max(anchorIdx, targetIdx)
				const range = allVersions.slice(start, end + 1)

				const isTargetSelected = selected.includes(version)
				if (isTargetSelected) {
					newSelected = selected.filter((v) => !range.includes(v))
				} else {
					newSelected = [
						...selected,
						...range.filter((v) => !selected.includes(v)),
					]
				}
			}
			setAnchorVersion(version)
		} else {
			newSelected = selected.includes(version)
				? selected.filter((v) => v !== version)
				: [...selected, version]
			setAnchorVersion(version)
		}

		setSelected(newSelected)
		onChange?.(newSelected)
	}

	function formatButtonText() {
		if (selected.length === 0) {
			return (
				<>
					<span style={{ opacity: 0.5 }}>{placeholder}:</span>
					None Selected
				</>
			)
		} else if (selected.length === 1) {
			return (
				<>
					<span style={{ opacity: 0.5 }}>{placeholder}:</span>
					{selected[0]}
				</>
			)
		} else {
			return (
				<>
					<span style={{ opacity: 0.5 }}>{placeholder}:</span>
					{selected[0]} & {selected.length - 1} more
				</>
			)
		}
	}

	return (
		<FullscreenModal
			title="Select Minecraft Versions"
			trigger={
				<button
					className={`versionSelectorButton ${className}`}
					style={style}
				>
					{formatButtonText()}
				</button>
			}
			onClose={() => {
				onClose?.(selected)
			}}
		>
			<div ref={ref} style={{ position: "relative" }} className="versionSelector" id="version-selector">
				<div className="versionSelectorContent">
					<div className="versionSelectorHeader">
						<div className="searchContainer">
							<svg className="searchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
							</svg>
							<input
								type="text"
								placeholder="Search (e.g., '1.21.10', 'snap')"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="versionSearchInput"
							/>
						</div>
						<div className="toggleContainer">
							<button
								className={`filterButton ${versionFilter === 'release' ? 'selected' : ''}`}
								onClick={() => setVersionFilter('release')}
							>
								Release
							</button>
							<button
								className={`filterButton ${versionFilter === 'all' ? 'selected' : ''}`}
								onClick={() => setVersionFilter('all')}
							>
								All
							</button>
						</div>
					</div>

					<div className="versionSelectorBody">
						{filteredVersions.length === 0 ? (
							<div className="noVersionsFound">No versions found matching your search.</div>
						) : (
							<div className="versionGroups">
								{filteredVersions.map((group) => (
									<div key={group.key} className="versionGroup">
										<div className="groupLabel">{group.key}</div>
										<div className="versionGrid">
											{group.versions.map((v) => {
												const isSelected = selected.includes(v)
												const isAnchor = isHoldingShift && anchorVersion === v

												return (
													<div
														key={v}
														className={`versionButton ${isSelected ? 'selected' : ''} ${isAnchor ? 'anchor' : ''}`}
														onMouseDown={(e) => e.preventDefault()}
														onClick={(e) => handleVersionClick(e, v)}
													>
														<span className="versionText">{v}</span>
													</div>
												)
											})}
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					<div className="versionSelectorFooter">
						<span className="selectedCount">
							{selected.length} version{selected.length !== 1 ? 's' : ''} selected
						</span>
						<span className="anchorInfo">
							{anchorVersion ? 'Shift-click another version to select range' : ''}
						</span>
					</div>
				</div>
			</div>
		</FullscreenModal>
	)
}

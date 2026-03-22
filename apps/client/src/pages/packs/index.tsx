import {
	IconInput,
	ChooseBox,
	GalleryPackCard,
	IconTextButton,
	Modal,
} from "components"
import { useEffect, useRef, useState } from "react"
import {
	PackData,
	PackDependency,
	SortOptions,
	fullMinecraftVersions,
	latestMinecraftVersion,
	packCategories,
} from "data-types"
import { useLoaderData, useNavigate } from "react-router-dom"
import "./index.css"
import {
	useCurrentBundle,
	useFirebaseUser,
	useQueryParams,
} from "hooks"
import {
	Browse as BrowseSvg,
	Copy,
	Download,
	Plus,
	Right,
	Trash,
	Warning,
} from "components/svg.js"
import { Helmet } from "react-helmet"
import {
	BrowsePageData,
	DataForPackCards,
	PACKS_PER_PAGE,
	createBrowseSearchParams,
} from "../../loaders.js"
import PageSelector from "components/PageSelector.js"
import { CurrentBundle } from "store"
import {
	GameVersionPage,
	PackVersionPage,
} from "../../widget/downloadPackWidget"

export default function PacksBrowser(props: any) {
	const params = useQueryParams()
	const { search, category, sort, version, page } = params

	const { count: totalPacks, packs } = useLoaderData() as BrowsePageData
	const [categories, setCategories] = useState(
		new Set(
			category != null
				? typeof category === "string"
					? [category]
					: category
				: []
		)
	)
	const [versions, setVersions] = useState(
		new Set(
			version != null
				? typeof version === "string"
					? [version]
					: version
				: []
		)
	)

	const [showWidget, setShowWidget] = useState<string | undefined>(undefined)
	const [packSort, setPackSort] = useState(sort)

	const [addPack, setAddPack] = useState<string | undefined>(undefined)

	const navigate = useNavigate()
	const user = useFirebaseUser()
	const rootDiv = useRef<HTMLDivElement>(null)

	async function updateUrl(search: string | null | (string | null)[]) {
		const params = createBrowseSearchParams({
			search,
			category: categories,
			version: versions,
			sort: packSort,
		})
		if (page) params.set("page", page as string)
		document
			.getElementById("packCardContainer")
			?.style.setProperty("opacity", "0.2")
		navigate("/packs?" + params)
	}

	function onClick(p: string) {
		if ((rootDiv.current?.clientWidth ?? 0) < 1024)
			return navigate(`../packs/${p}`)
		setShowWidget(showWidget === p ? undefined : p)
	}

	function onPageChangePressed() {
		const cards = document.getElementById(
			"packCardContainer"
		)! as HTMLDivElement
		cards.style.setProperty("opacity", "0.2")
	}

	useEffect(() => {
		updateUrl(search)
	}, [search, categories.size, packSort, versions.size])

	useEffect(() => {
		document
			.getElementById("packCardContainer")
			?.style.setProperty("opacity", "1")
	}, [page, packs])

	return (
		<div
			className="container"
			style={{
				width: "100%",
				boxSizing: "border-box",
				height: "100%",
				justifyContent: "safe start",
				gap: 32,
			}}
		>
			{/* <Helmet>
				<title>Browse Datapacks</title>
				<meta name="description" content="Search for minecraft datapacks and resourcepacks to improve your game!" />
			</Helmet> */}
			<div
				className="container"
				style={{ gap: "1rem", width: "100%", maxWidth: "61.875rem" }}
			>
				<div
					className="container"
					style={{ width: "100%", boxSizing: "border-box", gap: 16 }}
				>
					<div
						className="container"
						style={{ flexDirection: "row", width: "100%", gap: 16 }}
					>
						<IconInput
							icon={BrowseSvg}
							placeholder="Search..."
							type="text"
							style={{ width: "100%", flexGrow: 1 }}
							defaultValue={
								search != null ? (search as string) : undefined
							}
							onChange={(e) => {
								updateUrl(e.currentTarget.value)
							}}
						/>
						<ChooseBox
							placeholder="Sort"
							style={{ maxWidth: "13rem" }}
							defaultValue={
								(sort == null ? "downloads" : sort) as string
							}
							choices={Object.keys(SortOptions).map((opt) => ({
								value: opt.toLowerCase(),
								content: opt,
							}))}
							onChange={(v) => {
								if (typeof v === "string") setPackSort(v)
							}}
						/>
					</div>
					<div
						className="container"
						style={{
							flexDirection: "row",
							justifyContent: "space-evenly",
							width: "100%",
							gap: "1rem",
						}}
					>
						<ChooseBox
							placeholder="Category"
							style={{ flexGrow: 1 }}
							defaultValue={Array.from(categories.values())
								.filter((c) => c != null)
								.map((c) => c as string)}
							choices={packCategories.map((cat) => {
								return { value: cat, content: cat }
							})}
							multiselect
							onChange={(v) => {
								setCategories(
									new Set(typeof v === "string" ? [v] : v)
								)
							}}
						/>
						<ChooseBox
							placeholder="Version"
							style={{ flexGrow: 1 }}
							defaultValue={Array.from(versions.values())
								.filter((c) => c != null)
								.map((c) => c as string)}
							choices={fullMinecraftVersions.map((v) => {
								return { value: v, content: v }
							})}
							multiselect
							onChange={(v) => {
								setVersions(
									new Set(typeof v === "string" ? [v] : v)
								)
							}}
						/>
					</div>
					{packs.length > 1 && (
						<PageSelector
							totalItems={totalPacks}
							currentPage={
								page != null
									? Number.parseInt(page as string)
									: 0
							}
							params={createBrowseSearchParams(params)}
							itemsPerPage={PACKS_PER_PAGE}
							onChange={onPageChangePressed}
						/>
					)}
				</div>
				<div className="packCardContainer" id="packCardContainer">
					{packs.map((p) => (
						<GalleryPackCard
							tag="browsePackCard"
							key={p.id}
							id={p.id}
							onClick={() => onClick(p.id)}
							parentStyle={{
								zIndex: addPack === p.id ? 1 : undefined,
							}}
							style={{
								border:
									p.id === showWidget
										? "0.125rem solid var(--accent)"
										: "",
							}}
							packData={p.pack}
							packMeta={p.meta}
							packAuthor={p.author}
							user={user}
							state={"add"}
							addWidget={
								<AddWidget pack={p} setAddPack={setAddPack} />
							}
						/>
					))}

					{packs.length === 0 && (
						<h1>
							Looks like there's nothing matching these criteria
						</h1>
					)}
				</div>
				{packs.length >= 3 && (
					<PageSelector
						totalItems={totalPacks}
						currentPage={
							page != null ? Number.parseInt(page as string) : 0
						}
						params={createBrowseSearchParams(params)}
						itemsPerPage={PACKS_PER_PAGE}
						onChange={onPageChangePressed}
					/>
				)}
			</div>
			<CurrentBundleWidget />
		</div>
	)
}

function CurrentBundleWidget() {
	const [currentBundle, setCurrentBundle] = useCurrentBundle()
	const [foldout, setFoldout] = useState(true)

	function removeFromBundle(pack: PackDependency) {
		const packs = [...(currentBundle?.packs ?? [])]

		const index = packs.findIndex((p) => p.id === pack.id)
		packs.splice(index, 1)

		if (packs.length === 0) return setCurrentBundle(null)

		const bundle = {
			gameVersion: currentBundle?.gameVersion ?? latestMinecraftVersion,
			packs: packs,
		}

		setCurrentBundle(bundle)
	}

	if (currentBundle == null || currentBundle.packs.length === 0) return <></>

	const downloadLink =
		import.meta.env.VITE_API_SERVER +
		`/download?version=${currentBundle.gameVersion}&` +
		currentBundle.packs.map((p) => `pack=${p.id}@${p.version}`).join("&")

	// return <></>
	return (
		<div
			className="container"
			style={{
				position: "fixed",
				right: "0rem",
				bottom: "0rem",
				backgroundColor: "var(--section)",
				border: "0.125rem solid var(--border)",
				borderRadius: "var(--defaultBorderRadius)",
				padding: "1rem",
				paddingRight: "0.5rem",
				gap: "1rem",
				margin: "1rem",
				maxWidth: "100vw",
			}}
		>
			<div
				className="container"
				style={{
					flexDirection: "row",
					gap: "0.5rem",
					width: "100%",
					justifyContent: "space-between",
					paddingRight: "0.5rem",
					paddingBottom: "0.5rem",
					borderBottom: "0.125rem solid var(--border)"
				}}
			>
				<span>
					<span style={{ fontWeight: 600 }}>Current Bundle</span>
					{" for "} {currentBundle.gameVersion}
				</span>
				<button
					className="boldButtonLike container"
					onClick={() => setFoldout(!foldout)}
					style={{ width: "3rem", justifyContent: "center" }}
				>
					<Right
						style={{
							transform: foldout
								? "rotate(90deg)"
								: "rotate(180deg)",
							transition: "transform 0.1s ease-in-out",
						}}
					/>
				</button>
			</div>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr auto auto",
					alignItems: "center",
					maxHeight: foldout ? "22rem" : "0",
					overflowY: "auto",
					width: "100%",
					rowGap: "0.5rem",
					columnGap: "1rem",
					transition: "all 0.2s ease-in-out",
					scrollbarGutter: "stable",
					marginBottom: foldout ? "0rem" : "-1rem",
				}}
			>
				{currentBundle?.packs.map((p) => (
					<>
						<span
							key={p.id + "-name"}
							style={{
								whiteSpace: "nowrap",
								textOverflow: "ellipsis",
								overflow: "hidden",
							}}
						>
							- {p.name}
						</span>
						<span
							key={p.id + "-version"}
							style={{
								maxWidth: "3rem",
								whiteSpace: "nowrap",
								textOverflow: "ellipsis",
								overflow: "hidden",
							}}
						>
							{p.version}
						</span>
						<button
							key={p.id + "-trash"}
							className="exclude buttonLike disturbingButtonLike invalidButtonLike"
							onClick={() => removeFromBundle(p)}
						>
							<Trash />
						</button>
					</>
				))}
			</div>
			<div
				className="container"
				style={{
					flexDirection: "row",
					gap: "0.5rem",
					width: "100%",
					paddingRight: "0.5rem",
					paddingTop: "0.5rem",
					borderTop: "0.125rem solid var(--border)"
				}}
			>
				<IconTextButton
					icon={Download}
					text={
						<span
							style={{
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
								overflow: "hidden",
							}}
						>
							Download
						</span>
					}
					centered
					style={{ width: "100%" }}
					className="accentedButtonLike"
					href={downloadLink}
				/>
				<button
					className="boldButtonLike container"
					onClick={() => {
						navigator.clipboard.writeText(downloadLink)
						alert("Download link copied to clipboard!")
					}}
					style={{ boxSizing: "border-box" }}
				>
					<Copy />
				</button>
			</div>
		</div>
	)
}

function AddModal({
	packId,
	packData,
	currentBundle,
	setCurrentBundle,
	onOpen,
	onClose,
}: {
	packId: string
	packData: PackData
	currentBundle: CurrentBundle | null
	setCurrentBundle: (bundle: CurrentBundle) => void
	onOpen: () => void
	onClose: () => void
}) {
	const [page, setPage] = useState<"gameVersion" | "packVersion">(
		currentBundle?.gameVersion ? "packVersion" : "gameVersion"
	)
	const [gameVersion, setGameVersion] = useState<string>()

	function addToBundle(version: string) {
		const packs = [...(currentBundle?.packs ?? [])]

		packs.push({
			id: packId,
			version: version,
			name: packData.display.name,
		})

		const bundle = {
			gameVersion: currentBundle?.gameVersion ?? gameVersion!,
			packs: packs,
		}

		setCurrentBundle(bundle)
	}

	return (
		<Modal
			trigger={
				<button className="boldButtonLike">
					<Plus />
				</button>
			}
			onOpen={() => {
				setPage(
					currentBundle?.gameVersion ? "packVersion" : "gameVersion"
				)
				onOpen()
			}}
			onClose={onClose}
			content={({ close }) => (
				<>
					{page === "gameVersion" && (
						<GameVersionPage
							packData={packData}
							onSelect={(v) => {
								setGameVersion(v)
								setPage("packVersion")
							}}
							onClose={close}
						/>
					)}
					{page === "packVersion" && (
						<PackVersionPage
							packData={packData}
							gameVersion={
								currentBundle?.gameVersion ?? gameVersion!
							}
							onSelect={(e, version) => {
								addToBundle(version.name)
								close(e)
							}}
							showAllVersions={true}
							onBack={() => setPage("gameVersion")}
							backEnabled={
								currentBundle?.gameVersion === undefined
							}
						/>
					)}
				</>
			)}
		/>
	)
}

function AddWidget({
	pack,
	setAddPack,
}: {
	pack: DataForPackCards
	setAddPack: (b: string | undefined) => void
}) {
	const [currentBundle, setCurrentBundle] = useCurrentBundle()

	function isAdded() {
		return currentBundle?.packs.find((p) => p.id === pack.id) !== undefined
	}

	const [contained, setContained] = useState(isAdded())

	function removeFromBundle() {
		if (!isAdded()) return

		const packs = [...(currentBundle?.packs ?? [])]

		const index = packs.findIndex((p) => p.id === pack.id)
		packs.splice(index, 1)

		const bundle = {
			gameVersion: currentBundle?.gameVersion ?? latestMinecraftVersion,
			packs: packs,
		}

		setCurrentBundle(bundle)
	}

	useEffect(() => {
		setContained(isAdded())
	}, [currentBundle])

	if (
		currentBundle?.gameVersion &&
		!pack.pack.versions.some((v) =>
			v.supports.includes(currentBundle?.gameVersion)
		)
	) return (
		<div className="container" style={{flexDirection: "row", gap: "0.5rem", justifyContent: "start", flexGrow: 1, color: "var(--disturbing)", alignSelf: "end", height: "100%"}}>
			<Warning />
			Incompatible with {currentBundle?.gameVersion}
		</div>
	)


		if (contained)
			return (
				<button
					className={"exclude buttonLike invalidButtonLike"}
					onClick={removeFromBundle}
				>
					<Trash />
				</button>
			)

	return (
		<AddModal
			packId={pack.id}
			packData={pack.pack}
			currentBundle={currentBundle}
			setCurrentBundle={setCurrentBundle}
			onOpen={() => setAddPack(pack.id)}
			onClose={() => setAddPack(undefined)}
		/>
	)
}

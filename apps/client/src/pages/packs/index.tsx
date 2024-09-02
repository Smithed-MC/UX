import { IconInput, ChooseBox, GalleryPackCard } from "components"
import { useEffect, useRef, useState } from "react"
import { SortOptions, fullMinecraftVersions, packCategories } from "data-types"
import { Link, useLoaderData, useNavigate } from "react-router-dom"
import "./index.css"
import {
	useAppDispatch,
	useAppSelector,
	useFirebaseUser,
	useQueryParams,
} from "hooks"
import { Browse as BrowseSvg, Plus } from "components/svg.js"
import { Helmet } from "react-helmet"
import {
	BrowsePageData,
	PACKS_PER_PAGE,
	createBrowseSearchParams,
} from "../../loaders.js"
import PageSelector from "components/PageSelector.js"

export default function PacksBrowser(props: any) {
	const params = useQueryParams()
	const { search, category, sort, version, page } = params

	// console.log(bundles)

	const dispatch = useAppDispatch()

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
			<Helmet>
				<title>Browse Packs</title>
				<meta name="description" content="Search for datapacks" />
			</Helmet>
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
							addWidget={
								<></>
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
		</div>
	)
}

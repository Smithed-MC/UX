import { IconInput } from "components"
import { Globe } from "components/svg"
import { BundleVersion, PackData } from "data-types"
import { useState, useEffect } from "react"
import { Pack } from "./pack"

let pendingTimeout: NodeJS.Timeout | undefined = undefined

export default function SearchPacks({
	selectedVersion,
    cachedPacks
}: {
	selectedVersion: BundleVersion | undefined
	cachedPacks: Record<string, PackData>
}) {
	const [search, setSearch] = useState("")
	const [packs, setPacks] = useState<
		[PackData & { author: string }, { id: string }][]
	>([])
	const [total, setTotal] = useState(0)
	const [page, setPage] = useState(1)

	async function loadPacks() {
		const packsResp = await fetch(
			import.meta.env.VITE_API_SERVER +
				"/packs?" +
				"scope=data.display.name" +
				"&scope=data.display.description" +
				"&scope=data.versions" +
				"&scope=owner.displayName" +
				`&search=${encodeURIComponent(search)}&page=${page}`
		)
		const packs: {
			id: string
			data: PackData
			owner: { displayName: string }
		}[] = await packsResp.json()

		setPacks(
			packs.map((p) => [
				{
					...p.data,
					author: p.owner.displayName,
				},
				{ id: p.id },
			])
		)
		document
			.getElementById("packsContainer")
			?.style.setProperty("opacity", "1")
	}

	async function loadTotalPacks() {
		const countResp = await fetch(
			import.meta.env.VITE_API_SERVER +
				`/packs/count?search=${encodeURIComponent(search)}`
		)
		setTotal(await countResp.json())
	}

	useEffect(() => {
		document
			.getElementById("packsContainer")
			?.style.setProperty("opacity", "0.5")
	}, [search, page])

	useEffect(() => {
		if (pendingTimeout !== undefined) {
			clearTimeout(pendingTimeout)
		}

		pendingTimeout = setTimeout(async () => {
			await Promise.allSettled([loadPacks(), loadTotalPacks()])
		}, 100)
	}, [search])

	useEffect(() => {
		loadPacks()
	}, [page])

	const pages = []
	for (let i = 1; i <= Math.ceil(total / 20); i++) {
		pages.push(
			<button
				className={`browsePageButton ${page === i ? "selected" : ""}`}
				onClick={() => setPage(i)}
			>
				{i}
			</button>
		)
	}

	return (
		<div className="packs">
			<IconInput
				icon={Globe}
				placeholder="Search"
				onChange={(e) => setSearch(e.currentTarget.value)}
				style={{ width: "100%" }}
			/>
			<div
				className="container"
				style={{ flexDirection: "row", gap: "0.25rem" }}
			>
				{pages}
			</div>
			<div
				id="packsContainer"
				className="container"
				style={{ gap: "1rem", transition: "all 0.25s ease-in-out" }}
			>
				{packs.map((p) => (
					<Pack
						key={p[1].id}
						packData={p[0]}
						packRef={
							selectedVersion?.packs.find(
								(cur) => cur.id === p[1].id
							) ?? p[1]
						}
						selectedVersion={selectedVersion}
						cachedPacks={cachedPacks}
					/>
				))}
			</div>
		</div>
	)
}

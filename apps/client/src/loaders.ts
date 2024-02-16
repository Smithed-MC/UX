import { LoaderFunctionArgs, redirect } from "react-router-dom"
import * as querystring from "query-string"
import { getAuth } from "firebase/auth"
import {
	Article,
	PackBundle,
	PackData,
	PackMetaData,
	SortOptions,
	UserData,
} from "data-types"
import Cookie from "cookie"
import User from "./pages/user"

async function getUserData(id: string) {
	const userDataResponse = await fetch(
		import.meta.env.VITE_API_SERVER + `/users/${id}`
	)
	if (!userDataResponse.ok) return undefined
	return await userDataResponse.json()
}

async function getUserPacks(id: string) {
	const userPacksResponse = await fetch(
		import.meta.env.VITE_API_SERVER +
			`/users/${id}/packs?&scope=` +
			BROWSE_SCOPES.join("&scope=")
	)
	const packs: {
		id: string
		data: PackData
		meta: PackMetaData
		owner: UserData
	}[] = userPacksResponse.ok ? await userPacksResponse.json() : []

	return packs
}
async function getBundles(id: string) {
	const userBundlesResponse = await fetch(
		import.meta.env.VITE_API_SERVER + `/users/${id}/bundles`
	)
	const bundleIds: string[] = userBundlesResponse.ok
		? await userBundlesResponse.json()
		: []

	return bundleIds
}

async function getBundleData(id: string): Promise<PackBundle | undefined> {
	const bundleDataResponse = await fetch(
		import.meta.env.VITE_API_SERVER + `/bundles/${id}`
	)
	return bundleDataResponse.ok ? await bundleDataResponse.json() : undefined
}

async function getPackData(
	id: string
): Promise<{ id: string; pack: PackData; meta: PackMetaData }> {
	const packDataResponse = await fetch(
		import.meta.env.VITE_API_SERVER + `/packs/${id}`
	)
	const packMetaResponse = await fetch(
		import.meta.env.VITE_API_SERVER + `/packs/${id}/meta`
	)

	return {
		id: id,
		pack: await packDataResponse.json(),
		meta: await packMetaResponse.json(),
	}
}

async function getDownloads(id: string, packs: { meta: PackMetaData }[]) {
	let total = 0
	let daily = 0

	for (let pack of packs) {
		try {
			total += pack.meta.stats.downloads.total
			daily += pack.meta.stats.downloads.today ?? 0
		} catch {
			console.log(`Pack ${pack}`)
		}
	}
	return [total, daily]
}

export interface UserStats {
	totalDownloads: number
	dailyDownloads: number
	packs: { id: string; data: PackData; meta: PackMetaData; owner: UserData }[]
	bundles: string[]
	id: string
}

export async function loadUserPageData({ params }: any) {
	const id: string = params.owner

	const [user, packs, bundles] = await Promise.all([
		getUserData(id),
		getUserPacks(id),
		getBundles(id),
	])
	// console.log(packIds)

	const [totalDownloads, dailyDownloads] = await getDownloads(id ?? "", packs)

	const userStats: UserStats = {
		packs: packs,
		bundles: bundles,
		id: id ?? "",
		totalDownloads: totalDownloads,
		dailyDownloads: dailyDownloads,
	}

	return { user, userStats }
}

export interface HomePageData {
	trendingPacks: DataForPackCards[]
	newestPacks: DataForPackCards[]
}

async function getTopPacksBySort(sort: SortOptions): Promise<PackApiInfo[]> {
	const resp = await fetch(
		import.meta.env.VITE_API_SERVER +
			`/packs?sort=${sort.toLowerCase()}&limit=10&scope=` +
			BROWSE_SCOPES.join("&scope=")
	)
	return await resp.json()
}

export async function loadHomePageData(): Promise<HomePageData> {
	// console.time('get & filter packs')
	let [newestPacks, trendingPacks] = await Promise.all([
		getTopPacksBySort(SortOptions.Newest),
		getTopPacksBySort(SortOptions.Trending),
	])

	newestPacks = newestPacks
		.filter((np) => !trendingPacks.find((dp) => dp.id === np.id))
		.slice(0, 5)
	trendingPacks = trendingPacks
		.filter((np) => !newestPacks.find((dp) => dp.id === np.id))
		.slice(0, 5)

	// console.timeEnd('get & filter packs')
	// console.time('map packData')
	const returnData = {
		newestPacks: newestPacks.map((p) => ({
			id: p.id,
			displayName: p.displayName,
			pack: p.data,
			meta: p.meta,
			author: p.owner.displayName,
		})),
		trendingPacks: trendingPacks.map((p) => ({
			id: p.id,
			displayName: p.displayName,
			pack: p.data,
			meta: p.meta,
			author: p.owner.displayName,
		})),
	}
	// console.timeEnd('map packData')
	return returnData
}

function setMultiple(
	params: URLSearchParams,
	key: string,
	value: string | (string | null)[]
) {
	if (typeof value === "string") params.append(key, value)
	else value.forEach((v) => params.append(key, v as string))
}

async function getTotalCount(params: URLSearchParams): Promise<number> {
	const response = await fetch(
		import.meta.env.VITE_API_SERVER + "/packs/count?" + params.toString()
	)
	return response.ok ? await response.json() : 0
}

export const PACKS_PER_PAGE = 20

const BROWSE_SCOPES = [
	"data.display.name",
	"data.display.description",
	"data.display.icon",
	"data.versions",
	"data.categories",
	"meta.owner",
	"meta.rawId",
	"meta.stats",
	"owner.displayName",
]

type PackApiInfo = {
	id: string
	displayName: string
	data: PackData
	meta: PackMetaData
	owner: {
		displayName: string
	}
}

async function getPackEntriesForBrowse(
	params: URLSearchParams,
	page: number
): Promise<PackApiInfo[]> {
	params.set("page", page.toString())
	params.set("limit", PACKS_PER_PAGE.toString())
	const response = await fetch(
		import.meta.env.VITE_API_SERVER +
			`/packs?scope=${BROWSE_SCOPES.join("&scope=")}&` +
			params.toString()
	)
	return response.ok ? await response.json() : []
}

export type DataForPackCards = {
	id: string
	pack: PackData
	meta: PackMetaData
	author?: string
}

export interface BrowsePageData {
	count: number
	packs: DataForPackCards[]
}

export function createBrowseSearchParams(parsedParams: any) {
	const { search, category, sort, version } = parsedParams

	const params = new URLSearchParams()

	if (search) params.set("search", search as string)
	if (category) setMultiple(params, "category", category)
	if (sort) params.set("sort", sort as string)
	if (version) setMultiple(params, "version", version)
	return params
}

export async function loadBrowseData({
	request,
}: {
	request: Request
}): Promise<BrowsePageData> {
	const { page: pageParam, ...parsedParams } = querystring.parse(
		request.url.split("?")[1]
	)
	const params = createBrowseSearchParams(parsedParams)

	// console.log(request.headers)

	const count = await getTotalCount(params)

	let page = pageParam ? Number.parseInt(pageParam as string) : 1
	page = Math.max(1, Math.min(page, Math.ceil(count / PACKS_PER_PAGE)))

	const packEntries = await getPackEntriesForBrowse(params, page)
	const packs: DataForPackCards[] = packEntries.map((p) => ({
		id: p.id,
		pack: p.data,
		meta: p.meta,
		author: p.owner.displayName,
	}))

	return { count, packs: packs }
}

export async function loadRootData({ request }: { request: Request }) {
	if (import.meta.env.SSR) {
		const cookie = Cookie.parse(request.headers.get("cookie") ?? "")
		if (!("smithedUser" in cookie)) {
			return { user: undefined }
		}

		const user = JSON.parse(cookie["smithedUser"])

		return { user: user }
	}

	return { user: undefined }
}

export interface ArticleLoaderData {
	article: Article
	publisher?: UserData
}

export async function loadArticleData({
	request,
	params,
}: {
	request: Request
	params: any
}): Promise<ArticleLoaderData | null> {
	const { new: isNew, ...parsedParams } = querystring.parse(
		request.url.split("?")[1]
	)

	if (!isNew && params.article === undefined) {
		return null
	}

	const articleSlug = params.article

	const cookie = Cookie.parse(request.headers.get("cookie") ?? "")
	const user: UserData | null = cookie["smithedUser"]
		? JSON.parse(cookie["smithedUser"])
		: null

	if (isNew && user != null && user?.role === "admin") {
		return {
			article: {
				title: "[None]",
				category: "general",
				content: "",
				banner: "",
				publisher: "",
				datePublished: Date.now(),
				state: "not-created",
			},
			publisher: undefined,
		}
	} else {
		const articleDataResp = await fetch(
			import.meta.env.VITE_API_SERVER + "/articles/" + articleSlug
		)
		if (!articleDataResp.ok) {
			return null
		}

		const articleData: Article = await articleDataResp.json()

		if (articleData.state === "unpublished" && user?.role !== "admin") {
			return null
		}

		const publisherResp = await fetch(
			import.meta.env.VITE_API_SERVER + "/users/" + articleData.publisher
		)

		return {
			article: articleData,
			publisher: publisherResp.ok
				? await publisherResp.json()
				: undefined,
		}
	}
}

import { LoaderFunctionArgs } from "react-router-dom"
import * as querystring from 'query-string'
import { getAuth } from "firebase/auth"
import { PackBundle, PackData, SortOptions } from "data-types"

async function getUserData(id: string) {
    const userDataResponse = await fetch(`https://api.smithed.dev/v2/users/${id}`)
    if (!userDataResponse.ok) return undefined
    return await userDataResponse.json()
}

async function getUserPacks(id: string) {
    const userPacksResponse = await fetch(`https://api.smithed.dev/v2/users/${id}/packs`)
    const packIds: string[] = userPacksResponse.ok ? (await userPacksResponse.json()) : []

    return packIds
}
async function getBundles(id: string) {
    const userBundlesResponse = await fetch(`https://api.smithed.dev/v2/users/${id}/bundles`)
    const bundleIds: string[] = userBundlesResponse.ok ? (await userBundlesResponse.json()) : []

    return bundleIds
}

async function getBundleData(id: string): Promise<PackBundle | undefined> {
    const bundleDataResponse = await fetch(`https://api.smithed.dev/v2/bundles/${id}`)
    return bundleDataResponse.ok ? await bundleDataResponse.json() : undefined
}

async function getPackData(id: string): Promise<{ id: string, pack: PackData }> {
    const packDataResponse = await fetch(`https://api.smithed.dev/v2/packs/${id}`)
    return { id: id, pack: await packDataResponse.json() }
}

async function getDownloads(id: string, packs: string[]) {
    let total = 0;
    let daily = 0;

    const today = new Date().toLocaleDateString(undefined, { timeZone: 'America/New_York' }).replaceAll('/', '-')


    for (let pack of packs) {
        try {
            const packEntry = await (await fetch(`https://api.smithed.dev/v2/packs/${pack}/meta`)).json()
            total += packEntry.stats.downloads.total
            daily += packEntry.stats.downloads.today ?? 0
        } catch {
            console.log(`Pack ${pack}`)
        }

    }
    return [total, daily]
}

export async function loadUserPageData({ params }: any) {
    const id: string = params.owner


    const [user, packIds, bundles] = await Promise.all([getUserData(id), getUserPacks(id), getBundles(id)])
    console.log(packIds)
    const packs = await Promise.all(packIds.map(p => getPackData(p)))

    const [totalDownloads, dailyDownloads] = await getDownloads(id ?? '', packIds)

    const userStats = {
        packs: packs,
        bundles: bundles,
        id: id ?? '',
        totalDownloads: totalDownloads,
        dailyDownloads: dailyDownloads
    }

    return { user, userStats }
}


export interface HomePageData {
    trendingPacks: { id: string, pack: PackData }[],
    downloadedPacks: { id: string, pack: PackData }[],
    newestPacks: { id: string, pack: PackData }[]
}

async function getTopPacksBySort(sort: SortOptions): Promise<{ id: string; displayName: string }[]> {
    const resp = await fetch(`https://api.smithed.dev/v2/packs?sort=${sort.toLowerCase()}`)
    return await resp.json()
}

export async function loadHomePageData(): Promise<HomePageData> {
    let downloadedPackIds = await getTopPacksBySort(SortOptions.Downloads)
    let newestPackIds = await getTopPacksBySort(SortOptions.Newest)
    let trendingPackIds = await getTopPacksBySort(SortOptions.Trending)

    newestPackIds = newestPackIds
        .filter(np =>
            !downloadedPackIds.find(dp => dp.id === np.id) &&
            !trendingPackIds.find(dp => dp.id === np.id))
        .slice(0, 5)
    trendingPackIds = trendingPackIds
        .filter(np =>
            !downloadedPackIds.find(dp => dp.id === np.id) &&
            !newestPackIds.find(dp => dp.id === np.id))
        .slice(0, 5)
    downloadedPackIds = downloadedPackIds.slice(0, 5)

    return {
        newestPacks: await Promise.all(newestPackIds.map(p => getPackData(p.id))),
        downloadedPacks: await Promise.all(downloadedPackIds.map(p => getPackData(p.id))),
        trendingPacks: await Promise.all(trendingPackIds.map(p => getPackData(p.id)))
    }
}

function setMultiple(params: URLSearchParams, key: string, value: string | (string | null)[]) {

    if (typeof value === 'string')
        params.append(key, value)
    else
        value.forEach(v => params.append(key, v as string))
}

async function getTotalCount(params: URLSearchParams): Promise<number> {
    const response = await fetch('https://api.smithed.dev/v2/packs/count?' + params.toString())
    return response.ok ? await response.json() : 0
}

export const PACKS_PER_PAGE = 20

async function getPackEntriesForBrowse(params: URLSearchParams, page: number): Promise<{id: string, displayName: string}[]> {
    params.set('start', (page * PACKS_PER_PAGE).toString())
    params.set('limit', PACKS_PER_PAGE.toString())
    const response = await fetch('https://api.smithed.dev/v2/packs?' + params.toString())
    return response.ok ? await response.json() : []
}

export interface BrowsePageData {
    count: number,
    packs: {id: string, pack: PackData}[]
}

export function createBrowseSearchParams(parsedParams: any) {
    const { search, category, sort, version } = parsedParams

    const params = new URLSearchParams()

    if (search)
        params.set('search', search as string)
    if (category)
        setMultiple(params, 'category', category)
    if (sort)
        params.set('sort', sort as string)
    if (version)
        setMultiple(params, 'version', version)
    return params
} 

export async function loadBrowseData({ request }: { request: Request }) {
    const {page: pageParam, ...parsedParams} = querystring.parse(request.url.split('?')[1])
    const params = createBrowseSearchParams(parsedParams)

    const page = pageParam ? Number.parseInt(pageParam as string) : 0

    const count = await getTotalCount(params)
    const packEntries = await getPackEntriesForBrowse(params, Math.max(0, Math.min(page, Math.ceil(count / PACKS_PER_PAGE) - 1)))

    const packs = await Promise.all(packEntries.map(p => getPackData(p.id)))

    return {count, packs: packs}
} 
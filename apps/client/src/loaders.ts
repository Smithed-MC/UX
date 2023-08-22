import { LoaderFunctionArgs } from "react-router-dom"
import * as querystring from 'query-string'
import { getAuth } from "firebase/auth"
import { PackBundle, PackData, SortOptions } from "data-types"

async function getUserData(id: string) {
    const userDataResponse = await fetch(`https://api.smithed.dev/v2/users/${id}`)
    if (!userDataResponse.ok) return undefined
    return await userDataResponse.json()
}

async function getPacks(id: string) {
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
            // console.log(`Pack ${pack}`)
        }

    }
    return [total, daily]
}

export async function loadUserPageData({ params }: any) {
    const id: string = params.owner


    const [user, packIds, bundles] = await Promise.all([getUserData(id), getPacks(id), getBundles(id)])

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

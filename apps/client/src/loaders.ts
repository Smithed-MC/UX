import { LoaderFunctionArgs } from "react-router-dom"
import * as querystring from 'query-string'
import { getAuth } from "firebase/auth"
import { PackBundle } from "data-types"

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

async function getBundleData(id: string): Promise<PackBundle|undefined> {
    const bundleDataResponse = await fetch(`https://api.smithed.dev/v2/bundles/${id}`)
    return bundleDataResponse.ok ? await bundleDataResponse.json() : undefined
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

export async function loadUserPageData({params}: any) {
    const id: string = params.owner


    const [user, packs, bundles] = await Promise.all([getUserData(id), getPacks(id), getBundles(id)])
    const [totalDownloads, dailyDownloads] = await getDownloads(id ?? '', packs)

    const userStats = {
        packs: packs,
        bundles: bundles,
        id: id ?? '',
        totalDownloads: totalDownloads,
        dailyDownloads: dailyDownloads
    }

    return {user, userStats}
}


export interface BundlePageData {
    bundles: PackBundle[]
}

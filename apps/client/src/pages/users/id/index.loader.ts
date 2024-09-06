
import Cookie from "cookie"
import { UserData, PackData, PackMetaData, PackBundle } from "data-types"
import { sanitize } from "formatters"
import { BROWSE_SCOPES } from "../../../loaders"

async function getUserData(id: string) {
	const userDataResponse = await fetch(
		import.meta.env.VITE_API_SERVER + `/users/${id}`
	)
	if (!userDataResponse.ok) return undefined
	return await userDataResponse.json()
}

async function getPacks(requestingUser: UserData|undefined, id: string) {
	const userPacksResponse = await fetch(
		import.meta.env.VITE_API_SERVER +
			`/users/${id}/packs?&hidden=${requestingUser !== undefined && (requestingUser.uid === id || sanitize(requestingUser.displayName) === sanitize(id))}` +
			`&scope=` + BROWSE_SCOPES.join("&scope=")
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
export default async function loader({ request, params }: any) {
	const id: string = params.owner

	const cookie = Cookie.parse(request.headers.get("cookie") ?? "")
	const userData =
		"smithedUser" in cookie ? JSON.parse(cookie["smithedUser"]) : undefined

	const [user, packs, bundles] = await Promise.all([
		getUserData(id),
		getPacks(userData, id),
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
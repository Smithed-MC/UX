import Cookie from "cookie"
import { UserData, PackData, PackMetaData, PackBundle } from "data-types"
import { sanitize } from "formatters"
import { BROWSE_SCOPES } from "../../../loaders"
import { redirect } from "react-router-dom"

async function getUserData(id: string) {
	const userDataResponse = await fetch(
		import.meta.env.VITE_API_SERVER + `/users/${id}`
	)
	if (!userDataResponse.ok) return undefined
	return await userDataResponse.json()
}

async function getPacks(requestingUser: UserData | undefined, id: string) {
	const userPacksResponse = await fetch(
		import.meta.env.VITE_API_SERVER +
			`/users/${id}/packs?&hidden=${requestingUser !== undefined && (requestingUser.uid === id || sanitize(requestingUser.displayName) === sanitize(id))}` +
			`&scope=` +
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

	const user = await getUserData(id)

	if (user === undefined) {
		return { user: undefined, userStats: undefined }
	}

	const [packs, bundles] = await Promise.all([
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

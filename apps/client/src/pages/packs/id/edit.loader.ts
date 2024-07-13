import {
	BundleUpdater,
	HTTPResponses,
	latestMinecraftVersion,
	PackData,
	PackMetaData,
	UserData,
} from "data-types"
import * as Cookie from "cookie"
import Cookies from "js-cookie"

export interface PackEditLoaderData {
	packData: PackData
	packMetaData: PackMetaData
}
async function getPackData(id: string, token: string) {
	const packResp = await fetch(
		import.meta.env.VITE_API_SERVER + `/packs/${id}?token=${token}`,
		{
			cache: "no-cache",
		}
	)

	if (!packResp.ok) {
		switch (packResp.status) {
			case HTTPResponses.NOT_FOUND:
				throw new Response("Pack was not found", {
					status: HTTPResponses.NOT_FOUND,
				})
			case HTTPResponses.FORBIDDEN:
				throw new Response(
					"You do not own this pack or have access to it",
					{
						status: HTTPResponses.UNAUTHORIZED,
					}
				)
		}
	}

	const packData = await packResp.json() as PackData

	return packData 
}

async function getPackMetaData(id: string, token: string) {
	const packResp = await fetch(
		import.meta.env.VITE_API_SERVER + `/packs/${id}/meta?token=${token}`,
		{
			cache: "no-cache",
		}
	)

	if (!packResp.ok) {
		switch (packResp.status) {
			case HTTPResponses.NOT_FOUND:
				throw new Response("Pack was not found", {
					status: HTTPResponses.NOT_FOUND,
				})
			case HTTPResponses.FORBIDDEN:
				throw new Response(
					"You do not own this pack or have access to it",
					{
						status: HTTPResponses.UNAUTHORIZED,
					}
				)
		}
	}

	const packMetaData = await packResp.json() as PackMetaData

	return packMetaData 
}

export async function loadPackEdit({
	request,
	params,
}: {
	request: Request
	params: any
}): Promise<PackEditLoaderData> {
	const { id: packId } = params

	const cookieString = request.headers.get("cookie") ?? ""
	const cookieData = import.meta.env.SSR ? Cookie.parse(cookieString) : Cookies.get()

	const token = cookieData["smithedToken"]
	const userData = cookieData["smithedUser"] ? JSON.parse(cookieData["smithedUser"]) as UserData : undefined
	
	
	if (token === undefined || userData === undefined) {
		throw new Response("You must be signed in to edit a pack", {
			status: HTTPResponses.UNAUTHORIZED,
		})
	}
	
	if (packId !== "new") {
		try {
			const [packData, packMetaData] = await Promise.all([
				getPackData(packId, token),
				getPackMetaData(packId, token)
			])

			if (!packMetaData.contributors.includes(userData.uid) && userData.role !== "admin")
				throw new Response("You do not have access to edit this pack!", { 
					status: HTTPResponses.FORBIDDEN
				})

			return { packData, packMetaData }
		} catch (e) {
			throw e
		}
	} else {
		return {
			packData: {
				id: "",
				display: {
					name: "New Pack",
					description: "",
					icon: "",
					gallery: [],
					webPage: "",
					hidden: true,
				},
				versions: [
					{
						name: "0.1.0",
						supports: [latestMinecraftVersion],
						downloads: {},
						dependencies: [],
					},
				],
				categories: [],
			},
			packMetaData: {
				owner: userData.uid,
				contributors: [userData.uid],
				rawId: "",
				docId: "",
				stats: {
					added: 0,
					updated: 0,
					downloads: {
						today: 0,
						total: 0
					}
				}
			}
		}
	}
}

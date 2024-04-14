import Cookie from "cookie"
import {
	BundleUpdater,
	HTTPResponses,
	PackBundle_v2,
	PackData,
	PackMetaData,
	latestMinecraftVersion,
} from "data-types"


interface BundleEditLoaderData {
	bundleData: PackBundle_v2
	packData: Record<string, PackData & { author: string }>
}

export async function loadBundleEdit({
	request,
	params,
}: {
	request: Request
	params: any
}): Promise<BundleEditLoaderData> {
	const { id: bundleId } = params

	const cookieString = request.headers.get("cookie") ?? ""
	const cookieData = Cookie.parse(cookieString)

	const token = cookieData["smithedToken"] ?? undefined
	if (token === undefined) {
		throw new Response("You must be signed in to edit a bundle", {
			status: HTTPResponses.UNAUTHORIZED,
		})
	}

	if (bundleId !== "new") {
		const bundleResp = await fetch(
			import.meta.env.VITE_API_SERVER + `/bundles/${bundleId}?token=${token}`,
			{
				cache: 'no-cache'
			}
		)

		if (!bundleResp.ok) {
			switch (bundleResp.status) {
				case HTTPResponses.NOT_FOUND:
					throw new Response("Bundle was not found", {
						status: HTTPResponses.NOT_FOUND,
					})
				case HTTPResponses.FORBIDDEN:
					throw new Response("You do not own this bundle", {
						status: HTTPResponses.UNAUTHORIZED
					})
			}
		}

		const bundleData = BundleUpdater(await bundleResp.json())

		const packData: Record<string, PackData & { author: string }> = {}
		const authors: Record<string, string> = {}
		const packList: string[] = []

		for (const v of bundleData.versions) {
			v.packs.forEach((p) => {
				if (!(p.id in packList)) packList.push(p.id)
			})
		}

		await Promise.allSettled(
			packList.map((id) =>
				(async () => {
					const packResp = await fetch(
						import.meta.env.VITE_API_SERVER + `/packs/${id}`
					)
					const metaDataResp = await fetch(
						import.meta.env.VITE_API_SERVER + `/packs/${id}/meta`
					)

					const metaData: PackMetaData = await metaDataResp.json()

					if (!(metaData.owner in authors)) {
						const authorResp = await fetch(
							import.meta.env.VITE_API_SERVER +
								`/users/${metaData.owner}`
						)

						authors[metaData.owner] = (
							await authorResp.json()
						).displayName
					}

					packData[id] = {
						...(await packResp.json()),
						author: authors[metaData.owner],
					}
				})()
			)
		)

		return { bundleData, packData }
	} else {
		return {
			bundleData: {
				schemaVersion: "v2",
				owner: "",
				display: {
					name: "New Bundle",
					description: "A new bundle",
					icon: "",
				},
				versions: [
					{
						name: "0.0.1",
						packs: [],
						patches: [],
						supports: [latestMinecraftVersion],
					},
				],
				visibility: "private",
				categories: [],
				id: "",
			},
			packData: {},
		}
	}
}

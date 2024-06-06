import { Static, Type } from "@sinclair/typebox"
import { API_APP, TYPESENSE_APP, get, sendError, set } from "../../app.js"
import { getFirestore } from "firebase-admin/firestore"
import { Queryable } from "../../index.js"
import {
	HTTPResponses,
	MinecraftVersion,
	MinecraftVersionSchema,
	PackData,
	PackDataSchema,
	PackMetaData,
	PermissionScope,
	SortOptions,
	SortSchema,
} from "data-types"
import { parseToken, validateToken } from "database"
import { coerce } from "semver"
import { SearchResponseHit } from "typesense/lib/Typesense/Documents.js"
import hash from "hash.js"
import { updateGalleryData } from "./id/index.js"

type ReceivedPackResult = {
	docId: string
	docData: {
		data: PackData
		_indices: string[]
		hidden?: boolean
		[key: string]: any
		owner: string
	}
}

const getSortValue = (sort: SortOptions): string => {
	switch (sort) {
		case SortOptions.Trending:
			return "meta.stats.score:desc"
		case SortOptions.Downloads:
			return "meta.stats.downloads.total:desc"
		case SortOptions.Alphabetically:
			return "data.display.name:asc"
		case SortOptions.Newest:
			return "meta.stats.added:desc"
	}
}

const getPackSchema = Type.Object({
	search: Type.Optional(Type.String()),
	sort: SortSchema,
	limit: Type.Integer({ maximum: 100, minimum: 1, default: 20 }),
	start: Type.Integer({ minimum: 0, default: 0 }),
	page: Type.Integer({ minimum: 1, default: 1 }),
	category: Type.Array(Type.String(), { default: [] }),
	hidden: Type.Optional(Type.Boolean({ default: false })),
	version: Type.Array(MinecraftVersionSchema, { default: [] }),
	scope: Type.Optional(Type.Array(Type.String())),
})

type GetPackQuery = Static<typeof getPackSchema>

/*
 * @route GET /packs
 * Get a list of packs which meet the specified criteria
 *
 * @query search: string
 * A search query against the name or id of the pack
 *
 * @query sort: SortOptions
 * How to sort the requested data
 *
 * @query limit: int = 20
 * How many packs to send. Maximum of 100 per request.
 *
 * @query start: int = 0
 * How far into the queries should be counted
 *
 * @query category: PackCategory[]?
 * Which categories should the pack be a part of
 *
 * @query version: MinecraftVersion[]?
 * Which versions should the pack support
 *
 * @query hidden: boolean = false
 * Should unlisted packs be returned.
 *
 * @query scope: string[]?
 * A list of variable lookups starting with `data.` or `meta.`
 *
 * @return OK: {id: string, displayName: string, data?: any, meta?: any}
 *
 * @example Get a list of packs that are marked as Extensive and their descriptions
 * fetch('https://api.smithed.dev/v2/packs?category=Extensive&scope=data.display.description')
 */
API_APP.route({
	method: "GET",
	url: "/packs",
	schema: {
		querystring: getPackSchema,
	},
	handler: async (request, reply) => {
		const requestIdentifier =
			"GET-PACKS::" + hash.sha1().update(request.url).digest("hex")
		const tryCachedResult = await get(requestIdentifier)

		if (tryCachedResult) {
			return tryCachedResult.item
		}

		const result = await requestPacksFromTypesense(request.query)

		request.log.info("Found " + result.found)
		const packs = result.hits?.map((hit) =>
			reformatDocumentData(hit, request.query.scope ?? [])
		)

		await set(requestIdentifier, packs, 5 * 60 * 1000)
		return packs
	},
})

/*
 * @route GET /packs/count
 * Similar to /packs, this route returns the number of packs which match the criteria
 *
 * @query search: string
 * A search query against the name or id of the pack
 *
 * @query category: PackCategory[]?
 * Which categories should the pack be a part of
 *
 * @query version: MinecraftVersion[]?
 * Which versions should the pack support
 *
 * @query hidden: boolean = false
 * Should unlisted packs be returned.
 *
 * @return OK: number
 *
 * @example Number of packs which contain `the`
 * fetch('https://api.smithed.dev/v2/packs/count?search=the')
 */
API_APP.route({
	method: "GET",
	url: "/packs/count",
	schema: {
		querystring: Type.Omit(getPackSchema, [
			"limit",
			"start",
			"sort",
			"scope",
			"page",
		]),
	},
	handler: async (request, reply) => {
		const requestIdentifier = "GET-PACKS::" + Object.values(request.query)
		const tryCachedResult = await get(requestIdentifier)

		if (tryCachedResult) {
			return tryCachedResult.item
		}
		const totalFound = (
			await requestPacksFromTypesense({
				...request.query,
				limit: 10,
				start: 0,
				sort: SortOptions.Downloads,
				scope: [],
				page: 1,
			})
		).found
		await set(requestIdentifier, totalFound, 5 * 60 * 1000)
		return totalFound
	},
})

/*
 * @route POST /packs
 * Upload a new pack to the plaform
 *
 * @query token: string
 * Either Firebase Id Token or a valid PAT
 *
 * @query id: string
 * The plaintext id for the pack
 *
 * @body data: PackData
 *
 * @return OK: {packId: string}
 * @return CONFLICT: ApiError
 * @return UNAUTHORIZED: ApiError
 * @return FORBIDDEN: ApiError
 *
 * @example Upload a new pack called foobar
 * fetch('https://api.smithed.dev/v2/packs/coc?token=NOT_TODAY_HAHA&id=foobar', {
 *   method:'POST',
 *   body: {data: <Pack Data>},
 *   headers: {'Content-Type': 'application/json'}
 * })
 */
API_APP.route({
	method: "POST",
	url: "/packs",
	schema: {
		querystring: Type.Object({
			token: Type.String(),
			id: Type.String(),
		}),
		body: Type.Object({
			data: PackDataSchema,
		}),
	},
	handler: async (request, reply) => {
		const { token, id } = request.query
		const { data } = request.body

		const tokenData = await validateToken(reply, token, {
			requiredScopes: [PermissionScope.CREATE_PACKS],
		})

		if (tokenData === undefined) return

		const firestore = getFirestore()

		const existingCount = firestore
			.collection("packs")
			.where("id", "==", id)
			.count()

		if ((await existingCount.get()).data().count != 0)
			return sendError(
				reply,
				HTTPResponses.CONFLICT,
				`Pack with ID ${id} already exists in the database`
			)

		for (let v of data.versions) {
			if (coerce(v.name) == null)
				return sendError(
					reply,
					HTTPResponses.BAD_REQUEST,
					`Version ${v} is not valid semver`
				)
		}

		const documentData: Omit<Omit<PackMetaData, "docId">, "rawId"> & {
			data: PackData
			id: string
			state: string
			hidden: boolean
		} = {
			id: id,
			contributors: [tokenData.uid],
			state: "unsubmitted",
			owner: tokenData.uid,
			hidden: false,
			stats: {
				added: Date.now(),
				updated: Date.now(),
				downloads: {
					total: 0,
					today: 0,
				},
			},
			data: data,
		}

		const result = await firestore.collection("packs").add(documentData)

		const successful = await updateGalleryData(data, result.id, reply)
		
		if (!successful) {
			await result.delete()
		} else {
			result.set(data)
		}

		return reply.status(HTTPResponses.CREATED).send({
			packId: result.id,
		})
	},
})

async function requestPacksFromTypesense(query: GetPackQuery) {
	const {
		search,
		sort,
		limit,
		start,
		category,
		hidden: includeHidden,
		version,
		scope,
		page,
	} = query
	const packs = await TYPESENSE_APP.collections("packs")
		.documents()
		.search({
			q: search ?? "",
			query_by: [
				"owner.displayName",
				"data.display.name",
				"data.display.description",
				"readMe",
			],
			filter_by: [
				...(category.length > 0
					? category.map((c) => "data.categories:=`" + c + "`")
					: []),
				...(version.length > 0
					? version.map((c) => "data.versions.supports:=`" + c + "`")
					: []),
				...(!includeHidden
					? ["meta.hidden: false", "data.display.hidden: false"]
					: []),
			].join(" && "),
			include_fields: ["data.display.name", "id", ...(scope ?? [])],
			sort_by: getSortValue(sort),
			limit: limit,
			offset: start,
			page: page,
		})
	return packs
}

function reformatDocumentData(
	result: SearchResponseHit<object>,
	scope: string[]
) {
	const doc = result.document as any

	const displayName = doc.data.display.name

	if (
		!scope.includes("data.display.name") &&
		!scope.includes("data.display") &&
		!scope.includes("data")
	)
		delete doc.data.display.name
	if (Object.keys(doc.data.display).length == 0) delete doc.data.display
	if (Object.keys(doc.data).length == 0) delete doc.data

	return {
		displayName: displayName,
		id: doc.id,
		// highlight: result.highlight,
		...doc,
	}
}

import { Type } from "@sinclair/typebox"
import { API_APP, get, set, TYPESENSE_APP } from "../../app.js"
import hash from "hash.js"

/*
 * @route GET /users
 * Get a list of packs which meet the specified criteria
 *
 * @query search: string
 * A search query against the name or id of the pack
 *
 * @query limit: int = 20
 * How many packs to send. Maximum of 100 per request.
 *
 * @query start: int = 0
 * How far into the queries should be counted
 *
 * @return OK: {id: string, displayName: string}[]
 *
 * @example Get a list of packs that are marked as Extensive and their descriptions
 * fetch('https://api.smithed.dev/v2/users?search=thenuclear')
 */
API_APP.route({
	method: "GET",
	url: "/users",
	schema: {
		querystring: Type.Object({
            search: Type.Optional(Type.String()),
            limit: Type.Number({default: 20}),
            page: Type.Number({default: 1, minimum: 1})
        }),
	},
	handler: async (request, reply) => {
		const requestIdentifier =
			"GET-USERS::" + hash.sha1().update(request.url).digest("hex")
		const tryCachedResult = await get(requestIdentifier)

		if (tryCachedResult) {
			return tryCachedResult.item
		}

		const result = await requestUsersFromTypesense(request.query)

		request.log.info("Found " + result.found)
		const users = result.hits?.map((hit) => hit.document)

		await set(requestIdentifier, users, 5 * 60 * 1000)
		return users
	},
})

async function requestUsersFromTypesense(query: {search?: string, limit: number, page: number}) {
	const {
		search,
		limit,
		page,	
	} = query

	const users = await TYPESENSE_APP.collections("users")
		.documents()
		.search({
			q: search ?? "",
			query_by: [
			    "displayName",
			],
			include_fields: ["displayName", "id"],
			limit: limit,
			page: page,
		})
	return users
}
import { Type } from "@sinclair/typebox"
import { API_APP, sendError } from "../../../app.js"
import { getUserDoc } from "./index.js"
import { HTTPResponses } from "data-types"
import { getFirestore } from "firebase-admin/firestore"

/*
 * @route GET /users/:id/bundles
 * Retrieve a specific users owned and contributed packs
 *
 * @param id
 * The user's UID or plaintext username. Using UID is more performant as it is a direct lookup.
 *
 * @return OK: string[]
 * @return NOT_FOUND: ApiError
 *
 * @example Fetch a user's bundles
 * fetch('https://api.smithed.dev/v2/users/TheNuclearNexus/bundles')
 */
API_APP.route({
	method: "GET",
	url: "/users/:id/bundles",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
	},
	handler: async (request, reply) => {
		const { id } = request.params

		const userDoc = await getUserDoc(id)
		if (userDoc === undefined)
			return sendError(reply, HTTPResponses.NOT_FOUND, "User not found")

		const bundles = getFirestore().collection("bundles")

		const query = await bundles.where("owner", "==", userDoc.id).get()

		return query.docs.map((d) => d.id)
	},
})

import { Type } from "@sinclair/typebox"
import { API_APP, get, sendError, set } from "../../app.js"
import { getFirestore } from "firebase-admin/firestore"
import { sanitize } from "../sanitize.js"
import * as fs from "fs"
import {
	BundleSchema,
	BundleSchema_v1,
	BundleSchema_v2,
	BundleUpdater,
	HTTPResponses,
	PackBundle,
	PermissionScope,
} from "data-types"
import { parseToken, validateToken } from "database"
import { compare, satisfies } from "semver"
import { getUserHash, incrementPacksFromCachedResult } from "../download.js"
import { DownloadRunner } from "downloader"

export async function getBundleDoc(id: string) {
	const firestore = getFirestore()
	const bundles = firestore.collection("bundles")

	API_APP.log.info("Querying for bundle", id)
	const doc = await bundles.doc(id).get()
	if (doc.exists) {
		return doc
	}

	const query = await bundles.where("id", "==", id).limit(1).get()

	if (query.docs.length == 0) return undefined

	return query.docs[0]
}

/*
 * @route GET /bundles/:id
 * Retrieve a bundle's data
 *
 * @param id
 * The bundle's UID, unlike packs and users, bundles do not have a plaintext ID
 *
 * @return OK: PackBundle
 * @return NOT_FOUND: ApiError
 *
 * @example Retrieve a bundle
 * fetch('https://api.smithed.dev/v2/bundles/123456789')
 */
API_APP.route({
	method: "GET",
	url: "/bundles/:id",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
		querystring: Type.Object({
			token: Type.Optional(Type.String()),
		}),
	},
	handler: async (request, reply) => {
		const { id } = request.params
		const { token } = request.query

		const bundleDoc = await getBundleDoc(id)
		if (bundleDoc === undefined)
			return sendError(reply, HTTPResponses.NOT_FOUND, "Bundle not found")

		const data = BundleUpdater({
			uid: bundleDoc.id,
			...bundleDoc.data(),
		} as PackBundle)

		if (data.visibility === "private") {
			if (token === undefined)
				return sendError(
					reply,
					HTTPResponses.UNAUTHORIZED,
					"No token specified"
				)

			const tokenData = await validateToken(reply, token, {
				requiredUid: [data.owner],
				requiredScopes: [PermissionScope.READ_BUNDLES],
			})

			if (tokenData) return data
		}
		return data
	},
})

/*
 * @route GET /bundles/:id/download
 * Download a pack bundle. This route wraps `/download` and returns the same information.
 *
 * @param id
 * The bundle's UID, unlike packs and users, bundles do not have a plaintext ID
 *
 * @query mode: 'datapack' | 'resourcepack' | 'both' = 'both'
 * Which files should be downloaded from the API.
 * @query version: string? = '*'
 * Which version of the bundle to download
 *
 * @return OK: ArrayBuffer
 * @return NOT_FOUND: ApiError
 *
 * @example Download a bundle's resourcepack
 * fetch('https://api.smithed.dev/v2/bundles/123456789/download?mode=resourcepack')
 */
API_APP.route({
	method: "GET",
	url: "/bundles/:id/download",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
		querystring: Type.Object({
			token: Type.Optional(Type.String()),
			mode: Type.Union(
				[
					Type.Literal("datapack"),
					Type.Literal("resourcepack"),
					Type.Literal("both"),
				],
				{ default: "both" }
			),
			version: Type.Optional(Type.String()),
		}),
	},
	handler: async (request, reply) => {
		const { id } = request.params
		const { token, mode, version } = request.query

		const bundleDoc = await getBundleDoc(id)
		if (bundleDoc === undefined)
			return sendError(reply, HTTPResponses.NOT_FOUND, "Bundle not found")

		const bundleData = BundleUpdater(bundleDoc.data() as PackBundle)

		if (bundleData.visibility === "private") {
			if (token === undefined) {
				return sendError(
					reply,
					HTTPResponses.UNAUTHORIZED,
					"No token specified"
				)
			}
			const tokenData = await validateToken(reply, token, {
				requiredUid: [bundleData.owner],
				requiredScopes: [PermissionScope.READ_BUNDLES]
			})
			
			if (tokenData === undefined)
				return
		}
		const latestBundleVersion = bundleData.versions
			.filter((v) =>
				satisfies(v.name, version ?? "*", { includePrerelease: true })
			)
			.sort((a, b) => -compare(a.name, b.name))[0]

		const userHash = getUserHash(request)

		const requestIdentifier =
			"DOWNLOAD::" + id + "," + latestBundleVersion.name + "," + mode
		const tryCachedResult = await get(requestIdentifier)

		if (tryCachedResult) {
			const filePath: string = tryCachedResult.item

			reply
				.header("Access-Control-Expose-Headers", "Content-Disposition")
				.header(
					"Content-Disposition",
					`attachment; filename="${bundleData.display.name}-${mode}.zip"`
				)
				.type("application/octet-stream")

			await incrementPacksFromCachedResult(
				latestBundleVersion.packs,
				latestBundleVersion.supports[0],
				userHash
			)

			// console.log(filePath)

			return fs.createReadStream(filePath)
		}

		const runner = new DownloadRunner(userHash)
		const result = await runner.mergePacksAndPatches(
			latestBundleVersion.packs,
			latestBundleVersion.patches,
			latestBundleVersion.supports[0],
			mode
		)

		if (result) {
			await set(requestIdentifier, result.path, 3600 * 1000)

			request.log.info("sending")

			reply
				.header("Access-Control-Expose-Headers", "Content-Disposition")
				.header(
					"Content-Disposition",
					`attachment; filename="${bundleData.display.name}-${mode}.zip"`
				)
				.type("application/octet-stream")
			return result
		}
		return sendError(
			reply,
			HTTPResponses.SERVER_ERROR,
			"An error occured while downloading"
		)
	},
})

/*
 * @route DELETE /bundles/:id
 * Delete a bundle from the database
 *
 * @param id
 * The bundle's UID, unlike packs and users, bundles do not have a plaintext ID
 *
 * @query token: string
 * Either Firebase Id Token or a valid PAT
 *
 * @return OK: string
 * @return NOT_FOUND: ApiError
 * @return UNAUTHORIZED: ApiError
 * @return FORBIDDEN: ApiError
 *
 * @example Delete a bundle
 * fetch('https://api.smithed.dev/v2/bundles/123456789?token=ILOVESMITHED', {method: 'DELETE'})
 */
API_APP.route({
	method: "DELETE",
	url: "/bundles/:id",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
		querystring: Type.Object({
			token: Type.String(),
		}),
	},
	handler: async (request, reply) => {
		const { id } = request.params
		const { token } = request.query

		const bundleDoc = await getBundleDoc(id)

		if (bundleDoc === undefined)
			return sendError(reply, HTTPResponses.NOT_FOUND, "Bundle not found")

		const bundleData = bundleDoc.data() as PackBundle

		const tokenData = await validateToken(reply, token, {
			requiredUid: [bundleData.owner],
			requiredScopes: [PermissionScope.DELETE_BUNDLES]
		})
		
		if (tokenData === undefined)
			return

		await bundleDoc.ref.delete()
		reply.status(HTTPResponses.OK).send("Bundle deleted successfully")
	},
})

/*
 * @route PUT /bundles/:id
 * Update an existing bundle
 *
 * @param id
 * The bundle's UID, unlike packs and users, bundles do not have a plaintext ID
 *
 * @query token: string
 * Either Firebase Id Token or a valid PAT
 *
 * @body data: PackBundle
 * The data to replace the existing with, omitting the `owner` field.
 *
 * @return OK: string
 * @return NOT_FOUND: ApiError
 * @return UNAUTHORIZED: ApiError
 * @return FORBIDDEN: ApiError
 *
 * @example Update a bundle
 * fetch('https://api.smithed.dev/v2/bundles/123456789', {
 *   method: 'PUT',
 *   body: {
 *      data: <PackBundle>
 *   },
 *   headers: {
 *      "Content-Type": "application/json"
 *   }
 * })
 */
API_APP.route({
	method: "PUT",
	url: "/bundles/:id",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
		querystring: Type.Object({
			token: Type.String(),
		}),
		body: Type.Object({
			data: Type.Union([
				Type.Omit(BundleSchema_v1, ["owner"]),
				Type.Omit(BundleSchema_v2, ["owner"]),
			]),
		}),
	},
	handler: async (request, reply) => {
		const { id } = request.params
		const { token } = request.query
		const data = request.body.data as PackBundle
		const bundleDoc = await getBundleDoc(id)

		if (bundleDoc === undefined)
			return sendError(reply, HTTPResponses.NOT_FOUND, "Bundle not found")
		
		const bundleData = bundleDoc.data() as PackBundle
		
		const tokenData = await validateToken(reply, token, {
			requiredUid: [bundleData.owner],
			requiredScopes: [PermissionScope.WRITE_BUNDLES]
		})

		if (tokenData === undefined)
			return

		if (data.uid) delete data.uid

		await bundleDoc.ref.set(BundleUpdater(data), { merge: true })
		reply.status(HTTPResponses.OK).send("Bundle updated successfully")
	},
})

/*
 * @route POST /bundles
 * Update an existing bundle
 *
 * @query token: string
 * Either Firebase Id Token or a valid PAT
 *
 * @body data: PackBundle
 * The data to replace the existing with, omitting the `owner` field.
 *
 * @return CREATED: string
 * @return UNAUTHORIZED: ApiError
 *
 * @example Upload a new bundle
 * fetch('https://api.smithed.dev/v2/bundles', {
 *   method: 'PUT',
 *   body: {
 *      data: <PackBundle>
 *   },
 *   headers: {
 *      "Content-Type": "application/json"
 *   }
 * })
 */
API_APP.route({
	method: "POST",
	url: "/bundles",
	schema: {
		querystring: Type.Object({
			token: Type.String(),
		}),
		body: Type.Object({
			data: Type.Union([
				Type.Omit(BundleSchema_v1, ["owner"]),
				Type.Omit(BundleSchema_v2, ["owner"]),
			]),
		}),
	},
	handler: async (request, reply) => {
		const { data } = request.body
		const { token } = request.query

		const tokenData = await validateToken(reply, token, {
			requiredScopes: [PermissionScope.CREATE_BUNDLES]
		})

		if (tokenData === undefined)
			return

		const bundleData = BundleUpdater(data as PackBundle)
		bundleData.id ??= tokenData.uid.slice(0, 4) + Date.now()
		bundleData.owner = tokenData.uid

		const existingCount = getFirestore()
			.collection("bundles")
			.where("id", "==", bundleData.id)
			.count()

		if ((await existingCount.get()).data().count != 0)
			return sendError(
				reply,
				HTTPResponses.CONFLICT,
				`Pack with ID ${bundleData.id} already exists in the database`
			)


		const createdDoc = await getFirestore()
			.collection("bundles")
			.add(BundleUpdater(bundleData))
		reply.status(HTTPResponses.CREATED).send({ uid: createdDoc.id })
	},
})

import { Static, Type } from "@sinclair/typebox"
import { API_APP, get, sendError, set } from "../../../app.js"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"
import {
	HTTPResponses,
	PackData,
	PackDataSchema,
	PackGalleryImage,
	PackMetaData,
	PermissionScope,
} from "data-types"
import { getPackDoc, validateToken } from "database"
import { FastifyRequest, FastifyReply, FastifySchema, FastifyTypeProviderDefault, RawServerDefault, RouteGenericInterface } from "fastify"
import { coerce, valid } from "semver"
import hash from "hash.js"
import { request } from "express"


/*
 * @route GET /packs/:id
 * Retrieve a pack's data
 *
 * @param id
 * The pack's UID or plaintext id. Using UID is more performant as it is a direct lookup.
 *
 * @return OK: PackData
 * @return NOT_FOUND: ApiError
 *
 * @example Fetch a packs's data
 * fetch('https://api.smithed.dev/v2/packs/coc')
 */
API_APP.route({
	method: "GET",
	url: "/packs/:id",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
	},
	handler: async (request, reply) => {
		const { id } = request.params

		const requestIdentifier = "GET-PACK::" + id
		const tryCachedResult = await get(requestIdentifier)
		if (
			tryCachedResult &&
			request.headers["cache-control"] !== "max-age=0"
		) {
			request.log.info("served cached /packs/", id)
			return tryCachedResult.item
		}

		const doc = await getPackDoc(id)
		if (doc === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Pack with ID ${id} was not found`
			)

		const data: PackData = await doc.get("data")

		await set(requestIdentifier, data, 60 * 60 * 1000)
		return data
	},
})

const PartialPackDataSchema = Type.Partial(
	Type.Object({
		...PackDataSchema.properties,
		display: Type.Partial(PackDataSchema.properties.display),
	})
)
type PartialPackData = Static<typeof PartialPackDataSchema>

const setPack = async (response: any, reply: any) => {
	const { id: packId } = response.params
	const { token } = response.query

	const { data: packData }: { data: PartialPackData } = response.body

	const doc = await getPackDoc(packId)
	if (doc === undefined)
		return sendError(
			reply,
			HTTPResponses.NOT_FOUND,
			`Pack with ID ${packId} was not found`
		)

	const contributors: string[] = await doc.get("contributors")

	const userId = (
		await validateToken(reply, token, {
			requiredUid: contributors,
			requiredScopes: [PermissionScope.WRITE_PACKS],
		})
	)?.uid

	if (userId === undefined) return

	if (packData.versions)
		for (let v of packData.versions) {
			if (coerce(v.name) == null)
				return sendError(
					reply,
					HTTPResponses.BAD_REQUEST,
					`Version ${v} is not valid semver`
				)
		}

	if (packData.display?.gallery) {
		const existingGallery: PackGalleryImage[] =
			(await doc.get("data.display.gallery")) ?? []

		await updateGalleryData(packData, reply)

		const newGallery = packData.display?.gallery
		const missingImages = existingGallery.filter(
			(existingImg) =>
				newGallery.findIndex((newImg) =>
					typeof existingImg === "object" &&
					typeof newImg === "object"
						? existingImg.uid === newImg.uid
						: existingImg === newImg
				) === -1
		)

		for (const missingImage of missingImages) {
			if (typeof missingImage !== "object") continue

			getStorage()
				.bucket()
				.file(`gallery_images/${missingImage.uid}`)
				.delete()
		}
	}

	if (
		packData.versions &&
		packData.versions.length > (await doc.get("data.versions")).length
	) {
		await doc.ref.set(
			{
				stats: {
					updated: Date.now(),
				},
			},
			{ merge: true }
		)
	}

	const requestIdentifier = "GET-PACK::" + packId
	await set(requestIdentifier, undefined, 1)

	await doc.ref.set({ data: packData }, { merge: true })
	return reply.status(HTTPResponses.OK).send("Updated data")
}

/*
 * @route PATCH/PUT /packs/:id
 * Update a pack's data
 
owner*
 * @param id
 * The pack's UID or plaintext id. Using UID is more performant as it is a direct lookup.
 *
 * @query token: string
 * Either Firebase Id Token or a valid PAT
 *
 * @body data: PackData
 *
 * @return OK: string
 * @return NOT_FOUND: ApiError
 * @return UNAUTHORIZED: ApiError
 * @return FORBIDDEN: ApiError
 *
 * @example Set a packs's data
 * fetch('https://api.smithed.dev/v2/packs/coc?token=NOT_TODAY_HAHA', {
 *   method:'PATCH',
 *   body: {data: <Pack Data>},
 *   headers: {'Content-Type': 'application/json'}
 * })
 */
API_APP.route({
	method: "PATCH",
	url: "/packs/:id",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
		querystring: Type.Object({
			token: Type.String(),
		}),
		body: Type.Object(
			{
				data: Type.Partial(
					Type.Object({
						...PackDataSchema.properties,
						display: Type.Partial(
							PackDataSchema.properties.display
						),
					})
				),
			},
			{}
		),
	},
	handler: setPack,
})
/*
 * Same as the above.
 */
API_APP.route({
	method: "PUT",
	url: "/packs/:id",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
		querystring: Type.Object({
			token: Type.String(),
		}),
		body: Type.Object(
			{
				data: PackDataSchema,
			},
			{}
		),
	},
	handler: setPack,
})

/*
 * @route DELETE /packs/:id
 * Delete a specific pac
ownerk
 *
 * @param id
 * The pack's UID or plaintext id. Using UID is more performant as it is a direct lookup.
 *
 * @query token: string
 * Either Firebase Id Token or a valid PAT
 *
 * @return OK: string
 * @return NOT_FOUND: ApiError
 * @return UNAUTHORIZED: ApiError
 * @return FORBIDDEN: ApiError
 *
 * @example Set a packs's data
 * fetch('https://api.smithed.dev/v2/packs/coc?token=NOT_TODAY_HAHA', {
 *   method:'DELETE'
 * })
 */
API_APP.route({
	method: "DELETE",
	url: "/packs/:id",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
		querystring: Type.Object({
			token: Type.String(),
		}),
	},
	handler: async (response, reply) => {
		const { id: packId } = response.params
		const { token } = response.query

		const doc = await getPackDoc(packId)
		if (doc === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Pack with ID ${packId} was not found`
			)

		const owner: string = doc.get("owner")
		console.log(owner)

		const tokenData = await validateToken(reply, token, {
			requiredUid: [owner],
			requiredScopes: [PermissionScope.DELETE_PACKS],
		})

		if (tokenData === undefined) return

		await doc.ref.delete()
		return reply.status(HTTPResponses.OK).send("Deleted data")
	},
})

/*
 * @route GET /packs/:id/contributors
 * Get a list of contributors to a pack
 *
 * @param id
 * The pack's UID or plaintext id. Using UID is more performant as it is a direct lookup.
 *
 * @return OK: string
 * @return NOT_FOUND: ApiError
 *
 * @example Set a packs's data
 * fetch('https://api.smithed.dev/v2/packs/coc/contributors')
 */
API_APP.route({
	method: "GET",
	url: "/packs/:id/contributors",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
	},
	handler: async (response, reply) => {
		const { id: packId } = response.params

		const doc = await getPackDoc(packId)
		if (doc === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Pack with ID ${packId} was not found`
			)

		const existingContributors: string[] = await doc.get("contributors")

		return reply.status(HTTPResponses.OK).send(existingContributors)
	},
})

/*
 * @route POST /packs/:id/contributors
 * Add a list of contributors to a pack
 *
 * @param id
 * The pack's UID or plaintext id. Using UID is more performant as it is a direct lookup.
 *
 * @query token: string
 * Either Firebase Id Token or a valid PAT
 * @query contributors: string[]
 *
 * @return OK: string
 * @return NOT_FOUND: ApiError
 * @return UNAUTHORIZED: ApiError
 * @return FORBIDDEN: ApiError
 *
 * @example Set a packs's data
 * fetch('https://api.smithed.dev/v2/packs/coc/contributors?token=NOT_TODAY_HAHA&contributors=CreeperMagnet_', {
 *   method:'POST'
 * })
 */
API_APP.route({
	method: "POST",
	url: "/packs/:id/contributors",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
		querystring: Type.Object({
			token: Type.String(),
			contributors: Type.Array(Type.String()),
		}),
	},
	handler: async (response, reply) => {
		const { id: packId } = response.params
		const { token, contributors } = response.query

		const doc = await getPackDoc(packId)
		if (doc === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Pack with ID ${packId} was not found`
			)
		const owner: string = await doc.get("owner")

		const tokenData = await validateToken(reply, token, {
			requiredUid: [owner],
			requiredScopes: [PermissionScope.WRITE_PACKS],
		})

		owner
		if (tokenData === undefined) return

		const existingContributors: string[] = await doc.get("contributors")

		for (let c of contributors)
			if (!existingContributors.includes(c)) existingContributors.push(c)

		await doc.ref.set(
			{ contributors: existingContributors },
			{ merge: true }
		)
		return reply.status(HTTPResponses.OK).send("Added contributors")
	},
})

/*
 * @route DELETE /packs/:id/contributors
 * Remove a list of contributors from a pack
 *
 * @param id
 * The pack's UID or plaintext id. Using UID is more performant as it is a direct lookup.
 *
 * @query token: string
 * Either Firebase Id Token or a valid PAT
 * @query contributors: string[]
 *
 * @return OK: string
 * @return NOT_FOUND: ApiError
 * @return UNAUTHORIZED: ApiError
 * @return FORBIDDEN: ApiError
 *
 * @example Set a packs's data
 * fetch('https://api.smithed.dev/v2/packs/coc/contributors?token=NOT_TODAY_HAHA&contributors=CreeperMagnet_', {
 *   method:'DELETE'
 * })
 */
API_APP.route({
	method: "DELETE",
	url: "/packs/:id/contributors",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
		querystring: Type.Object({
			token: Type.String(),
			contributors: Type.Array(Type.String()),
		}),
	},
	handler: async (response, reply) => {
		const { id: packId } = response.params
		const { token, contributors } = response.query

		const doc = await getPackDoc(packId)
		if (doc === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Pack with ID ${packId} was not found`
			)
		const owner: string = await doc.get("owner")

		const tokenData = await validateToken(reply, token, {
			requiredUid: [owner],
			requiredScopes: [PermissionScope.WRITE_PACKS],
		})

		if (tokenData === undefined) return

		const existingContributors: string[] = await doc.get("contributors")

		await doc.ref.set(
			{
				contributors: existingContributors.filter(
					(v) => v === owner || !contributors.includes(v)
				),
			},
			{ merge: true }
		)
		return reply.status(HTTPResponses.OK).send("Deleted contributors")
	},
})

/*
 * @route GET /packs/:id/meta
 * Retrieve a pack's metadata
 *
 * @param id
 * The pack's UID or plaintext id. Using UID is more performant as it is a direct lookup.
 *
 * @return OK: PackMetaData
 * @return NOT_FOUND: ApiError
 *
 * @example Set a packs's data
 * fetch('https://api.smithed.dev/v2/packs/coc/meta')
 */
API_APP.route({
	method: "GET",
	url: "/packs/:id/meta",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
	},
	handler: async (request, reply) => {
		const { id } = request.params

		const requestIdentifier = "GET-PACK-META::" + id
		const tryCachedResult = await get(requestIdentifier)
		if (
			tryCachedResult &&
			request.headers["cache-control"] !== "max-age=0"
		) {
			request.log.info("served cached /packs/", id, "/meta")
			return tryCachedResult.item
		}

		const doc = await getPackDoc(id)
		if (doc === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Pack with ID ${id} was not found`
			)

		const data: PackMetaData = {
			docId: doc.id,
			rawId: await doc.get("id"),
			stats: await doc.get("stats"),
			owner: await doc.get("owner"),
			contributors: await doc.get("contributors"),
		}

		await set(requestIdentifier, data, 60 * 60 * 1000)
		return data
	},
})

API_APP.route({
	method: "GET",
	url: "/packs/:id/gallery/:index",
	schema: {
		params: Type.Object({
			id: Type.String(),
			index: Type.Number(),
		}),
	},
	handler: async (request, reply) => {
		const { id, index } = request.params

		const requestIdentifier = "GET-PACK-GALLERY-" + id + "::" + index
		const tryCachedResult = await get(requestIdentifier)
		if (
			tryCachedResult &&
			request.headers["cache-control"] !== "max-age=0"
		) {
			request.log.info("served cached /packs/", id, "/gallery/", index)
			reply.header("Content-Type", "image/png")
			return Buffer.from(tryCachedResult.item, "base64")
		}

		console.time("Find pack doc")
		const doc = await getPackDoc(id)
		if (doc === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Pack with ID ${id} was not found`
			)
		console.timeEnd("Find pack doc")
		const gallery = await doc.get("data.display.gallery")

		if (!gallery)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Not gallery for pack ${id}`
			)
		if (index >= gallery.length)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Index ${index} not in bounds for length ${gallery.length}`
			)

		const img: PackGalleryImage = gallery[index]

		reply.header("Content-Type", "image/png")

		let content: Buffer

		console.time("Get image")
		if (typeof img === "object") {
			const buffer = (
				await getStorage()
					.bucket()
					.file(`gallery_images/${img.uid}`)
					.download()
			)[0]

			content = Buffer.from(
				buffer.toString("utf8").split(",")[1],
				"base64"
			)
		} else {
			content = Buffer.from(img.split(",")[1], "base64")
		}
		console.timeEnd("Get image")

		await set(requestIdentifier, content.toString("base64"), 5 * 60 * 1000)
		return content
	},
})

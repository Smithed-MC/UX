import { Static, Type } from "@sinclair/typebox"
import {
	API_APP,
	get,
	getCachedPackDoc,
	invalidate,
	sendError,
	set,
} from "../../../app.js"
import { getStorage } from "firebase-admin/storage"
import {
	HTTPResponses,
	PackData,
	PackDataSchema,
	Image,
	PackMetaData,
	PermissionScope,
} from "data-types"
import { FastifyReply } from "fastify"
import { getPackDoc, validateToken } from "database"
import { coerce } from "semver"
import hash from "hash.js"
import sharp from "sharp"

export async function replyWithImage(
	requestIdentifier: string,
	bucketLocation: string,
	filePrefix: string,
	img: Image,
	reply: FastifyReply
) {
	reply.header("Content-Type", "image/png")
	let content: Buffer
	if (typeof img === "object") {
		switch (img.type) {
			case "bucket": {
				const buffer = (
					await getStorage()
						.bucket()
						.file(`${bucketLocation}/${img.uid}`)
						.download()
				)[0]

				content = Buffer.from(
					buffer.toString("utf8").split(",")[1],
					"base64"
				)
				break
			}
			case "file": {
				return reply.redirect(
					HTTPResponses.FOUND,
					`https://firebasestorage.googleapis.com/v0/b/mc-smithed.appspot.com/o/${bucketLocation}%2F${filePrefix}-${img.uid}.webp?alt=media`
				)
			}
		}
	} else {
		content = Buffer.from(img.split(",")[1], "base64")
	}

	await set(requestIdentifier, content.toString("base64"), 5 * 60 * 1000)
	return reply.send(content)
}

export function deleteImage(
	img: Image,
	bucketLocation: string,
	filePrefix: string
) {
	if (typeof img === "string") return

	if (img.type === "file") {
		getStorage()
			.bucket()
			.file(`${bucketLocation}/${filePrefix}-${img.uid}.webp`)
			.delete()
	} else {
		getStorage().bucket().file(`${bucketLocation}/${img.uid}`).delete()
	}
}

export async function uploadImage(
	img: Image,
	bucketLocation: string,
	filePrefix: string,
	reply?: FastifyReply,
	imageName?: string
): Promise<Image | null> {
	const bucket = getStorage().bucket()
	if (typeof img === "string") {
		if (!img.startsWith("http")) {
			const image = await getWebp(img)

			if (image.byteLength > 1324 * 1024) {
				if (reply)
					sendError(
						reply,
						HTTPResponses.BAD_REQUEST,
						`${imageName ?? "image"} exceeds 1MB`
					)

				return null
			}

			let uid = hash.sha1().update(image).digest("hex")
			bucket
				.file(`${bucketLocation}/${filePrefix}-${uid}.webp`)
				.save(image)

			console.log("uploading new image")

			return {
				type: "file",
				uid: uid,
			}
		}
	} else if (img.content) {
		const image = await getWebp(img.content)

		const uid = hash.sha1().update(image).digest("hex")

		if (img.uid !== uid) {
			deleteImage(img, "gallery_images", filePrefix)

			bucket
				.file(`${bucketLocation}/${filePrefix}-${uid}.webp`)
				.save(image)

			img.uid = uid
		}

		delete img.content
	}

	return img
}

export async function updateGalleryData(
	packData: any,
	packId: string,
	reply: FastifyReply | undefined
): Promise<boolean> {
	if (packData.display.gallery === undefined) return true
	for (let i = 0; i < packData.display.gallery.length; i++) {
		const g = packData.display.gallery[i]
		const result = await uploadImage(
			g,
			"gallery_images",
			packId,
			reply,
			"Gallery Image " + i
		)

		if (result == null) return false

		packData.display.gallery[i] = result
	}
	return true
}

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
		const shouldUseCache = request.headers["cache-control"] !== "max-age=0"

		const requestIdentifier = "GET-PACK::" + id
		const tryCachedResult = await get(requestIdentifier)
		if (tryCachedResult && shouldUseCache) {
			request.log.info("served cached /packs/", id)
			return tryCachedResult.item
		}


		let data: PackData | undefined = undefined

		if (shouldUseCache) {
			const doc = await getCachedPackDoc(id)
			if (doc)
				data = doc.data.data
		} else {
			const doc = await getPackDoc(id)
			
			if (doc)
				data = await doc.get("data")
		}

		if (data === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Pack with ID ${id} was not found`
			)

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

async function getWebp(content: string): Promise<Buffer> {
	const urlParts = content.split(",")

	const buffer = Buffer.from(urlParts.at(-1)!, "base64")

	const webpBuffer = await sharp(buffer, {
		animated: urlParts[0].includes("image/gif"),
	})
		.webp()
		.toBuffer()

	return webpBuffer
}

const setPack = async (request: any, reply: any) => {
	const { id: packId } = request.params
	const { token } = request.query

	const { data: packData }: { data: PartialPackData } = request.body

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

	const bucket = getStorage().bucket()

	if (packData.display?.gallery) {
		const existingGallery: Image[] =
			(await doc.get("data.display.gallery")) ?? []

		await updateGalleryData(packData, doc.id, reply)

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

			if (missingImage.type === "bucket")
				bucket
					.file(`gallery_images/${missingImage.uid}`)
					.delete()
					.catch((r) => {})
			else if (missingImage.type === "file")
				bucket
					.file(`gallery_images/${doc.id}-${missingImage.uid}.webp`)
					.delete()
					.catch((r) => {})
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

	invalidateCachedData(packData.id, doc.id)

	request.log.info(packData)
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
		const shouldUseCache = request.headers["cache-control"] !== "max-age=0"

		const requestIdentifier = "GET-PACK-META::" + id
		const tryCachedResult = await get(requestIdentifier)
		if (tryCachedResult && shouldUseCache) {
			request.log.info("served cached /packs/", id, "/meta")
			return tryCachedResult.item
		}

		let data: PackMetaData | undefined = undefined

		const setData = (id: string, data: any) => ({
			docId: id,
			rawId: data.id,
			stats: data.stats,
			owner: data.owner,
			contributors: data.contributors,
		})

		if (shouldUseCache) {
			const doc = await getCachedPackDoc(id)
			console.log(doc)
			if (doc) data = setData(doc.id, doc.data)
		} else {
			const doc = await getPackDoc(id)
			if (doc) data = setData(doc.id, doc.data()!)
		}

		if (data === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Pack with ID ${id} was not found`
			)

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
		const shouldUseCache = request.headers["cache-control"] !== "max-age=0"

		const requestIdentifier = "GET-PACK-GALLERY-" + id + "::" + index
		const tryCachedResult = await get(requestIdentifier)
		if (tryCachedResult && shouldUseCache) {
			request.log.info("served cached /packs/", id, "/gallery/", index)
			reply.header("Content-Type", "image/png")
			return Buffer.from(tryCachedResult.item, "base64")
		}

		// console.time("Find pack doc")
		let gallery: Image[]|undefined = undefined;
		let doc;

		if (shouldUseCache) {
			doc = await getCachedPackDoc(id)
			
			if (doc)
				gallery = doc.data.data.display.gallery
		} else {
			doc = await getPackDoc(id)
			
			if (doc)
				gallery = await doc.get("data.display.gallery")
		}

		if (doc === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Pack with ID ${id} was not found`
			)
		// console.timeEnd("Find pack doc")

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

		const img: Image = gallery[index]

		return await replyWithImage(
			requestIdentifier,
			"gallery_images",
			doc.id,
			img,
			reply
		)
	},
})

export function invalidateCachedData(id: string | undefined, docId: string) {
	if (id !== undefined) invalidate("**" + id + "**")
	invalidate("**" + docId + "**")
}

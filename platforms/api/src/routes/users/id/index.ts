import { Static, Type } from "@sinclair/typebox"
import { API_APP, get, sendError, set } from "../../../app.js"
import { getFirestore } from "firebase-admin/firestore"
import { sanitize } from "../../sanitize.js"
import { HTTPResponses, PermissionScope, UserData, UserDataSchema, Image } from "data-types"
import { validateToken } from "database"
import { getAuth } from "firebase-admin/auth"

import { useId } from "react"
import fetch from "node-fetch"
import { deleteImage, replyWithImage, uploadImage } from "../../packs/id/index.js"

export async function getUserDoc(id: string) {
	const firestore = getFirestore()
	const packs = firestore.collection("users")

	const doc = await packs.doc(id).get()
	if (doc.exists) {
		return doc
	}
	const query = await packs
		.where("cleanName", "==", sanitize(id))
		.limit(1)
		.get()

	if (query.docs.length == 0) return undefined

	return query.docs[0]
}

/*
 * @route GET /users/:id
 * Retrieve a specific users information
 *
 * @param id
 * The user's UID or plaintext username. Using UID is more performant as it is a direct lookup.
 *
 * @return OK: {uid: string, cleanName: string, displayName: string, role: string}
 * @return NOT_FOUND: ApiError
 *
 * @example Fetch a user's data
 * fetch('https://api.smithed.dev/v2/users/TheNuclearNexus')
 */
API_APP.route({
	method: "GET",
	url: "/users/:id",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
	},
	handler: async (request, reply) => {
		const { id } = request.params

		const requestIdentifier = "GET-USER::" + id
		const tryCachedResult = await get(requestIdentifier)
		if (
			tryCachedResult &&
			request.headers["cache-control"] !== "max-age=0"
		) {
			request.log.info("served cached /users/", id)
			return tryCachedResult.item
		}

		request.log.info("Querying Firebase for User w/ ID " + id)
		const userDoc = await getUserDoc(id)

		if (userDoc === undefined)
			return sendError(reply, HTTPResponses.NOT_FOUND, "User not found")

		const data = {
			uid: userDoc.id,
			creationTime: new Date(
				(await getAuth().getUser(userDoc.id)).metadata.creationTime ?? 0
			).getTime(),
			...userDoc.data(),
		}
		await set(requestIdentifier, data, 60 * 60 * 1000)
		return data
	},
})

/*
 * @route GET /users/:id/pfp
 * Retrieve a specific user's pfp
 *
 * @param id
 * The user's UID or plain text username. Using UID is more performant as it is a direct lookup.
 *
 * @return OK: ArrayBuffer
 * @return NOT_FOUND: ApiError
 *
 * @example Fetch a user's pfp
 * fetch('https://api.smithed.dev/v2/users/TheNuclearNexus/pfp')
 */
API_APP.route({
	method: "GET",
	url: "/users/:id/pfp",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
	},
	handler: async (request, reply) => {
		const { id } = request.params

		const requestIdentifier = "GET-USER-PFP::" + id
		const tryCachedResult = await get(requestIdentifier)

		if (
			tryCachedResult &&
			request.headers["cache-control"] !== "max-age=0"
		) {
			reply.header("Content-Type", "image/png")
			request.log.info("served cached /users/", id)
			return Buffer.from(tryCachedResult.item, "base64")
		}

		request.log.info("Querying Firebase for User w/ ID " + id)
		const userDoc = await getUserDoc(id)

		if (userDoc === undefined)
			return sendError(reply, HTTPResponses.NOT_FOUND, "User not found")

		const pfp = (userDoc.data() as UserData).pfp

		if (!pfp)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				"User doesn't have a pfp set"
			)
		
		return await replyWithImage(requestIdentifier, "user_pfps", userDoc.id, pfp, reply)
	},
})

/*
 * @route GET /users/:id/banner
 * Retrieve a specific user's banner
 *
 * @param id
 * The user's UID or plain text username. Using UID is more performant as it is a direct lookup.
 *
 * @return OK: ArrayBuffer
 * @return NOT_FOUND: ApiError
 *
 * @example Fetch a user's banner
 * fetch('https://api.smithed.dev/v2/users/TheNuclearNexus/banner')
 */
API_APP.route({
	method: "GET",
	url: "/users/:id/banner",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
	},
	handler: async (request, reply) => {
		const { id } = request.params

		const requestIdentifier = "GET-USER-BANNER::" + id
		const tryCachedResult = await get(requestIdentifier)

		if (
			tryCachedResult &&
			request.headers["cache-control"] !== "max-age=0"
		) {
			reply.header("Content-Type", "image/png")
			request.log.info("served cached /users/", id)
			return Buffer.from(tryCachedResult.item, "base64")
		}

		request.log.info("Querying Firebase for User w/ ID " + id)
		const userDoc = await getUserDoc(id)

		if (userDoc === undefined)
			return sendError(reply, HTTPResponses.NOT_FOUND, "User not found")

		const banner = (userDoc.data() as UserData).banner

		if (!banner)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				"User doesn't have a banner set"
			)
		
		return await replyWithImage(requestIdentifier, "user_banners", userDoc.id, banner, reply)
	},
})
const PartialUserSchema = Type.Partial(UserDataSchema)
type PartialUserData = Static<typeof PartialUserSchema>

async function setUserData(request: any, reply: any) {
	const { id: userId } = request.params
	const { token } = request.query
	const { data: rawUserData } = request.body

	const userData = rawUserData as PartialUserData

	const tokenData = await validateToken(reply, token, {
		requiredUid: [userId],
		requiredScopes: [PermissionScope.WRITE_USER]
	})

	if (tokenData === undefined)
		return

	request.log.info("Querying Firebase for User w/ ID " + userId)
	const doc = await getUserDoc(userId)
	if (doc === undefined)
		return sendError(
			reply,
			HTTPResponses.NOT_FOUND,
			`User with ID ${userId} was not found`
		)

	const requestIdentifier = "GET-USER::" + userId
	await set(requestIdentifier, undefined, 1)

	if (userData.displayName) {
		userData.cleanName = sanitize(userData.displayName)
	}

	if (userData.pfp) {
		const result = await uploadImage(userData.pfp, "user_pfps", doc.id, reply, "PFP")

		if (result == null)
			return

		userData.pfp = result

		const oldPfp: Image = await doc.get("pfp")

		if (result != oldPfp && oldPfp) {
			deleteImage(oldPfp, "user_pfps", doc.id)
		} 
	}

	if (userData.banner) {
		const result = await uploadImage(userData.banner, "user_banners", doc.id, reply, "Banner")
		if (result == null)
			return

		userData.banner = result

		const oldBanner: Image = await doc.get("banner")

		if (result != oldBanner && oldBanner) {
			deleteImage(oldBanner, "user_banners", doc.id)
		}
	}

	let newData: any = {}
	for (const k of Object.keys(userData))
		if (k !== "role") newData[k] = (userData as any)[k]

	await doc.ref.set(newData, { merge: true })
	return reply.status(HTTPResponses.OK).send("Updated data")
}

/*
 * @route PATCH/PUT /users/:id
 * Set a specific users information
 *
 * @param id
 * The pack's UID or plaintext id. Using UID is more performant as it is a direct lookup.
 *
 * @query token: string
 * Either Firebase Id Token or a valid PAT
 *
 * @body data: Omit<UserData, ['cleanName', 'creationTime', 'uid]>
 *
 * @return OK: string
 * @return NOT_FOUND: ApiError
 * @return UNAUTHORIZED: ApiError
 * @return FORBIDDEN: ApiError
 *
 * @example Set a user's data
 * fetch('https://api.smithed.dev/v2/users/TheNuclearNexus?token=NOT_TODAY_HAHA', {
 *   method:'PATCH',
 *   body: {data: <User Data>},
 *   headers: {'Content-Type': 'application/json'}
 * })
 *
 */
API_APP.route({
	method: "PUT",
	url: "/users/:id",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
		querystring: Type.Object({
			token: Type.String(),
		}),
		body: Type.Object({
			data: Type.Omit(UserDataSchema, [
				"creationTime",
				"cleanName",
				"uid",
			]),
		}),
	},
	handler: setUserData,
})
/*
 * Same as the above.
 */
API_APP.route({
	method: "PATCH",
	url: "/users/:id",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
		querystring: Type.Object({
			token: Type.String(),
		}),
		body: Type.Object({
			data: Type.Partial(
				Type.Omit(UserDataSchema, ["creationTime", "cleanName", "uid"])
			),
		}),
	},
	handler: setUserData,
})

/*
 * Not documented since is mainly just for interal use
 */
API_APP.route({
	method: "GET",
	url: "/users/:id/setup",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
		querystring: Type.Object({
			token: Type.String(),
			displayName: Type.String(),
		}),
	},
	handler: async (request, reply) => {
		const { id } = request.params
		const { token, displayName } = request.query

		request.log.info("Querying Firebase for User w/ ID " + id)
		const userDoc = await getUserDoc(id)

		const tokenData = await validateToken(reply, token, {
			requiredUid: [id],
			requiredScopes: [PermissionScope.WRITE_USER]
		})

		if (tokenData === undefined)
			return

		if (userDoc !== undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				"User has been setup previously"
			)

		else if ((await getUserDoc(displayName)) !== undefined)
			return sendError(
				reply,
				HTTPResponses.CONFLICT,
				"User with that display name exists!"
			)

		await getFirestore()
			.collection("users")
			.doc(tokenData.uid)
			.set({
				displayName: displayName,
				cleanName: sanitize(displayName),
				role: "member",
			})
		return reply
			.status(HTTPResponses.CREATED)
			.send("User account was successfully setup")
	},
})

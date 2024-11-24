import { Type } from "@sinclair/typebox"
import { API_APP, sendError } from "../app.js"
import {
	HTTPResponses,
	PAToken,
	PermissionScope,
	PermissionScopeSchema,
} from "data-types"
import { getAuth } from "firebase-admin/auth"
import * as jose from "jose"
import { getFirestore } from "firebase-admin/firestore"
import { randomUUID } from "crypto"

const charToMultiplier: Record<string, number> = {
	s: 1,
	m: 60,
	h: 60 * 60,
	d: 60 * 60 * 24,
	y: 60 * 60 * 24 * 365,
}

function expiresToSeconds(expires: string): number {
	for (const suffix in charToMultiplier) {
		const match = expires.match(new RegExp(`([0-9]+)${suffix}`))

		if (match) {
			return Number.parseInt(match[1]) * charToMultiplier[suffix]
		}
	}
	return charToMultiplier["h"]
}

async function signJWT(
	tokenEntry: PAToken,
	tokenDocId: string,
	expires: string
) {
	const serviceAccount = API_APP["serviceAccount"]
	const privateKey = API_APP["privateKey"]

	const jwt = await new jose.SignJWT({})
		.setProtectedHeader({
			alg: "RS256",
			tokenUid: tokenEntry.tokenUid,
			docId: tokenDocId,
		})
		.setIssuer(serviceAccount.client_email)
		.setSubject(serviceAccount.client_email)
		.setAudience(
			"https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit"
		)
		.setExpirationTime(expires !== undefined ? (expires as string) : "1h")
		.setIssuedAt(Math.round(Date.now() / 1000))
		.sign(privateKey)

	return "smithed-" + jwt
}

/*
 * @route POST /tokens
 * This route allows the creation of a PAT
 *
 * @query token: string
 * Specifically a Firebase ID Token, not another PAT
 *
 * @query expires: string
 * How long should the token be valid for, in the form `<num><h|>
 *
 * @query name: string?
 * Name of token shown in the UI
 *
 * @query scopes: PermissionScope[]? = []
 * List of permissions for the token
 *
 * @return OK: {tokenDocId: string, tokenEntry: PAToken, token: string}
 * @return SERVER_ERROR: ApiError
 *
 * @example Get a 1 day token
 * fetch('https://api.smithed.dev/v2/tokens?token=<ID Token Here>&expires=1d', {mode: "POST"})
 */
API_APP.route({
	method: "POST",
	url: "/tokens",
	schema: {
		querystring: Type.Object({
			token: Type.String(),
			expires: Type.String({ default: "1h" }),
			name: Type.String({ default: "A token" }),
			scopes: Type.Array(PermissionScopeSchema, { default: [] }),
		}),
	},
	handler: async (req, res) => {
		const { token, expires, name, scopes } = req.query

		try {
			var uid = (await getAuth().verifyIdToken(token)).uid
		} catch {
			return sendError(
				res,
				HTTPResponses.BAD_REQUEST,
				"Invalid token, ensure it is a Firebase token and not a PAT"
			)
		}

		const lifetime = expiresToSeconds(expires)
		req.log.info("Token Lifetime: " + lifetime)
		const tokenEntry: PAToken = {
			owner: uid,
			createdAt: Date.now(),
			expiration: lifetime,
			scopes: scopes,
			tokenUid: randomUUID(),
			name: name,
		}

		const tokenDocId = (
			await getFirestore().collection("tokens").add(tokenEntry)
		).id

		const jwt = await signJWT(tokenEntry, tokenDocId, expires)
		return { tokenDocId, tokenEntry, token: jwt }

	},
})

/*
 * @route GET /tokens
 * This route gets all tokens owned by the user
 *
 * @query token: string
 * Specifically a Firebase ID Token, not another PAT
 *
 * @return OK: {tokenDocId, tokenEntry: PAToken}[]
 * @return SERVER_ERROR: ApiError
 *
 * @example Get all tokens
 * fetch('https://api.smithed.dev/v2/tokens?token=<ID Token Here>')
 */
API_APP.route({
	method: "GET",
	url: "/tokens",
	schema: {
		querystring: Type.Object({
			token: Type.String(),
		}),
	},
	handler: async (req, res) => {
		const { token } = req.query

		try {
			var uid = (await getAuth().verifyIdToken(token)).uid
		} catch {
			return sendError(
				res,
				HTTPResponses.BAD_REQUEST,
				"Invalid token, ensure it is a Firebase token and not a PAT"
			)
		}

		const query = await getFirestore()
			.collection("tokens")
			.where("owner", "==", uid)
			.get()
		const docs = query.docs
		return docs.map((d) => ({ tokenDocId: d.id, tokenEntry: d.data() }))
	},
})

/*
 * @route DELETE /tokens/:id
 * This route deletes a given token
 *
 * @query token: string
 * Specifically a Firebase ID Token, not another PAT
 *
 * @param id: string
 * The Doc Id for the token
 *
 * @return OK
 * @return SERVER_ERROR: ApiError
 *
 * @example Get a token
 * fetch('https://api.smithed.dev/v2/tokens/123456?token=<ID Token Here>')
 */
API_APP.route({
	method: "DELETE",
	url: "/tokens/:id",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
		querystring: Type.Object({
			token: Type.String(),
		}),
	},
	handler: async (req, res) => {
		const { id } = req.params
		const { token } = req.query

		try {
			var uid = (await getAuth().verifyIdToken(token)).uid
		} catch {
			return sendError(
				res,
				HTTPResponses.BAD_REQUEST,
				"Invalid token, ensure it is a Firebase token and not a PAT"
			)
		}

		req.log.info("Delete token: " + id)
		const doc = await getFirestore().collection("tokens").doc(id).get()
		if (!doc.exists || doc.data()?.owner !== uid)
			return sendError(
				res,
				HTTPResponses.NOT_FOUND,
				"The token does not exist"
			)

		await doc.ref.delete()
	},
})

/*
 * @route POST /tokens/:id/refresh
 * This refreshes a given token
 *
 * @query token: string
 * Specifically a Firebase ID Token, not another PAT
 *
 * @param id: string
 * The Doc Id for the token
 *
 * @return OK: {tokenEntry: PAToken, token: string}
 * @return SERVER_ERROR: ApiError
 *
 * @example Get a token
 * fetch('https://api.smithed.dev/v2/tokens/123456?token=<ID Token Here>')
 */
API_APP.route({
	method: "POST",
	url: "/tokens/:id/refresh",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
		querystring: Type.Object({
			token: Type.String(),
		}),
	},
	handler: async (req, res) => {
		const { id } = req.params
		const { token } = req.query

		try {
			var uid = (await getAuth().verifyIdToken(token)).uid
		} catch {
			return sendError(
				res,
				HTTPResponses.BAD_REQUEST,
				"Invalid token, ensure it is a Firebase token and not a PAT"
			)
		}

		const doc = await getFirestore().collection("tokens").doc(id).get()
		if (!doc.exists || doc.data()?.owner !== uid)
			return sendError(
				res,
				HTTPResponses.NOT_FOUND,
				"The token does not exist"
			)
		const tokenEntry = doc.data() as PAToken

		tokenEntry.createdAt = Date.now()
		tokenEntry.tokenUid = randomUUID()

		await doc.ref.set(tokenEntry)
		const jwt = await signJWT(tokenEntry, id, tokenEntry.expiration + "s")
		return { token: jwt, tokenEntry: tokenEntry }
	},
})

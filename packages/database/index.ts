import * as fs from "fs"
import { cert, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

import * as jose from "jose"
import { HTTPResponses, PAToken, PermissionScope } from "data-types"
import { FastifyReply } from "fastify"

import * as Sentry from "@sentry/node"

export let privateKey: jose.KeyLike
export let serviceAccount: any

export async function initializeAdmin() {
	if (serviceAccount !== undefined) return

	serviceAccount =
		typeof process.env.ADMIN_CERT === "string"
			? JSON.parse(
					fs.readFileSync(process.env.ADMIN_CERT, {
						encoding: "utf-8",
					})
				)
			: process.env.ADMIN_CERT
	if (serviceAccount.private_key === undefined)
		throw new Error("Service account does not have a defined private key!")

	// Configure our JWT library to use the firbase private key to sign tokens
	// Ensures that further down the line, the data stored in the token is reserved
	// to Smithed usage.
	privateKey = await jose.importPKCS8(serviceAccount.private_key, "RS256")

	const firebaseConfig = {
		credential: cert(serviceAccount),
		databaseURL: "https://mc-smithed-default-rtdb.firebaseio.com",
		apiKey: "AIzaSyDX-vLCBhO8StKAxnpvQ2EW8lz3kzYn4Qk",
		authDomain: "mc-smithed.firebaseapp.com",
		projectId: "mc-smithed",
		storageBucket: "mc-smithed.appspot.com",
		messagingSenderId: "574184244682",
		appId: "1:574184244682:web:498d168c09b39e4f0d7b33",
		measurementId: "G-40SRKC35Z0",
	}
	initializeApp(firebaseConfig)
	getAuth()
}

type ExtractedTokenData = {
	type: "id" | "pat"
	uid: string
	scopes: PermissionScope[]
}

async function getFromJWT(
	token: string
): Promise<ExtractedTokenData | undefined> {
	try {
		const result = await jose.jwtVerify(
			token.replaceAll("\n", ""),
			privateKey
		)

		// Manually check the expiration date against the current system time
		// This allows for tokens of lifetime greater than one hour.
		if (Date.now() / 1000 >= (result.payload.exp ?? 0)) return undefined

		const { tokenUid, docId }: { tokenUid?: string; docId?: string } =
			result.protectedHeader as any

		if (tokenUid === undefined || docId === undefined) return undefined

		const tokenEntry = (
			await getFirestore().collection("tokens").doc(docId).get()
		).data() as PAToken | undefined

		if (tokenEntry === undefined) return undefined

		if (tokenUid !== tokenEntry.tokenUid) return undefined

		return { type: "pat", uid: tokenEntry.owner, scopes: tokenEntry.scopes }
	} catch (e) {
		return undefined
	}
}

const ALL_SCOPES = Object.values(PermissionScope).filter(
	(v) => typeof v !== "string"
) as PermissionScope[]

async function getFromIdToken(
	token: string
): Promise<ExtractedTokenData | undefined> {
	const auth = getAuth()
	try {
		const result = await auth.verifyIdToken(token)
		return {
			type: "id",
			uid: result.uid,
			scopes: ALL_SCOPES,
		}
	} catch {}
	return undefined
}

export async function parseToken(
	token: string
): Promise<ExtractedTokenData | undefined> {
	// Since tokens are passed as strings, we need to try to resolve
	// Firebase ID tokens and then check for custom JWT's if that fails

	if (token.startsWith("smithed-")) return getFromJWT(token.slice(8))
	else return getFromIdToken(token)
}

export async function validateToken(
	reply: FastifyReply,
	token: string,
	options?: {
		requiredUid?: string[]
		requiredScopes?: PermissionScope[]
	}
): Promise<ExtractedTokenData | undefined> {
	const tokenData = await parseToken(token)
	if (tokenData === undefined) {
		reply.status(HTTPResponses.UNAUTHORIZED).send({
			statusCode: HTTPResponses.UNAUTHORIZED,
			error: HTTPResponses[HTTPResponses.UNAUTHORIZED],
			message: "Invalid token",
		})
		return undefined
	}

	if (!options) return tokenData

	if (options.requiredUid && !options.requiredUid.includes(tokenData.uid)) {
		reply.status(HTTPResponses.FORBIDDEN).send({
			statusCode: HTTPResponses.FORBIDDEN,
			error: HTTPResponses[HTTPResponses.FORBIDDEN],
			message: "You do not have ownership of this content",
		})
		return undefined
	}

	if (
		options.requiredScopes &&
		!options.requiredScopes.every((v) => tokenData.scopes.includes(v))
	) {
		reply.status(HTTPResponses.FORBIDDEN).send({
			statusCode: HTTPResponses.FORBIDDEN,
			error: HTTPResponses[HTTPResponses.FORBIDDEN],
			message:
				"Your token does not have the required scopes for this operation",
		})

		return undefined
	}

	return tokenData
}

export async function getPackDoc(id: string) {
	const packs = Sentry.startSpan({ name: "get packs collection" }, () => {
		return getFirestore().collection("packs")
	})

	const doc = await Sentry.startSpan({ name: "try get pack by uid" }, () =>
		packs.doc(id).get()
	)

	if (doc.exists) {
		return doc
	}

	const query = await Sentry.startSpan({ name: "get pack by slug id" }, () =>
		packs.where("id", "==", id).limit(1).get()
	)

	if (query.docs.length == 0) return undefined

	return query.docs[0]
}

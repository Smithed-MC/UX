import { Static, Type } from "@sinclair/typebox"
import { API_APP, get, sendError, set } from "../../../app.js"
import { getFirestore } from "firebase-admin/firestore"
import { sanitize } from "../../sanitize.js"
import {
	Article,
	ArticleSchema,
	HTTPResponses,
	UserData,
	UserDataSchema,
} from "data-types"
import { parseToken, validateToken } from "database"
import { getAuth } from "firebase-admin/auth"

import { useId } from "react"
import fetch from "node-fetch"
import { getUserDoc } from "../../users/id/index.js"

export async function getArticleDoc(id: string) {
	const firestore = getFirestore()
	const packs = firestore.collection("articles")

	const doc = await packs.doc(id).get()
	if (doc.exists) {
		return doc
	}

	return undefined
}

API_APP.route({
	method: "GET",
	url: "/articles/:id",
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

		const articleDoc = await getArticleDoc(id)

		if (articleDoc === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				"Article not found"
			)

		const article = articleDoc.data() as Article

		if (article.state === "unpublished") {
			let allowedToViewContents = false

			if (token) {
				const userUID = (await parseToken(token))?.uid

				if (userUID) {
					const userDoc = await getUserDoc(userUID)
					if (userDoc) {
						const userData = userDoc.data() as UserData

						allowedToViewContents = userData.role === "admin"
					}
				}
			}

			if (!allowedToViewContents) {
				article.content = ""
				article.title = ""
				article.banner = ""
			}
		}

		return article
	},
})

API_APP.route({
	method: "POST",
	url: "/articles/:id",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
		querystring: Type.Object({
			token: Type.String(),
		}),
		body: Type.Object({
			data: ArticleSchema,
		}),
	},
	handler: async (request, reply) => {
		const { id } = request.params
		const { token } = request.query
		const { data: article } = request.body

		const userUID = (await validateToken(reply, token))?.uid

		if (userUID === undefined)
			return

		const userDoc = await getUserDoc(userUID)
		if (!userDoc)
			return sendError(reply, HTTPResponses.UNAUTHORIZED, "Invalid token")

		const userData = userDoc.data() as UserData
		if (userData.role !== "admin")
			return sendError(
				reply,
				HTTPResponses.FORBIDDEN,
				"This function is only available to admins"
			)

		const articles = getFirestore().collection("articles")
		const articleDoc = await articles.doc(id).get()

		if (articleDoc.exists) {
			const existingData = articleDoc.data()! as Article

			if (
				existingData.state === "unpublished" &&
				article.state === "published"
			) {
				// TODO: send webhook message
			}
		}

		await articleDoc.ref.set(article)
		reply.status(HTTPResponses.OK).send("Updated article")
	},
})

API_APP.route({
	method: "DELETE",
	url: "/articles/:id",
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

		const userUID = (await validateToken(reply, token))?.uid
		if (userUID === undefined)
			return 

		const userDoc = await getUserDoc(userUID)
		if (!userDoc)
			return sendError(reply, HTTPResponses.UNAUTHORIZED, "Invalid token")

		const userData = userDoc.data() as UserData
		if (userData.role !== "admin")
			return sendError(
				reply,
				HTTPResponses.FORBIDDEN,
				"This function is only available to admins"
			)

		const articles = getFirestore().collection("articles")
		const articleDoc = await articles.doc(id).get()

		if (!articleDoc.exists)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				"Article doesn't exist!"
			)

		await articleDoc.ref.delete()
		reply.status(HTTPResponses.OK).send("Deleted article")
	},
})

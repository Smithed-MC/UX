import { Type } from "@sinclair/typebox"
import { API_APP, sendError } from "../../../app.js"
import { HTTPResponses, UserData } from "data-types"
import { getFirestore, FieldValue } from "firebase-admin/firestore"
import nodemailer from "nodemailer"
import { validateToken } from "database"
import { marked } from "marked"
import crypto from "crypto"

import { getUserDoc } from "../../users/id/index.js"

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: Number(process.env.SMTP_PORT),
	secure: true,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
})

try {
	await transporter.verify()
	console.log("Server is ready to take our messages")
} catch (err) {
	console.error("Verification failed", err)
}

const EMAIL_REGEX =
	/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g

/**
 * Subscribe to an email list
 */
API_APP.route({
	method: "POST",
	url: "/email-lists/:listId/subscribe",
	schema: {
		params: Type.Object({
			listId: Type.String(),
		}),
		querystring: Type.Object({
			email: Type.String({ maxLength: 32 }),
			minecraftUsername: Type.Optional(
				Type.String({
					minLength: 3,
					maxLength: 16,
					format: "regex",
					pattern: "^[A-Za-z0-9_]{3,16}$",
				})
			),
		}),
	},
	handler: async (request, reply) => {
		const { listId } = request.params
		const { email, minecraftUsername } = request.query

		if (!email.match(EMAIL_REGEX))
			return sendError(
				reply,
				HTTPResponses.BAD_REQUEST,
				"Email is not valid"
			)

		const db = getFirestore()
		const listDoc = await db.collection("email-lists").doc(listId).get()

		if (!listDoc.exists)
			return sendError(
				reply,
				HTTPResponses.BAD_REQUEST,
				"Email list does not exist!"
			)

		const formattedEmail = email.toLowerCase()
		const subscribersRef = listDoc.ref.collection("subscribers")

		// 1. Check if they already exist in the new subcollection
		const existingSub = await subscribersRef.doc(formattedEmail).get()
		if (existingSub.exists)
			return sendError(
				reply,
				HTTPResponses.BAD_REQUEST,
				"Email already registered!"
			)

		// 1b. Check legacy array (just in case broadcast hasn't migrated it yet)
		const legacyEmails: (
			| string
			| { email: string; minecraftUuid?: string }
		)[] = listDoc.get("emails") || []
		if (
			legacyEmails.find((e) =>
				typeof e === "string" ? e === email : e.email === email
			)
		)
			return sendError(
				reply,
				HTTPResponses.BAD_REQUEST,
				"Email already registered!"
			)

		let profile: { id: string } | undefined = undefined

		if (minecraftUsername) {
			try {
				const resp = await fetch(
					`https://api.mojang.com/users/profiles/minecraft/${minecraftUsername}`
				)

				if (!resp.ok) {
					request.log.error(await resp.text())
					return sendError(
						reply,
						HTTPResponses.SERVER_ERROR,
						"Failed to get UUID"
					)
				}
				profile = await resp.json()
			} catch (e) {
				request.log.error(e)
				return sendError(
					reply,
					HTTPResponses.SERVER_ERROR,
					"Failed to get UUID"
				)
			}

			// Check if UUID is already registered in subcollection
			const existingUuid = await subscribersRef
				.where("minecraftUuid", "==", profile!.id)
				.get()
			if (!existingUuid.empty)
				return sendError(
					reply,
					HTTPResponses.BAD_REQUEST,
					"Minecraft username already registered!"
				)

			// Check UUID in legacy array
			if (
				legacyEmails.find((e) =>
					typeof e !== "string"
						? e.minecraftUuid === profile!.id
						: false
				)
			)
				return sendError(
					reply,
					HTTPResponses.BAD_REQUEST,
					"Minecraft username already registered!"
				)
		}

		// Store the new subscriber in their own document, using the email as the Document ID
		await subscribersRef.doc(formattedEmail).set({
			email: formattedEmail,
			minecraftUuid: profile?.id || null,
			subscribedAt: new Date().toISOString(),
		})

		return reply.status(200).send({ success: true })
	},
})

/**
 * Send an email to all subscribers in a specific list & Migrate
 */
API_APP.route({
	method: "POST",
	url: "/email-lists/:listId/broadcast",
	schema: {
		params: Type.Object({ listId: Type.String() }),
		querystring: Type.Object({
			token: Type.String(),
			withMinecraftUsername: Type.Union(
				[
					Type.Literal("with"),
					Type.Literal("without"),
					Type.Literal("either"),
				],
				{ default: "either" }
			),
		}),
		body: Type.Object({
			subject: Type.String(),
			content: Type.String(),
		}),
	},
	handler: async (request, reply) => {
		const { token, withMinecraftUsername } = request.query

		const tokenData = await validateToken(reply, token)
		if (tokenData === undefined) return

		const user = (await getUserDoc(tokenData.uid))?.data() as
			| UserData
			| undefined
		if (!user || user.role !== "admin") return

		const { listId } = request.params
		const { subject, content } = request.body

		const db = getFirestore()
		const listRef = db.collection("email-lists").doc(listId)
		const listDoc = await listRef.get()

		if (!listDoc)
			return sendError(reply, HTTPResponses.BAD_REQUEST, "List not found")

		const subscribersRef = listRef.collection("subscribers")

		await migrateLegacyEmailList(listDoc, db, subscribersRef, listRef)

		const subscribersSnap = await subscribersRef.get()

		const emailsToSend: string[] = []

		subscribersSnap.forEach((doc) => {
			const sub = doc.data()

			if (withMinecraftUsername === "with" && !sub.minecraftUuid) return
			if (withMinecraftUsername === "without" && sub.minecraftUuid) return

			if (sub.email) {
				emailsToSend.push(sub.email)
			}
		})

		if (emailsToSend.length === 0)
			return sendError(
				reply,
				HTTPResponses.BAD_REQUEST,
				"No subscribers match your criteria."
			)

		const sentEmailRef = await db.collection("sent-emails").add({
			listId,
			subject,
			totalRecipients: emailsToSend.length,
			sentCount: 0,
			failedEmails: [],
			status: "processing",
			createdAt: new Date().toISOString(),
		})

		const htmlContent = `
			<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
				${await marked(content)}
			</div>
		`

		;(async () => {
			let successfulSends = 0
			const failedSends: string[] = []
			const batchSize = 6

			for (let i = 0; i < emailsToSend.length; i += batchSize) {
				const currentBatch = emailsToSend.slice(i, i + batchSize)

				await Promise.all(
					currentBatch.map(async (email) => {
						try {
							await transporter.sendMail({
								from: '"Smithed" <no-reply@smithed.net>',
								to: email,
								subject: subject,
								html: htmlContent,
								text: content,
							})
							successfulSends++
						} catch (err) {
							console.error(`Failed to send to ${email}:`, err)
							failedSends.push(email)
						}
					})
				)

				await sentEmailRef.update({
					sentCount: successfulSends,
					failedEmails: failedSends,
				})

				await new Promise((resolve) => setTimeout(resolve, 60 * 1000))
			}

			await sentEmailRef.update({
				status: "completed",
				completedAt: new Date().toISOString(),
			})
		})()

		return reply.status(202).send({
			message: "Broadcast started",
			jobId: sentEmailRef.id,
			recipients: emailsToSend.length,
		})
	},
})

async function migrateLegacyEmailList(
	listDoc: FirebaseFirestore.DocumentSnapshot,
	db: FirebaseFirestore.Firestore,
	subscribersRef: FirebaseFirestore.CollectionReference,
	listRef: FirebaseFirestore.DocumentReference
) {
	const legacyEmails = listDoc.get("emails")

	if (Array.isArray(legacyEmails) && legacyEmails.length > 0) {
		for (let i = 0; i < legacyEmails.length; i += 450) {
			const batch = db.batch()
			const chunk = legacyEmails.slice(i, i + 450)

			chunk.forEach((e) => {
				const emailStr = typeof e === "string" ? e : e.email
				const uuidStr =
					typeof e === "string" ? null : e.minecraftUuid || null
				const formattedEmail = emailStr.toLowerCase()

				batch.set(
					subscribersRef.doc(formattedEmail),
					{
						email: formattedEmail,
						minecraftUuid: uuidStr,
						migratedAt: new Date().toISOString(),
					},
					{ merge: true }
				)
			})

			if (i + 450 >= legacyEmails.length) {
				batch.update(listRef, { emails: FieldValue.delete() })
			}

			await batch.commit()
		}
	}
}

/**
 * Request an email with a link to manage subscription / unsubscribe
 */
API_APP.route({
	method: "POST",
	url: "/email-lists/:listId/request-management",
	config: {
		rateLimit: {
			max: 3,
			timeWindow: "1 hour",
		},
	},
	schema: {
		params: Type.Object({ listId: Type.String() }),
		body: Type.Object({
			email: Type.String({ maxLength: 128 }),
			redirectUrl: Type.String(),
		}),
	},
	handler: async (request, reply) => {
		const { listId } = request.params
		const { email, redirectUrl } = request.body

		const db = getFirestore()
		const listRef = db.collection("email-lists").doc(listId)
		const listDoc = await listRef.get()

		if (!listDoc.exists)
			return sendError(reply, HTTPResponses.BAD_REQUEST, "List not found")

		const subscribersRef = listRef.collection("subscribers")

		await migrateLegacyEmailList(listDoc, db, subscribersRef, listRef)

		const formattedEmail = email.toLowerCase()

		// Verify the user is actually subscribed
		const subDoc = await subscribersRef.doc(formattedEmail).get()
		if (!subDoc.exists) {
			return sendError(
				reply,
				HTTPResponses.BAD_REQUEST,
				"Email is not subscribed to this list."
			)
		}

		// Generate token and expiration
		const token = crypto.randomBytes(32).toString("hex")
		const expiresAt = new Date()
		expiresAt.setHours(expiresAt.getHours() + 1)

		// Attach the token directly to the subscriber's document
		await subscribersRef.doc(formattedEmail).update({
			managementToken: token,
			managementTokenExpiresAt: expiresAt.toISOString(),
		})

		const urlObj = new URL(redirectUrl)
		urlObj.searchParams.append("token", token)
		urlObj.searchParams.append("listId", listId)
		const magicLink = urlObj.toString()

		const htmlContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;600&display=swap" rel="stylesheet">
			</head>
			<body style="margin: 0; padding: 0; background-color: #121213;">
				<div style="background-color: #121213; padding: 40px 20px; font-family: 'Lexend', Helvetica, Arial, sans-serif; color: #fff8f0;">
					
					<div style="max-width: 600px; margin: 0 auto; background-color: #1d1f21; border-radius: 16px; padding: 40px; border: 1px solid #2e2e31;">
						
						<h2 style="font-size: 24px; font-weight: 600; margin-top: 0; margin-bottom: 24px; color: #fff8f0;">
							Manage Your Subscription
						</h2>
						
						<p style="font-weight: 300; font-size: 16px; line-height: 1.6; color: #fff8f0; margin-bottom: 32px;">
							We received a request to edit the Minecraft account attached to this email or to unsubscribe from the list.
						</p>
						
						<p style="margin: 0 0 32px 0;">
							<a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #1b48c4; color: #fff8f0; text-decoration: none; border-radius: 16px; font-weight: 400; font-size: 16px; border: 2px solid transparent;">
								Manage Subscription
							</a>
						</p>
						
						<div style="border-top: 1px solid #4b4b4b; padding-top: 24px; margin-top: 24px;">
							<p style="font-size: 14px; color: #aaa; margin: 0; font-weight: 300; line-height: 1.5;">
								This link will expire in 1 hour. If you did not request this, you can safely ignore this email.
							</p>
						</div>

					</div>

				</div>
			</body>
			</html>
		`

		try {
			await transporter.sendMail({
				from: '"Smithed" <no-reply@smithed.net>',
				to: formattedEmail,
				subject: "Manage your Smithed subscription",
				html: htmlContent,
				text: `Manage your subscription here: ${magicLink} (Expires in 1 hour)`,
			})
		} catch (err) {
			console.error(
				`Failed to send management email to ${formattedEmail}:`,
				err
			)
			return sendError(
				reply,
				HTTPResponses.SERVER_ERROR,
				"Failed to send email."
			)
		}

		return reply.status(200).send({
			success: true,
			message:
				"If the email is subscribed, a management link has been sent.",
		})
	},
})

/**
 * Consume a management token to update or unsubscribe
 */
API_APP.route({
	method: "PATCH",
	url: "/email-lists/:listId/manage",
	schema: {
		params: Type.Object({ listId: Type.String() }),
		body: Type.Object({
			token: Type.String(),
			action: Type.Union([Type.Literal("update"), Type.Literal("unsubscribe")]),
			minecraftUsername: Type.Optional(
				Type.String({
					minLength: 3,
					maxLength: 16,
					format: "regex",
					pattern: "^[A-Za-z0-9_]{3,16}$",
				})
			),
		}),
	},
	handler: async (request, reply) => {
		const { listId } = request.params
		const { token, action, minecraftUsername } = request.body

		const db = getFirestore()
		const subscribersRef = db.collection("email-lists").doc(listId).collection("subscribers")

		const snapshot = await subscribersRef.where("managementToken", "==", token).limit(1).get()

		if (snapshot.empty) {
			return sendError(reply, HTTPResponses.UNAUTHORIZED, "Invalid or expired token.")
		}

		const subDoc = snapshot.docs[0]
		const subData = subDoc.data()

		if (new Date(subData.managementTokenExpiresAt) < new Date()) {
			return sendError(reply, HTTPResponses.UNAUTHORIZED, "This link has expired. Please request a new one.")
		}

		if (action === "unsubscribe") {
			await subDoc.ref.delete()
			return reply.status(200).send({ success: true, message: "Successfully unsubscribed." })
		}

		if (action === "update") {
			let newUuid: string | null = null

			if (minecraftUsername) {
				try {
					const resp = await fetch(`https://api.mojang.com/users/profiles/minecraft/${minecraftUsername}`)

					if (!resp.ok) {
						if (resp.status === 404 || resp.status === 204) {
							return sendError(reply, HTTPResponses.BAD_REQUEST, "Minecraft username does not exist.")
						}
						request.log.error(await resp.text())
						return sendError(reply, HTTPResponses.SERVER_ERROR, "Failed to verify Minecraft username.")
					}
					
					const profile = await resp.json()
					newUuid = profile.id
				} catch (e) {
					request.log.error(e)
					return sendError(reply, HTTPResponses.SERVER_ERROR, "Failed to verify Minecraft username.")
				}

				if (newUuid !== subData.minecraftUuid) {
					const existingUuid = await subscribersRef.where("minecraftUuid", "==", newUuid).get()
					if (!existingUuid.empty) {
						return sendError(reply, HTTPResponses.BAD_REQUEST, "This Minecraft username is already registered to another email on this list.")
					}
				}
			}

			await subDoc.ref.update({
				minecraftUuid: newUuid,
				managementToken: FieldValue.delete(),
				managementTokenExpiresAt: FieldValue.delete(),
			})

			return reply.status(200).send({ success: true, message: "Subscription updated successfully." })
		}
	},
})

API_APP.route({
	method: "GET",
	url: "/email-lists/:listId/manage",
	schema: {
		params: Type.Object({ listId: Type.String() }),
		querystring: Type.Object({ token: Type.String() }),
	},
	handler: async (request, reply) => {
		const { listId } = request.params
		const { token } = request.query

		const db = getFirestore()
		const subscribersRef = db.collection("email-lists").doc(listId).collection("subscribers")

		const snapshot = await subscribersRef.where("managementToken", "==", token).limit(1).get()

		if (snapshot.empty) {
			return sendError(reply, HTTPResponses.UNAUTHORIZED, "Invalid or expired token.")
		}
		
		const subData = snapshot.docs[0].data()

		if (new Date(subData.managementTokenExpiresAt) < new Date()) {
			return sendError(reply, HTTPResponses.UNAUTHORIZED, "Token has expired.")
		}

		let currentUsername: string | null = null

		if (subData.minecraftUuid) {
			try {
				const resp = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${subData.minecraftUuid}`)
				
				if (resp.ok) {
					const profile = await resp.json()
					currentUsername = profile.name
				} else {
					request.log.warn(`Failed to fetch Mojang profile for UUID: ${subData.minecraftUuid}`)
				}
			} catch (e) {
				request.log.error("Mojang API error during reverse lookup:", e)
			}
		}

		return reply.status(200).send({ 
			email: subData.email,
			minecraftUsername: currentUsername || "" 
		})
	},
})
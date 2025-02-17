import { HTTPResponses } from "data-types"
import { API_APP, sendError } from "../../app.js"
import { getAuth } from "firebase-admin/auth"

const MODRINTH_CLIENT_ID = "MqnfzuDp"

API_APP.route({
	method: "GET",
	url: "/auth/modrinth",
	handler: async (req, res) => {
		const query: Record<string, any> = req.query as any

		if ("error" in query) {
			return sendError(
				res,
				HTTPResponses.SERVER_ERROR,
				"An error occurred while authorizing your Modrinth account\n" +
					query["error_description"]
			)
		}

		const code = query["code"] as string
        const redirect: string|undefined = query["redirect"]

		const redirectUri = new URL(`${req.protocol}://${req.hostname}${req.url}`)

        redirectUri.searchParams.delete("code")

        req.log.info(redirectUri.toString())

		const resp = await fetch(
			"https://api.modrinth.com/_internal/oauth/token",
			{
				method: "POST",
				headers: {
					Authorization: process.env.MODRINTH_SECRET ?? "none",
				},
				body: new URLSearchParams({
					code: code,
					client_id: MODRINTH_CLIENT_ID,
					redirect_uri: redirectUri.toString(),
					grant_type: "authorization_code",
				}),
			}
		)

		if (!resp.ok) {
			return sendError(
				res,
				HTTPResponses.SERVER_ERROR,
				"An error occured getting the authorization token\n" +
					(await resp.text())
			)
		}

		const { access_token: modrinthToken, expires_in: expiresIn } =
			await resp.json()

        if (redirect) {
            const url = new URL(redirect)
            url.searchParams.set('modrinthToken', modrinthToken)
            return res.redirect(HTTPResponses.OK, url.toString())
        } else {
            return {modrinthToken, expiresIn}
        }
	},
})

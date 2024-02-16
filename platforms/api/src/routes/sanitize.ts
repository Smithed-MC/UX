import { Type } from "@sinclair/typebox"
import { API_APP } from "../app.js"

export function sanitize(value: string) {
	return value
		.toLowerCase()
		.replace(" ", "-")
		.replace(/(\s+|\[|\]|{|}|\||\\|"|%|~|#|<|>|\?)/g, "")
}

/*
 * @route GET /sanitize
 * Sanitize a value to a consistent format (Alphanumeric + `-` & `_`)
 *
 * @query value: string
 * The value too properly sanitize
 *
 * @return OK: string
 *
 * @example Sanitize a username
 * fetch('https://api.smithed.dev/v2/sanitize?value=Jachro') // Returns "jachro"
 */
API_APP.route({
	method: "GET",
	url: "/sanitize",
	schema: {
		querystring: Type.Object({
			value: Type.String(),
		}),
	},
	handler: async (response, reply) => {
		const { value } = response.query
		return sanitize(value)
	},
})

import { Type } from "@sinclair/typebox"
import { API_APP } from "../app.js"
import { HTTPResponses, supportedMinecraftVersions } from "data-types"

/*
 * @route GET /supported-versions
 * Retrieve the list of all [MinecraftVersion](/api/data-types) supported by the platform
 *
 * @return OK: MinecraftVersion[]
 *
 */
API_APP.route({
	method: "GET",
	url: "/supported-versions",
	schema: {},
	handler: async (request, reply) => {
		reply.status(HTTPResponses.OK).send(supportedMinecraftVersions)
	},
})

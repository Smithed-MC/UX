import { Type } from "@sinclair/typebox";
import { API_APP, REDIS, get, sendError, set } from "../app.js";
import { DownloadRunner } from 'downloader'
import { HTTPResponses, MinecraftVersionSchema, latestMinecraftVersion } from "data-types";

API_APP.route({
    method: 'GET',
    url: '/download',
    schema: {
        querystring: Type.Object({
            pack: Type.Array(Type.String(), { minItems: 1 }),
            version: Type.Optional(MinecraftVersionSchema),
            mode: Type.Union([Type.Literal('datapack'), Type.Literal('resourcepack'), Type.Literal('both')], { default: 'both' })
        })
    },
    handler: async (response, reply) => {
        const { pack: packs, version, mode } = response.query

        const requestIdentifier = 'DOWNLOAD::' + (version ?? latestMinecraftVersion) + ',' + packs.join('-') + ',' + mode
        const tryCachedResult = await get(requestIdentifier)
        if (tryCachedResult) {
            reply.type('application/zip')
            console.log(tryCachedResult.item)
            return tryCachedResult.item
        }

        const runner = new DownloadRunner()
        const result = await runner.run(packs, version ?? latestMinecraftVersion, mode)
        
        if (result) {
            await set(requestIdentifier, result, 3600 * 1000)
            reply.type('application/zip')
            return result
        }
        return sendError(reply, HTTPResponses.SERVER_ERROR, 'An error occured while downloading')
    }
})
import { Type } from "@sinclair/typebox";
import { API_APP, REDIS, get, set } from "../app.js";
import {DownloadRunner} from 'downloader'
import { MinecraftVersionSchema, latestMinecraftVersion } from "data-types";

API_APP.route({
    method: 'GET',
    url: '/download',
    schema: {
        querystring: Type.Object({
            pack: Type.Array(Type.String(), {minItems: 1}),
            version: Type.Optional(MinecraftVersionSchema),
            mode: Type.Union([Type.Literal('datapack'), Type.Literal('resourcepack'), Type.Literal('both')], {default: 'both'})
        })
    }, 
    handler: async (response, reply) => {
        const {pack: packs, version, mode} = response.query

        if(REDIS) 
            REDIS.getrange

        const requestIdentifier = 'DOWNLOAD::' + (version ?? latestMinecraftVersion) + ',' + packs.join('-') + ',' + mode
        const tryCachedResult = await get(requestIdentifier)
        if(tryCachedResult) {
            reply.type('application/zip')
            return tryCachedResult.item
        }

        const runner = new DownloadRunner()
        const result = await runner.run(packs, version ?? latestMinecraftVersion, mode)

        await set(requestIdentifier, result, 3600 * 1000)
        reply.type('application/zip')
        return result
    }
})
import { Type } from "@sinclair/typebox";
import { API_APP, REDIS, get, sendError, set } from "../app.js";
import { CollectedPack, DownloadRunner, collectPacks, incrementPackDownloadCount } from 'downloader'
import { HTTPResponses, MinecraftVersionSchema, latestMinecraftVersion } from "data-types";
import hash from 'hash.js'

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
    handler: async (request, reply) => {
        const { pack: packs, version, mode } = request.query

        const userHash = hash.sha1().update(request.headers["user-agent"] + request.ip).digest("hex")

        const requestIdentifier = 'DOWNLOAD::' + (version ?? latestMinecraftVersion) + ',' + packs.join('-') + ',' + mode
        const tryCachedResult = await get(requestIdentifier)
        if (tryCachedResult) {
            reply.type('application/zip')

            let foundPacks: CollectedPack[] = []
            for(let p of packs)
                foundPacks = foundPacks.concat(await collectPacks(p, version ?? latestMinecraftVersion, false))
            
            for(let f of foundPacks)
                await incrementPackDownloadCount(userHash, f[2] ? 1 : 3, f[0])

            if(tryCachedResult.item instanceof Buffer)
                return tryCachedResult.item
            else
                return Buffer.from(tryCachedResult.item.data)
        }

        const runner = new DownloadRunner(userHash)
        const result = await runner.run(packs, version ?? latestMinecraftVersion, mode)
        
        if (result) {
            await set(requestIdentifier, result, 3600 * 1000)

            let filename = ""
            if(packs.length <= 3) 
                filename = packs.join('-') + "-"
            filename += (mode === 'both' ? 'all-packs' : (mode + (packs.length > 1 ? "s" : "")))

            filename += ".zip"
            

            reply.header('Content-Disposition', `attachment; filename="${filename}"`)
            reply.type('application/zip')
            return result
        }
        return sendError(reply, HTTPResponses.SERVER_ERROR, 'An error occured while downloading')
    }
})
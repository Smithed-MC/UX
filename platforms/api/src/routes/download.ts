import { Type } from "@sinclair/typebox";
import { API_APP, REDIS, get, sendError, set } from "../app.js";
import { CollectedPack, DownloadRunner, collectPacks, incrementPackDownloadCount } from 'downloader'
import { HTTPResponses, MinecraftVersionSchema, latestMinecraftVersion } from 'data-types';
import hash from 'hash.js'
import * as fs from 'fs'
import fetch from "node-fetch";

async function getFilename(packs: string[], mode: string) {
    let filename = ""
    if(packs.length <= 3) {
        const promises = packs.map(p => {
            return (async () => {
                const resp = await fetch('https://api.smithed.dev/v2/packs/' + p.split('@')[0] +'/meta')
                return ((await resp.json()) as {rawId: string}).rawId
            })()
        })
        const ids = await Promise.all(promises)
        
        filename = ids.join('-') + "-"
    }
    filename += (mode === 'both' ? 'all-packs' : (mode + (packs.length > 1 ? "s" : "")))

    filename += ".zip"
    return filename
}

/*
 * @route GET /download 
 * This route facilitates the download and merging of packs off of the platform.
 * 
 * @query pack: string
 * The ID (uid or plaintext) of the pack to merge. A specific version can be specified with the following format `<id>@<version>`. Version can be a semver comparison.
 * Many packs can be downloaded by specifiying the parameter multiple times
 * @query version: MinecraftVersion?
 * The targeted version of Minecraft. Any packs that do not have atleast 1 version supporting this will be skipped.
 * 
 * @query mode: 'datapack'|'resourcepack'|'both' = 'both'
 * What should be downloaded, if both is specified then the datapack and resourcepack are served zipped within the download.
 * 
 * @return OK: ArrayBuffer
 * @return SERVER_ERROR: ApiError
 * 
 * @example Download packs
 * fetch('https://api.smithed.dev/v2/download?pack=tcc&pack=manic&version=1.19)
 */
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
            const filePath: string = tryCachedResult.item
            
            
            reply
                .header('Access-Control-Expose-Headers', 'Content-Disposition')
                .header('Content-Disposition', `attachment; filename="${await getFilename(packs, mode)}"`)
                .type('application/octet-stream')
            
            let foundPacks: CollectedPack[] = []
            for(let p of packs)
                foundPacks = foundPacks.concat(await collectPacks(p, version ?? latestMinecraftVersion, false))
            
            for(let f of foundPacks)
                await incrementPackDownloadCount(userHash, f[2] ? 1 : 3, f[0])


            // console.log(filePath)

            return fs.createReadStream(filePath)
        }

        const runner = new DownloadRunner(userHash)
        const result = await runner.run(packs, version ?? latestMinecraftVersion, mode)
        
        if (result) {
            await set(requestIdentifier, result.path, 3600 * 1000)

            
            console.log('sending')

            reply
                .header('Access-Control-Expose-Headers', 'Content-Disposition')    
                .header('Content-Disposition', `attachment; filename="${await getFilename(packs, mode)}"`)
                .type('application/octet-stream')
            return result
        }
        return sendError(reply, HTTPResponses.SERVER_ERROR, 'An error occured while downloading')
    }
})
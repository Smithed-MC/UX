import { Type } from "@sinclair/typebox";
import { API_APP } from "../app.js";
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
        
        const runner = new DownloadRunner()
        const result = await runner.run(packs, version ?? latestMinecraftVersion, mode)

        if(result) {
            
        }
        reply.type('application/zip')
        return result
    }
})
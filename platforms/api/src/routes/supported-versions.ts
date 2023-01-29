import { Type } from "@sinclair/typebox";
import { API_APP } from "../app.js";
import { BlobReader, ZipReader } from "@zip.js/zip.js";
import { HTTPResponses, supportedMinecraftVersions } from "data-types";


API_APP.route({
    method: 'GET',
    url: '/v2/supported-versions',
    schema: {
    }, 
    handler: async (request, reply) => {
        reply.status(HTTPResponses.OK).send(supportedMinecraftVersions)
    }
})
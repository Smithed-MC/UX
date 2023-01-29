import { Type } from "@sinclair/typebox";
import { API_APP } from "../app.js";
import { BlobReader, ZipReader } from "@zip.js/zip.js";


API_APP.route({
    method: 'GET',
    url: '/v2/validate-download',
    schema: {
        querystring: Type.Object({
            url: Type.String()
        })
    }, 
    handler: async (request, reply) => {
        const { url } = request.query
        if (url === undefined || url === '')
            return reply.status(400).send('No url was specified')
    
        try {
            const resp = await fetch(url as string)
            if (!resp.ok)
                return reply.status(200).send(resp.status)
    
            const zip = await resp.blob()
    
            try {
                const entries = await new ZipReader(new BlobReader(zip)).getEntries()
    
                reply.status(200).send('valid')
            } catch {
                return reply.status(200).send('Download was not a valid zip!')
            }
    
        } catch {
            reply.status(200).send('Error when fetching url!')
        }
    }
})
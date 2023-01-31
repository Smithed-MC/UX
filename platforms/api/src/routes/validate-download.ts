import { Type } from "@sinclair/typebox";
import { API_APP, sendError } from "../app.js";
import { HTTPResponses } from "data-types";


API_APP.route({
    method: 'GET',
    url: '/validate-download',
    schema: {
        querystring: Type.Object({
            url: Type.String()
        })
    }, 
    handler: async (request, reply) => {
        const { url } = request.query
        if (url === undefined || url === '')
            return sendError(reply, HTTPResponses.BAD_REQUEST, "No url was specified")
    
        try {
            const resp = await fetch(url as string)
            if (!resp.ok)
                return {valid: false}
        
            return {valid: true}
            
    
        } catch {
            return {valid: false}
        }
    }
})
import { Type } from "@sinclair/typebox";
import { API_APP, sendError } from "../app.js";
import { HTTPResponses } from "data-types";


/*
 * @route GET /validate-download
 * This route is used to ensure that a download url is valid and reachable by the Smithed servers.
 * 
 * @query url: string
 * The download url
 * 
 * @return OK: {valid: boolean}
 *  
 * @example Validate a github url
 * fetch('https://api.smithed.dev/v2/validate-download?url=' + encodeURIComponent(
 *   'https://github.com/TheNuclearNexus/CallOfChaos/releases/download/0.0.5/Call.of.Chaos.0.0.5.zip'
 * ))
 */
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
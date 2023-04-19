import { Type } from "@sinclair/typebox";
import { API_APP } from "../../app.js";
import { getFirestore } from "firebase-admin/firestore";
import { Queryable } from "../../index.js";

/*
 * @route GET /packs/count
 * Similar to /packs, this route returns the number of packs which match the criteria
 * 
 * @query search: string
 * A search query against the name or id of the pack
 * 
 * @return OK: number
 *  
 * @example Number of packs which contain `the`
 * fetch('https://api.smithed.dev/v2/packs/count?search=the')
 */
API_APP.route({
    method: 'GET',
    url: '/packs/count',
    schema: {
        querystring: Type.Object({
            search: Type.Optional(Type.String())
        })
    },
    handler: async (response, reply) => {
        const {search} = response.query;

        let query: Queryable = getFirestore().collection('packs')

        if(search !== undefined && search !== '')
            query = query.where('_indices', 'array-contains', search)
        
        return (await query.count().get()).data().count
    }
})
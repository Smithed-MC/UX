import { Type } from "@sinclair/typebox";
import { API_APP } from "../../app.js";
import { getFirestore } from "firebase-admin/firestore";
import { Queryable } from "../../index.js";

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
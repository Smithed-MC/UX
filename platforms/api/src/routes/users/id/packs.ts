import { Type } from "@sinclair/typebox";
import { API_APP, sendError } from "../../../app.js";
import { getUserDoc } from "./index.js";
import { HTTPResponses } from "data-types";
import { getFirestore } from "firebase-admin/firestore";


API_APP.route({
    method: 'GET',
    url: '/users/:id/packs',
    schema: {
        params: Type.Object({
            id: Type.String()
        })
    },
    handler: async (request, reply) => {
        const {id} = request.params

        const userDoc = await getUserDoc(id)
        if(userDoc === undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, 'User not found')
        
        const packs = getFirestore().collection('packs')

        const query = await packs.where('contributors', 'array-contains', userDoc.id).get()
        
        return query.docs.map(d => d.id)
    }
})
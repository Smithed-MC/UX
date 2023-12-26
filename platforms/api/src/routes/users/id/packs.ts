import { Type } from "@sinclair/typebox";
import { API_APP, TYPESENSE_APP, sendError } from "../../../app.js";
import { getUserDoc } from "./index.js";
import { HTTPResponses } from 'data-types';
import { getFirestore } from "firebase-admin/firestore";


/*
 * @route GET /users/:id/packs
 * Retrieve a specific users owned and contributed packs
 * 
 * @param id
 * The user's UID or plaintext username. Using UID is more performant as it is a direct lookup.
 *
 * @return OK: string[]
 * @return NOT_FOUND: ApiError
 * 
 * @example Fetch a user's data
 * fetch('https://api.smithed.dev/v2/users/TheNuclearNexus/packs')
 */
API_APP.route({
    method: 'GET',
    url: '/users/:id/packs',
    schema: {
        params: Type.Object({
            id: Type.String()
        }),
        querystring: Type.Object({
            scope: Type.Optional(Type.Array(Type.String())),
            hidden: Type.Optional(Type.Boolean())
        })
    },
    handler: async (request, reply) => {
        const {id} = request.params
        const {scope, hidden: includeHidden} = request.query

        request.log.info('Querying Firebase for User w/ ID ' + id)
        const userDoc = await getUserDoc(id)
        if(userDoc === undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, 'User not found')
        
        const packs = await TYPESENSE_APP.collections('packs').documents().search({
            q: '',
            query_by: [
                'owner.displayName'
            ],
            filter_by: [
                'meta.contributors:=`' + userDoc.id + '`',
                ...(!includeHidden ? ['meta.hidden: false', 'data.display.hidden: false'] : [])
            ].join(' && '),
            include_fields: [
                'id',
                ...(scope ?? [])
            ],
            limit: 100
        })

        if (!packs.hits)
            return []

        if (!scope || scope.length === 0) {
            return packs.hits.map(p => (p.document as any).id)
        } else {
            return packs.hits.map(p => p.document)
        }
    }
})

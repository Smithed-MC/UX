import {Type} from '@sinclair/typebox'
import {API_APP, get, sendError, set} from "../../app.js";
import {getFirestore} from 'firebase-admin/firestore'
import { Queryable } from '../../index.js';
import { HTTPResponses, PackData, PackDataSchema, SortOptions, SortSchema } from 'data-types';
import { getUIDFromToken } from 'database';


const getOrderField = (sort: SortOptions) => {
    switch(sort) {
        case SortOptions.Trending:
            return 'stats.score'
        case SortOptions.Downloads:
            return 'stats.downloads.total'
        case SortOptions.Alphabetically:
            return 'data.display.name'
        case SortOptions.Newest:
            return 'stats.added'
    }
}

/*
 * @route GET /packs
 * Get a list of packs which meet the specified criteria
 * 
 * @query search: string
 * A search query against the name or id of the pack
 * 
 * @query sort: SortOptions
 * How to sort the requested data
 * 
 * @query limit: int = 20
 * How many packs to send. Maximum of 100 per request.
 *  
 * @query start: int = 0
 * How far into the queries should be counted
 * 
 * @query category: PackCategory[]?
 * Which categories should the pack be a part of
 * 
 * @query hidden: boolean = false
 * Should unlisted packs be returned. 
 * 
 * @return OK: string[]
 *  
 * @example Get a list of packs that are marked as Extensive
 * fetch('https://api.smithed.dev/v2/packs?category=Extensive')
 */
API_APP.route({
    method: "GET",
    url: '/packs',
    schema: {
        querystring: Type.Object({
            search: Type.Optional(Type.String()),
            sort: SortSchema,
            limit: Type.Integer({maximum: 100, minimum: 1, default: 20}),
            start: Type.Integer({minimum: 0, default: 0}),
            category: Type.Array(Type.String(), {default: []}),
            hidden: Type.Optional(Type.Boolean({default: false}))
        })
    }, 
    handler: async (request, reply) => {
        const {search, sort, limit, start, category, hidden: includeHidden} = request.query;


        const requestIdentifier = 'GET-PACKS::' + search + ',' + sort + ',' + limit + ',' + start + ',' + category + ',' + includeHidden
        const tryCachedResult = await get(requestIdentifier)
        if(tryCachedResult) {
            return tryCachedResult.item
        }
        
        const firestore = getFirestore()

        let query: Queryable = firestore.collection('packs')

        if(search !== undefined && search !== '')
            query = query.where('_indices', 'array-contains', search)
        if(!includeHidden)
            query = query.where('hidden', '==', false)

        query = query.orderBy(getOrderField(sort), sort === SortOptions.Alphabetically ? 'asc' : 'desc').offset(start).limit(limit)
        


        const results = await query.get()
        
        if(results.empty)
            return []

        let resolvedResults: {id: string, displayName: string}[] = []
        for(let d of results.docs) {
            if(category.length != 0 && !category.every(v => d.get('data.categories')?.includes(v)))
                continue;
            resolvedResults.push({id: d.id, displayName: d.get('data.display.name')})
        }

        await set(requestIdentifier, resolvedResults, 5*60*1000)
        return resolvedResults
    } 
})


/*
 * @route POST /packs
 * Upload a new pack to the plaform
 *
 * @query token: string
 * Either Firebase Id Token or a valid PAT
 * 
 * @query id: string
 * The plaintext id for the pack
 * 
 * @body data: PackData
 * 
 * @return OK: {packId: string}
 * @return CONFLICT: ApiError
 * @return UNAUTHORIZED: ApiError
 * @return FORBIDDEN: ApiError
 *  
 * @example Upload a new pack called foobar
 * fetch('https://api.smithed.dev/v2/packs/coc?token=NOT_TODAY_HAHA&id=foobar', {
 *   method:'POST', 
 *   body: {data: <Pack Data>},
 *   headers: {'Content-Type': 'application/json'}
 * })
 */
API_APP.route({
    method: 'POST',
    url: '/packs',
    schema: {
        querystring: Type.Object({
            token: Type.String(),
            id: Type.String()
        }),
        body: Type.Object({
            data: PackDataSchema
        })
    },
    handler: async (request, reply) => {
        const {token, id} = request.query;
        const {data} = request.body

        const userId = await getUIDFromToken(token)
        if(userId === undefined)
            return sendError(reply, HTTPResponses.UNAUTHORIZED, 'Invalid token')

        const firestore = getFirestore()

        const existingCount = firestore.collection('packs').where('id', '==', id).count()

        if((await existingCount.get()).data().count != 0) 
            return sendError(reply, HTTPResponses.CONFLICT, `Pack with ID ${id} already exists in the database`)


        const documentData = {
            id: id,
            contributors: [userId],
            state: 'unsubmitted',
            owner: userId,
            hidden: false,
            stats: {
                added: Date.now(),
                updated: Date.now(),
                downloads: {
                    total: 0,
                    daily: 0
                }
            },
            data: data
        }

        const result = await firestore.collection('packs').add(documentData)
        
        return reply.status(HTTPResponses.CREATED).send({
            packId: result.id
        })
    }
})
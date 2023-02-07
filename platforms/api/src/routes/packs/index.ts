import {Type} from '@sinclair/typebox'
import {API_APP, get, sendError, set} from "../../app.js";
import {getFirestore} from 'firebase-admin/firestore'
import { Queryable } from '../../index.js';
import { HTTPResponses, PackData, PackDataSchema } from 'data-types';
import { getUIDFromToken } from 'database';

enum SortOptions {
    Trending = "trending",
    Downloads = "downloads",
    Alphabetically = "alphabetically",
    Newest = "newest"
}

const getOrderField = (sort: SortOptions) => {
    switch(sort) {
        case SortOptions.Trending:
            return 'stats.downloads.today'
        case SortOptions.Downloads:
            return 'stats.downloads.total'
        case SortOptions.Alphabetically:
            return 'data.display.name'
        case SortOptions.Newest:
            return 'stats.added'
    }
}


API_APP.route({
    method: "GET",
    url: '/packs',
    schema: {
        querystring: Type.Object({
            search: Type.Optional(Type.String()),
            sort: Type.Enum(SortOptions, {default: SortOptions.Downloads}),
            limit: Type.Integer({maximum: 100, minimum: 1, default: 20}),
            start: Type.Integer({minimum: 0, default: 0}),
            category: Type.Array(Type.String(), {default: []}),
            hidden: Type.Optional(Type.Boolean({default: false}))
        })
    }, 
    handler: async (request, reply) => {
        const {search, sort, limit, start, category, hidden} = request.query;


        const requestIdentifier = 'GET-PACKS::' + search + ',' + sort + ',' + limit + ',' + start + ',' + category
        const tryCachedResult = await get(requestIdentifier)
        if(tryCachedResult) {
            return tryCachedResult.item
        }
        
        const firestore = getFirestore()

        let query: Queryable = firestore.collection('packs')

        if(search !== undefined && search !== '')
            query = query.where('_indices', 'array-contains', search)
        if(!hidden)
            query = query.where('data.hidden', '==', false)
            
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
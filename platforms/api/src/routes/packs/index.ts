import {Type} from '@sinclair/typebox'
import {API_APP, get, sendError, set} from "../../app.js";
import {getFirestore} from 'firebase-admin/firestore'
import { Queryable } from '../../index.js';
import { HTTPResponses, MinecraftVersion, MinecraftVersionSchema, PackData, PackDataSchema, SortOptions, SortSchema } from '@smithed-mc/data-types';
import { getUIDFromToken } from 'database';
import { coerce } from 'semver';

type ReceivedPackResult = {docId: string, docData: {data: PackData, _indices: string[], hidden?: boolean, [key: string]: any}}

const getSortValue = (sort: SortOptions, a: ReceivedPackResult, b: ReceivedPackResult): number => {
    switch(sort) {
        case SortOptions.Trending:
            return b.docData.stats.score - a.docData.stats.score
        case SortOptions.Downloads:
            return b.docData.stats.downloads.total - a.docData.stats.downloads.total
        case SortOptions.Alphabetically:
            return a.docData.data.display.name.localeCompare(b.docData.data.display.name)
        case SortOptions.Newest:
            return b.docData.stats.added - a.docData.stats.added
    }
}

const getPackSchema = Type.Object({
    search: Type.Optional(Type.String()),
    sort: SortSchema,
    limit: Type.Integer({maximum: 100, minimum: 1, default: 20}),
    start: Type.Integer({minimum: 0, default: 0}),
    category: Type.Array(Type.String(), {default: []}),
    hidden: Type.Optional(Type.Boolean({default: false})),
    version: Type.Array(MinecraftVersionSchema, {default: []})
})

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
 * @query version: MinecraftVersion[]?
 * Which versions should the pack support
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
        querystring: getPackSchema
    }, 
    handler: async (request, reply) => {
        const {search, sort, limit, start, category, hidden: includeHidden, version} = request.query;

        let packs: { id: string; displayName: string; }[] = await getPacks(request, search, includeHidden, sort, category, version);
        
        return packs.slice(start, start + limit)
    } 
})

/*
 * @route GET /packs/count
 * Similar to /packs, this route returns the number of packs which match the criteria
 * 
 * @query search: string
 * A search query against the name or id of the pack
 * 
 * @query category: PackCategory[]?
 * Which categories should the pack be a part of
 * 
 * @query version: MinecraftVersion[]?
 * Which versions should the pack support
 * 
 * @query hidden: boolean = false
 * Should unlisted packs be returned. 
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
        querystring: Type.Omit(getPackSchema, ['limit', 'start', 'sort'])
    },
    handler: async (request, reply) => {
        const {search, category, hidden: includeHidden, version} = request.query;

        let packs: { id: string; displayName: string; }[] = await getPacks(request, search, includeHidden, SortOptions.Newest, category, version);
        
        return packs.length
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
        
        for(let v of data.versions) {
            if(coerce(v.name) == null)
                return sendError(reply, HTTPResponses.BAD_REQUEST, `Version ${v} is not valid semver`)
        }

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

async function getPacks(request: any, search: string | undefined, includeHidden: boolean | undefined, sort: SortOptions, category: string[], version: string[]) {
    const requestIdentifier = 'GET-PACKS::' + Object.values(request.query);
    const tryCachedResult = await get(requestIdentifier);

    let packs: { id: string; displayName: string; }[] = [];
    if (tryCachedResult) {
        packs = tryCachedResult.item;
    } else {
        packs = await filterPacksByQuery(search, includeHidden, sort, category, version);
        await set(requestIdentifier, packs, 5 * 60 * 1000);
    }
    return packs;
}

async function filterPacksByQuery(search: string | undefined, includeHidden: boolean | undefined, sort: SortOptions, category: string[], version: MinecraftVersion[]) {
    const requestIdentifier = 'STORED-PACKS';
    const tryCachedResult = await get(requestIdentifier);
    let packs: ReceivedPackResult[];
    if (tryCachedResult) {
        packs = tryCachedResult.item;
    } else {
        const firestore = getFirestore();
        let query: Queryable = firestore.collection('packs');

        const docs = (await query.get()).docs;

        packs = [];
        await Promise.allSettled(docs.map(d => (async () => {
            const data = d.data() as any
            if(data.data !== undefined)
                packs.push({ docId: d.id, docData: data});
        })()));

        await set(requestIdentifier, packs, 5 * 60 * 1000);
    }


    if (search !== undefined && search !== '')
        packs = packs.filter(p => p.docData._indices?.includes(search.toLowerCase()));
    if (!includeHidden)
        packs = packs.filter(p => !p.docData.data.display.hidden);

    packs = packs.sort((a, b) => {
        return getSortValue(sort, a, b);
    });

    if (category.length > 0)
        packs = packs.filter(p => {
            return category.every(c => p.docData.data.categories?.includes(c))
        });
    if (version.length > 0)
        packs = packs.filter(p => p.docData.data?.versions.find(v => v.supports.findIndex(mcV => version.includes(mcV)) !== -1))


    return packs.map(p => ({ id: p.docId, displayName: p.docData.data?.display.name }));
}

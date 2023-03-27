import { Type } from "@sinclair/typebox";
import { API_APP, get, sendError, set } from "../../../app.js";
import { getFirestore } from "firebase-admin/firestore";
import { HTTPResponses, PackDataSchema, PackMetaData } from "data-types";
import { getPackDoc, getUIDFromToken } from "database";
import {FastifyRequest, FastifyReply} from 'fastify'



API_APP.route({
    method: 'GET',
    url: '/packs/:id',
    schema: {
        params: Type.Object({
            id: Type.String()
        })
    },
    handler: async (request, reply) => {
        const { id } = request.params;

        const requestIdentifier = 'GET-PACK::' + id
        const tryCachedResult = await get(requestIdentifier)
        if(tryCachedResult && request.headers["cache-control"] !== 'max-age=0') {
            return tryCachedResult.item
        }
        

        const doc = await getPackDoc(id)
        if (doc === undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, `Pack with ID ${id} was not found`)


        await set(requestIdentifier, doc.get('data'), 15*60*1000)
        return await doc.get('data')
    }
})

const setPack = async (response: any, reply: any) => {
    const { id: packId } = response.params;
    const { token } = response.query
    const { data: packData } = response.body;

    const userId = await getUIDFromToken(token)
    if(userId === undefined)
        return sendError(reply, HTTPResponses.UNAUTHORIZED, 'Invalid token')
    

    const doc = await getPackDoc(packId)
    if (doc === undefined)
        return sendError(reply, HTTPResponses.NOT_FOUND, `Pack with ID ${packId} was not found`)

    if(!(await doc.get('contributors')).includes(userId))
        return sendError(reply, HTTPResponses.FORBIDDEN, `You are not a contributor for ${packId}`)

    

    await doc.ref.set({data: packData}, {merge: true})
    return reply.status(HTTPResponses.OK).send('Updated data')
}

API_APP.route({
    method: 'PATCH',
    url: '/packs/:id',
    schema: {
        params: Type.Object({
            id: Type.String()
        }),
        querystring: Type.Object({
            token: Type.String()
        }),
        body: Type.Object({
            data: Type.Partial(Type.Object({
                ...PackDataSchema.properties,
                display: Type.Partial(PackDataSchema.properties.display)
            }))
        }, {})
    },
    handler: setPack
})

API_APP.route({
    method: 'PUT',
    url: '/packs/:id',
    schema: {
        params: Type.Object({
            id: Type.String()
        }),
        querystring: Type.Object({
            token: Type.String()
        }),
        body: Type.Object({
            data: PackDataSchema
        }, {})
    },
    handler: setPack
})



API_APP.route({
    method: 'DELETE',
    url: '/packs/:id',
    schema: {
        params: Type.Object({
            id: Type.String()
        }),
        querystring: Type.Object({
            token: Type.String()
        })
    },
    handler: async (response, reply) => {
        const { id: packId } = response.params;
        const { token } = response.query
        
        const userId = await getUIDFromToken(token)
        if(userId === undefined)
            return sendError(reply, HTTPResponses.UNAUTHORIZED, 'Invalid token')
        

        const doc = await getPackDoc(packId)
        if (doc === undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, `Pack with ID ${packId} was not found`)

        if((await doc.get('owner')) !== userId)
            return sendError(reply, HTTPResponses.FORBIDDEN, `You are not the owner of ${packId}`)

        await doc.ref.delete()
        return reply.status(HTTPResponses.OK).send('Deleted data')
    }
})

API_APP.route({
    method: 'POST',
    url: '/packs/:id/contributors',
    schema: {
        params: Type.Object({
            id: Type.String()
        }),
        querystring: Type.Object({
            token: Type.String(),
            contributors: Type.Array(Type.String())
        })
    },
    handler: async (response, reply) => {
        const { id: packId } = response.params;
        const { token, contributors } = response.query
        
        const userId = await getUIDFromToken(token)
        if(userId === undefined)
            return sendError(reply, HTTPResponses.UNAUTHORIZED, 'Invalid token')
        

        const doc = await getPackDoc(packId)
        if (doc === undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, `Pack with ID ${packId} was not found`)

        if((await doc.get('data.owner')) !== userId)
            return sendError(reply, HTTPResponses.FORBIDDEN, `You are not the owner of ${packId}`)

        const existingContributors: string[] = await doc.get('contributors')

        for(let c of contributors) 
            if(!existingContributors.includes(c))
                existingContributors.push(c)

        await doc.ref.set({contributors: existingContributors}, {merge: true})
        return reply.status(HTTPResponses.OK).send('Added contributors')
    }
})

API_APP.route({
    method: 'DELETE',
    url: '/packs/:id/contributors',
    schema: {
        params: Type.Object({
            id: Type.String()
        }),
        querystring: Type.Object({
            token: Type.String(),
            contributors: Type.Array(Type.String())
        })
    },
    handler: async (response, reply) => {
        const { id: packId } = response.params;
        const { token, contributors } = response.query
        
        const userId = await getUIDFromToken(token)
        if(userId === undefined)
            return sendError(reply, HTTPResponses.UNAUTHORIZED, 'Invalid token')
        

        const doc = await getPackDoc(packId)
        if (doc === undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, `Pack with ID ${packId} was not found`)

        if((await doc.get('data.owner')) !== userId)
            return sendError(reply, HTTPResponses.FORBIDDEN, `You are not the owner of ${packId}`)

        const existingContributors: string[] = await doc.get('contributors')

        await doc.ref.set({contributors: existingContributors.filter(v => !contributors.includes(v))
        }, {merge: true})
        return reply.status(HTTPResponses.OK).send('Deleted contributors')
    }
})

API_APP.route({
    method: 'GET',
    url: '/packs/:id/meta',
    schema: {
        params: Type.Object({
            id: Type.String()
        })
    },
    handler: async (request, reply) => {
        const { id } = request.params;

        
        const requestIdentifier = 'GET-PACK-META::' + id
        const tryCachedResult = await get(requestIdentifier)
        if(tryCachedResult && request.headers["cache-control"] !== 'no-cache') {
            return tryCachedResult.item
        }
        

        const doc = await getPackDoc(id)
        if (doc === undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, `Pack with ID ${id} was not found`)



        const data: PackMetaData = {
            docId: doc.id,
            rawId: await doc.get('id'),
            stats: await doc.get('stats'),
            owner: await doc.get('owner'),
            contributors: await doc.get('contributors')
        }

        await set(requestIdentifier, data, 10 * 60 * 1000)
        return data
    }
})

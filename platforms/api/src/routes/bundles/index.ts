import { Type } from '@sinclair/typebox'
import { API_APP, sendError } from '../../app.js'
import { getFirestore } from 'firebase-admin/firestore'
import { sanitize } from '../sanitize.js'
import { BundleSchema, HTTPResponses, PackBundle } from 'data-types'
import { getUIDFromToken } from 'database'

export async function getBundleDoc(id: string) {

    const firestore = getFirestore()
    const packs = firestore.collection('bundles')

    const doc = await packs.doc(id).get()
    if (doc.exists) {
        return doc
    }
    return undefined
}

API_APP.route({
    method: 'GET',
    url: '/bundles/:id',
    schema: {
        params: Type.Object({
            id: Type.String()
        }),
        querystring: Type.Object({
            token: Type.Optional(Type.String())
        })
    },
    handler: async (request, reply) => {
        const { id } = request.params
        const { token } = request.query

        const bundleDoc = await getBundleDoc(id)
        if (bundleDoc === undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, 'Bundle not found')

        return { uid: bundleDoc.id, ...bundleDoc.data() }
    }
})

API_APP.route({
    method: 'GET',
    url: '/bundles/:id/download',
    schema: {
        params: Type.Object({
            id: Type.String()
        }),
        querystring: Type.Object({
            token: Type.Optional(Type.String()),
            mode: Type.Union([Type.Literal('datapack'), Type.Literal('resourcepack'), Type.Literal('both')], { default: 'both' })
        })
    },
    handler: async (request, reply) => {
        const { id } = request.params
        const { token, mode } = request.query

        const bundleDoc = await getBundleDoc(id)
        if (bundleDoc === undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, 'Bundle not found')

        const bundleData = bundleDoc.data() as PackBundle

        const resp = await API_APP.inject(`/download?${bundleData.packs.map(p => `pack=${p.id}@${p.version}`).join('&')}&version=${bundleData.version}&mode=${mode}`)

        if (resp.statusCode !== HTTPResponses.OK)
            return sendError(reply, resp.statusCode, 'Error while downloading bundle, ' + resp.statusMessage);

        reply.header('Content-Disposition', `attachment; filename="${bundleData.name.replace(' ', '-')}.zip"`).type('application/octet-stream')
        return reply.status(HTTPResponses.OK).send(resp.rawPayload)

        return sendError(reply, HTTPResponses.FORBIDDEN, 'Bundle is not visible to your token')
    }
})

API_APP.route({
    method: 'DELETE',
    url: '/bundles/:id',
    schema: {
        params: Type.Object({
            id: Type.String()
        }),
        querystring: Type.Object({
            token: Type.String()
        })
    },
    handler: async (request, reply) => {
        const { id } = request.params
        const { token } = request.query

        const bundleDoc = await getBundleDoc(id)

        if (bundleDoc === undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, 'Bundle not found')

        const uid = await getUIDFromToken(token)
        if (uid === undefined)
            return sendError(reply, HTTPResponses.UNAUTHORIZED, 'Invalid token')

        const bundleData = bundleDoc.data() as PackBundle

        if (bundleData.owner !== uid)
            return sendError(reply, HTTPResponses.FORBIDDEN, 'Bundle is not owned by your token')

        await bundleDoc.ref.delete()
        reply.status(HTTPResponses.OK).send('Bundle deleted successfully')
    }
})

API_APP.route({
    method: 'PUT',
    url: '/bundles/:id',
    schema: {
        params: Type.Object({
            id: Type.String()
        }),
        querystring: Type.Object({
            token: Type.String(),
        }),
        body: Type.Object({
            data: Type.Omit(BundleSchema, ['owner'])
        })
    },
    handler: async (request, reply) => {
        const { id } = request.params
        const { token } = request.query
        const { data } = request.body
        const bundleDoc = await getBundleDoc(id)

        if (bundleDoc === undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, 'Bundle not found')

        const uid = await getUIDFromToken(token)
        if (uid === undefined)
            return sendError(reply, HTTPResponses.UNAUTHORIZED, 'Invalid token')

        const bundleData = bundleDoc.data() as PackBundle

        if (bundleData.owner !== uid)
            return sendError(reply, HTTPResponses.FORBIDDEN, 'Bundle is not owned by your token')

        if(data.uid)
            delete data.uid

        await bundleDoc.ref.set(data, { merge: true })
        reply.status(HTTPResponses.OK).send('Bundle updated successfully')
    }
})

API_APP.route({
    method: 'POST',
    url: '/bundles',
    schema: {
        querystring: Type.Object({
            token: Type.String(),
        }),
        body: Type.Object({
            data: Type.Omit(BundleSchema, ['owner'])
        })
    },
    handler: async (request, reply) => {
        const { data } = request.body
        const { token } = request.query



        const uid = await getUIDFromToken(token)

        if (uid === undefined)
            return sendError(reply, HTTPResponses.UNAUTHORIZED, 'Invalid token')

        const bundleData = data as PackBundle
        bundleData.owner = uid;

        const createdDoc = await getFirestore().collection('bundles').add(bundleData)
        reply.status(HTTPResponses.CREATED).send({uid: createdDoc.id})
    }
})

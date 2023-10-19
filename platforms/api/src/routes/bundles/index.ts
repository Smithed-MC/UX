import { Type } from '@sinclair/typebox'
import { API_APP, sendError } from '../../app.js'
import { getFirestore } from 'firebase-admin/firestore'
import { sanitize } from '../sanitize.js'
import { BundleSchema, HTTPResponses, PackBundle } from '@smithed-mc/data-types'
import { getUIDFromToken } from 'database'

export async function getBundleDoc(id: string) {

    const firestore = getFirestore()
    const packs = firestore.collection('bundles')

    console.log('Querying for bundle',id)
    const doc = await packs.doc(id).get()
    if (doc.exists) {
        return doc
    }
    return undefined
}

/*
 * @route GET /bundles/:id
 * Retrieve a bundle's data
 * 
 * @param id
 * The bundle's UID, unlike packs and users, bundles do not have a plaintext ID
 * 
 * @return OK: PackBundle
 * @return NOT_FOUND: ApiError
 *  
 * @example Retrieve a bundle
 * fetch('https://api.smithed.dev/v2/bundles/123456789')
 */
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

/*
 * @route GET /bundles/:id/download
 * Download a pack bundle. This route wraps `/download` and returns the same information.
 * 
 * @param id
 * The bundle's UID, unlike packs and users, bundles do not have a plaintext ID
 * 
 * @query mode: 'datapack' | 'resourcepack' | 'both' = 'both'
 * Which files should be downloaded from the API. 
 * 
 * @return OK: ArrayBuffer
 * @return NOT_FOUND: ApiError
 *  
 * @example Download a bundle's resourcepack
 * fetch('https://api.smithed.dev/v2/bundles/123456789/download?mode=resourcepack')
 */
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

/*
 * @route DELETE /bundles/:id
 * Delete a bundle from the database
 *  
 * @param id
 * The bundle's UID, unlike packs and users, bundles do not have a plaintext ID
 * 
 * @query token: string
 * Either Firebase Id Token or a valid PAT
 * 
 * @return OK: string
 * @return NOT_FOUND: ApiError
 * @return UNAUTHORIZED: ApiError
 * @return FORBIDDEN: ApiError
 *  
 * @example Delete a bundle
 * fetch('https://api.smithed.dev/v2/bundles/123456789?token=ILOVESMITHED', {method: 'DELETE'})
 */
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

/*
 * @route PUT /bundles/:id
 * Update an existing bundle
 *  
 * @param id
 * The bundle's UID, unlike packs and users, bundles do not have a plaintext ID
 * 
 * @query token: string
 * Either Firebase Id Token or a valid PAT
 * 
 * @body data: PackBundle
 * The data to replace the existing with, omitting the `owner` field.
 * 
 * @return OK: string
 * @return NOT_FOUND: ApiError
 * @return UNAUTHORIZED: ApiError
 * @return FORBIDDEN: ApiError
 *  
 * @example Update a bundle
 * fetch('https://api.smithed.dev/v2/bundles/123456789', {
 *   method: 'PUT',
 *   body: {
 *      data: <PackBundle> 
 *   },
 *   headers: {
 *      "Content-Type": "application/json"
 *   }
 * })
 */
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

/*
 * @route POST /bundles
 * Update an existing bundle
 * 
 * @query token: string
 * Either Firebase Id Token or a valid PAT
 * 
 * @body data: PackBundle
 * The data to replace the existing with, omitting the `owner` field.
 * 
 * @return CREATED: string
 * @return UNAUTHORIZED: ApiError
 *  
 * @example Upload a new bundle
 * fetch('https://api.smithed.dev/v2/bundles', {
 *   method: 'PUT',
 *   body: {
 *      data: <PackBundle> 
 *   },
 *   headers: {
 *      "Content-Type": "application/json"
 *   }
 * })
 */
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

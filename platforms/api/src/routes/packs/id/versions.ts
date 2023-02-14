import { Type } from "@sinclair/typebox";
import { API_APP, sendError } from "../../../app.js";
import { HTTPResponses, PackVersion, PackVersionSchema } from "data-types";
import { coerce, compare } from "semver";
import { getPackDoc, getUIDFromToken } from "database";

API_APP.route({
    method: 'GET',
    url: '/packs/:id/versions',
    schema: {
        params: Type.Object({
            id: Type.String()
        })
    },
    handler: async (response, reply) => {
        const { id } = response.params
        const doc = await getPackDoc(id)

        if (doc === undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, `Pack with ID ${id} was not found`)

        return await doc.get('data.versions')
    }
})

API_APP.route({
    method: 'POST',
    url: '/packs/:id/versions',
    schema: {
        params: Type.Object({
            id: Type.String()
        }),
        querystring: Type.Object({
            version: Type.String(),
            token: Type.String()
        }),
        body: Type.Object({
            data: PackVersionSchema
        })
    },
    handler: async (response, reply) => {
        const {id: packId} = response.params
        const {version: versionId, token} = response.query
        const {data: versionData} = response.body

        if(coerce(versionId) == null)
            return sendError(reply, HTTPResponses.BAD_REQUEST, 'Version ID is not valid semver. Reference: https://semver.org')

        const userId = await getUIDFromToken(token)
        if(userId === undefined)
            return sendError(reply, HTTPResponses.UNAUTHORIZED, 'Invalid token')

        const doc = await getPackDoc(packId)
        if(doc === undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, `Pack with ID ${packId} was not found`)

        if(!(await doc.get('contributors')).includes(userId))
            return sendError(reply, HTTPResponses.FORBIDDEN, `You are not a contributor for ${packId}`)

        const versions: PackVersion[] = await doc.get('data.versions')

        if(versions.find(v => v.name === versionId))
            return sendError(reply, HTTPResponses.CONFLICT, `Version with ID ${versionId} already exists`)

        versions.push(versionData)

        await doc.ref.set({
            data: {
                versions: versions
            }
        }, {merge: true})

        return reply.status(HTTPResponses.CREATED).send(`Version ${versionId} successfully created`)
    }
})

API_APP.route({
    method: 'PATCH',
    url: '/packs/:packId/versions/:versionId',
    schema: {
        params: Type.Object({
            packId: Type.String(),
            versionId: Type.String()
        }),
        querystring: Type.Object({
            token: Type.String()
        }),
        body: Type.Object({
            data: PackVersionSchema
        })
    },
    handler: async (response, reply) => {
        const {packId, versionId} = response.params
        const {token} = response.query
        const {data: versionData} = response.body

        if(coerce(versionId) == null)
            return sendError(reply, HTTPResponses.BAD_REQUEST, 'Version ID is not valid semver. Reference: https://semver.org')

        const userId = await getUIDFromToken(token)
        if(userId === undefined)
            return sendError(reply, HTTPResponses.UNAUTHORIZED, 'Invalid token')

        const doc = await getPackDoc(packId)
        if(doc === undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, `Pack with ID ${packId} was not found`)

        if(!(await doc.get('contributors')).includes(userId))
            return sendError(reply, HTTPResponses.FORBIDDEN, `You are not a contributor for ${packId}`)

        const versions: PackVersion[] = await doc.get('data.versions')

        const versionIndex = versions.findIndex(v => v.name === versionId)
        if(versionIndex === -1)
            return sendError(reply, HTTPResponses.CONFLICT, `Version with ID ${versionId} already exists`)

        versions[versionIndex] = versionData

        await doc.ref.set({
            data: {
                versions: versions
            }
        }, {merge: true})

        return reply.status(HTTPResponses.CREATED).send(`Version ${versionId} successfully updated`)
    }
})


API_APP.route({
    method: 'DELETE',
    url: '/packs/:packId/versions/:versionId',
    schema: {
        params: Type.Object({
            packId: Type.String(),
            versionId: Type.String()
        }),
        querystring: Type.Object({
            token: Type.String()
        })
    },
    handler: async (response, reply) => {
        const {packId, versionId} = response.params
        const {token} = response.query
        
        if(coerce(versionId) == null)
            return sendError(reply, HTTPResponses.BAD_REQUEST, 'Version ID is not valid semver. Reference: https://semver.org')

        const userId = await getUIDFromToken(token)
        if(userId === undefined)
            return sendError(reply, HTTPResponses.UNAUTHORIZED, 'Invalid token')

        const doc = await getPackDoc(packId)
        if(doc === undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, `Pack with ID ${packId} was not found`)

        if(!(await doc.get('contributors')).includes(userId))
            return sendError(reply, HTTPResponses.FORBIDDEN, `You are not a contributor for ${packId}`)

        const versions: PackVersion[] = await doc.get('data.versions')

        const versionIndex = versions.findIndex(v => v.name === versionId)
        if(versionIndex === -1)
            return sendError(reply, HTTPResponses.CONFLICT, `Version with ID ${versionId} already exists`)

        versions.splice(versionIndex, 1)

        await doc.ref.set({
            data: {
                versions: versions
            }
        }, {merge: true})

        return reply.status(HTTPResponses.CREATED).send(`Version ${versionId} successfully deleted`)
    }
})



API_APP.route({
    method: 'GET',
    url: '/packs/:id/versions/latest',
    schema: {
        params: Type.Object({
            id: Type.String()
        })
    },
    handler: async (response, reply) => {
        const {id} = response.params

        const doc = await getPackDoc(id)
        if(doc === undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, `Pack with ID ${id} was not found`)

        const versions: PackVersion[] = await doc.get('data.versions')

        const latestVersion = versions.sort((a,b) => compare(a.name, b.name)).reverse()[0]

        return latestVersion
    }
})
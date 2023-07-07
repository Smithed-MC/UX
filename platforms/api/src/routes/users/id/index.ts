import { Type } from '@sinclair/typebox'
import { API_APP, get, sendError, set } from '../../../app.js'
import { getFirestore } from 'firebase-admin/firestore'
import { sanitize } from '../../sanitize.js'
import { HTTPResponses, UserData } from 'data-types'
import { getUIDFromToken } from 'database'
import { getAuth } from 'firebase-admin/auth'
import { useId } from 'react'

export async function getUserDoc(id: string) {

    const firestore = getFirestore()
    const packs = firestore.collection('users')

    console.log('Querying for user', id)
    const doc = await packs.doc(id).get()
    if (doc.exists) {
        return doc
    }
    const query = await packs.where('cleanName', '==', sanitize(id)).limit(1).get()

    if (query.docs.length == 0)
        return undefined

    return query.docs[0]
}


/*
 * @route GET /users/:id 
 * Retrieve a specific users information
 * 
 * @param id
 * The user's UID or plaintext username. Using UID is more performant as it is a direct lookup.
 *
 * @return OK: {uid: string, cleanName: string, displayName: string, role: string}
 * @return NOT_FOUND: ApiError
 * 
 * @example Fetch a user's data
 * fetch('https://api.smithed.dev/v2/users/TheNuclearNexus')
 */
API_APP.route({
    method: 'GET',
    url: '/users/:id',
    schema: {
        params: Type.Object({
            id: Type.String()
        })
    },
    handler: async (request, reply) => {
        const {id} = request.params

        const requestIdentifier = 'GET-USER::' + id
        const tryCachedResult = await get(requestIdentifier)
        if(tryCachedResult && request.headers["cache-control"] !== 'max-age=0') {
            console.log('served cached /users/', id)
            return tryCachedResult.item
        }

        const userDoc = await getUserDoc(id)

        if(userDoc === undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, 'User not found')

        const data = {uid: userDoc.id, creationTime: new Date((await getAuth().getUser(userDoc.id)).metadata.creationTime ?? 0).getSeconds(), ...userDoc.data()}
        await set(requestIdentifier, data, 60*60*1000)
        return data
    }
})

/*
 * Not documented since is mainly just for interal use
 */
API_APP.route({
    method: 'GET',
    url: '/users/:id/setup',
    schema: {
        params: Type.Object({
            id: Type.String()
        }),
        querystring: Type.Object({
            token: Type.String(),
            displayName: Type.String()
        })
    },
    handler: async (request, reply) => {
        const {id} = request.params
        const {token, displayName} = request.query

        const userDoc = await getUserDoc(id)

        const uidFromToken = await getUIDFromToken(token)

        if(userDoc !== undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, 'User has been setup previously')
        else if(uidFromToken === undefined)
            return sendError(reply, HTTPResponses.UNAUTHORIZED, 'Invalid token')
        else if (id !== uidFromToken)
            return sendError(reply, HTTPResponses.FORBIDDEN, 'Specified user does not belong to token')
        else if(await getUserDoc(displayName) !== undefined)
            return sendError(reply, HTTPResponses.CONFLICT, 'User with that display name exists!')


        await getFirestore().collection("users").doc(uidFromToken).set({
            displayName: displayName,
            cleanName: sanitize(displayName),
            role: 'member'
        })
        return reply.status(HTTPResponses.CREATED).send('User account was successfully setup')
    }
})

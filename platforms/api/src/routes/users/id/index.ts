import { Type } from '@sinclair/typebox'
import { API_APP, sendError } from '../../../app.js'
import { getFirestore } from 'firebase-admin/firestore'
import { sanitize } from '../../sanitize.js'
import { HTTPResponses } from 'data-types'

export async function getUserDoc(id: string) {

    const firestore = getFirestore()
    const packs = firestore.collection('users')

    const doc = await packs.doc(id).get()
    if (doc.exists) {
        return doc
    }
    const query = await packs.where('cleanName', '==', sanitize(id)).limit(1).get()

    if (query.docs.length == 0)
        return undefined

    return query.docs[0]
}

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

        const userDoc = await getUserDoc(id)

        if(userDoc === undefined)
            return sendError(reply, HTTPResponses.NOT_FOUND, 'User not found')
        return {uid: userDoc.id, ...userDoc.data()}
    }
})

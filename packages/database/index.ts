import * as fs from 'fs';
import {cert, initializeApp} from 'firebase-admin/app'
import {getAuth} from 'firebase-admin/auth'
import {getFirestore} from 'firebase-admin/firestore'

import { ServiceAccount } from 'firebase-admin/lib/app/credential';
import * as jose from 'jose'

let privateKey: jose.KeyLike
export async function initialize() {
    const serviceAccount = typeof process.env.ADMIN_CERT === 'string' ? JSON.parse(fs.readFileSync(process.env.ADMIN_CERT, {encoding: 'utf-8'})) : process.env.ADMIN_CERT;
    
    if(serviceAccount.private_key === undefined)
        throw new Error('Service account does not have a defined private key!')


    // Configure our JWT library to use the firbase private key to sign tokens
    // Ensures that further down the line, the data stored in the token is reserved
    // to Smithed usage.
    privateKey = await jose.importPKCS8(serviceAccount.private_key, 'RS256')

    const firebaseConfig = {
        credential: cert(serviceAccount),
        databaseURL: "https://mc-smithed-default-rtdb.firebaseio.com",
        apiKey: "AIzaSyDX-vLCBhO8StKAxnpvQ2EW8lz3kzYn4Qk",
        authDomain: "mc-smithed.firebaseapp.com",
        projectId: "mc-smithed",
        storageBucket: "mc-smithed.appspot.com",
        messagingSenderId: "574184244682",
        appId: "1:574184244682:web:498d168c09b39e4f0d7b33",
        measurementId: "G-40SRKC35Z0"
    };
    initializeApp(firebaseConfig)
    getAuth()
}

export async function getUIDFromToken(token: string) {
    const auth = getAuth()

    // Since tokens are passed as strings, we need to try to resolve
    // Firebase ID tokens and then check for custom JWT's if that fails
    try {
        const result = await auth.verifyIdToken(token)
        return result.uid
    } catch {
        try {
            const result = await jose.jwtVerify(token, privateKey)

            // Manually check the expiration date against the current system time
            // This allows for tokens of lifetime greater than one hour.
            if ((Date.now() / 1000) < (result.payload.exp ?? 0))
                return result.protectedHeader.uid as string
        } catch {
            return undefined;
        }
    }
}

export async function getPackDoc(id: string) {

    const firestore = getFirestore()
    const packs = firestore.collection('packs')

    const doc = await packs.doc(id).get()
    if (doc.exists) {
        return doc
    }
    const query = await packs.where('id', '==', id).limit(1).get()

    if (query.docs.length == 0)
        return undefined

    return query.docs[0]
}
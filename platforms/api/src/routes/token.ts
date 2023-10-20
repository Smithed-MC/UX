import { Type } from "@sinclair/typebox";
import { API_APP, REDIS, get, sendError, set } from "../app.js";
import { CollectedPack, DownloadRunner, collectPacks, incrementPackDownloadCount } from 'downloader'
import { HTTPResponses, MinecraftVersionSchema, latestMinecraftVersion } from 'data-types';
import hash from 'hash.js'
import * as fs from 'fs'
import fetch from "node-fetch";
import { getAuth } from "firebase-admin/auth";
import * as jose from 'jose'
import { ServiceAccount } from "firebase-admin";
import { privateKey, serviceAccount } from 'database'
/*
 * @route GET /token 
 * This route allows the creation of a PAT
 * 
 * @query token: string
 * Specifically a Firebase ID Token, not another PAT
 * @query expires: string|int?
 * How long should the token be valid for, in the form `<num><h|>
 * 
 * @query mode: 'datapack'|'resourcepack'|'both' = 'both'
 * What should be downloaded, if both is specified then the datapack and resourcepack are served zipped within the download.
 * 
 * @return OK: string
 * @return SERVER_ERROR: ApiError
 * 
 * @example Get a 1 day token
 * fetch('https://api.smithed.dev/v2/token?token=<ID Token Here>&expires=1d)
 */
API_APP.route({
    method: 'GET',
    url: '/token',
    schema: {
        querystring: Type.Object({
            token: Type.String(),
            expires: Type.Union([Type.Integer(), Type.String()], { default: '1h' })
        })
    },
    handler: async (req, res) => {
        const { token, expires } = req.query

        try {
            var uid = (await getAuth().verifyIdToken(token)).uid
        } catch {
            return sendError(res, HTTPResponses.BAD_REQUEST, 'Invalid token, ensure it is a Firebase token and not a PAT')
        }

        // const db = await getDatabase()
        // const tokenIdentifier = await (async () => {
        //     let token = v4()
        //     while ((await db.ref(`tokens/${token}`).get()).exists()) {
        //         token = v4()
        //     }
        //     return token
        // })()


        try {
            const jwt = await new jose.SignJWT({})
                .setProtectedHeader({ alg: 'RS256', uid: uid })
                .setIssuer(serviceAccount.client_email)
                .setSubject(serviceAccount.client_email)
                .setAudience("https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit")
                .setExpirationTime(expires !== undefined ? expires as string : '1h')
                .setIssuedAt(Math.round(Date.now() / 1000))
                .sign(privateKey)

            res.status(200).send(jwt)
        } catch (e) {
            res.status(500).send((e as Error).message)
        }

    }
})

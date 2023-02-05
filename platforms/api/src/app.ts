import { initialize } from "database";

import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fastify, { FastifyReply } from "fastify";
import fastifyCaching from '@fastify/caching'
import fastifyRedis from '@fastify/redis'
import fastifyCors from '@fastify/cors'

import * as fs from 'fs';
import { HTTPResponses } from "data-types";
import abCache from 'abstract-cache'
import IORedis from 'ioredis'


export const API_APP = fastify().withTypeProvider<TypeBoxTypeProvider>();

export function sendError(reply: FastifyReply, code: HTTPResponses, message: string) {
    reply.status(code).send({ statusCode: code, error: HTTPResponses[code], message: message })
}

export async function importRoutes(dirPath: string) {
    let files = fs.readdirSync('src/' + dirPath)

    for (let file of files) {
        if (fs.statSync('src/' + dirPath + "/" + file).isDirectory()) {
            await importRoutes(dirPath + "/" + file)
        } else {
            const parts = file.split('.')

            const ext = parts[parts.length - 1]
            console.log("./" + dirPath + "/" + file)
            if (ext === 'js' || ext === 'ts')
                await import("./" + dirPath + "/" + file)
        }
    }
}


export let REDIS: IORedis|undefined = undefined

async function registerCacheRedis() {
    const redis = new IORedis({ host: '127.0.0.1' })
    REDIS = redis

    const abcache = abCache({
        useAwait: true,
        driver: {
            name: 'abstract-cache-redis', // must be installed via `npm i`
            options: { client: redis }
        }
    })

    await API_APP.register(
        fastifyRedis,
        { client: redis }
    )

    await API_APP.register(
        fastifyCaching,
        { privacy: fastifyCaching.privacy.NOCACHE, cache: abcache }
    )
}

async function registerCacheMemory() {
    const abcache = abCache({
        useAwait: false,
        driver: {
            name: undefined, // must be installed via `npm i`
            options: undefined
        }
    })

    await API_APP.register(
        fastifyCaching,
        { privacy: fastifyCaching.privacy.NOCACHE, cache: abcache }
    )
}

export async function setupApp() {
    await initialize()

    if (process.env.REDIS) {

    }

    if (process.env.REDIS !== 'false')
        await registerCacheRedis()
    else
        await registerCacheMemory()


    await API_APP.register(fastifyCors, {
        origin: '*',
        allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept',
        methods: '*'
    })

    await importRoutes('routes')

    return API_APP;
}

export async function get(key: string): Promise<{item: any, stored: number, tll: number}|undefined> {
    return new Promise((resolve, reject) => {
        API_APP.cache.get(key, (error, result) => {
            if(error) return resolve(undefined)
            return resolve(result as {item: any, stored: number, tll: number})
        })
    })
}

export async function set(key: string, data: any, expires: number): Promise<void> {
    return new Promise((resolve, reject) => {
        API_APP.cache.set(key, data, expires, (error) => {
            if(error) return reject(error)
            return resolve()
        })
    })
}
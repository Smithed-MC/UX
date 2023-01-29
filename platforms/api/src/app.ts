import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { initialize } from "database";
import fastify from "fastify";
import * as fs from 'fs';
import cors from '@fastify/cors'

export const API_APP = fastify().withTypeProvider<TypeBoxTypeProvider>();


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

export async function setupApp() {
    await initialize()

    await API_APP.register(cors, {
        origin: '*',
        allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept',
        methods: '*'
    })

    await importRoutes('routes')

    return API_APP;
}
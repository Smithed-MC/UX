import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { initialize } from "database";
import fastify from "fastify";
import * as fs from 'fs';

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
    await importRoutes('routes')

    API_APP.addHook("onResponse", (response) => {
        response.headers['Access-Control-Allow-Origin'] = '*';
        response.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept'
        response.headers['Access-Control-Allow-Methods'] = '*'
    })

    return API_APP;
}
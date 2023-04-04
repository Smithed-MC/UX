import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import { createServer as createViteServer } from 'vite'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function getMetadata(url='') {
    if(url === '/') {
        return {
            title: 'Smithed',
            description: 'Datapacks: the community, the tooling; all bundled into the perfect package.',
            image: 'https://beta.smithed.dev/icon.png'
        }
    }
    if(url.match(/packs\/.+/g)) {
        const packId = url.split('/')[2]

        const resp = await fetch('https://api.smithed.dev/v2/packs/' + packId)
        if(!resp.ok)
            return undefined;
        const data = await resp.json();

        return {
            siteName: 'Smithed',
            title: data.display.name,
            description: data.display.description,
            image: data.display.icon ?? undefined
        }
    } else if (url.match(/bundles\/.+/g)) {
        const bundleId = url.split('/')[2]

        const resp = await fetch('https://api.smithed.dev/v2/bundles/' + bundleId)
        if(!resp.ok)
            return undefined;
        const data = await resp.json();

        return {
            siteName: 'Smithed Bundle',
            title: data.name
        }
    }
    
} 

const handleMetadata = async (req, res) => {
    const url = req.originalUrl
    try {
        // 1. Read index.html
        let template = fs.readFileSync(
            path.resolve(__dirname, 'index.html'),
            'utf-8',
        )

        const metaData = await getMetadata(url)
        console.log(metaData)

        let index = fs.readFileSync(path.join(__dirname, 'dist', 'index.html'), {encoding: 'utf-8'})
        
        index = index
            .replace('__OGSITENAME__', metaData?.siteName ?? '')
            .replace('__DESCRIPTION__', metaData?.description ?? '')
            .replace('__TITLE__', metaData?.title ?? '')
            .replace('__IMAGE__', metaData?.image ?? '')
        // 6. Send the rendered HTML back.
        res.status(200).set({ 'Content-Type': 'text/html' }).end(index)
    } catch (e) {
        console.error(e)
        res.status(500).end(JSON.stringify(e))
    }
}

async function createServer() {
    const app = express()

    // Create Vite server in middleware mode and configure the app type as
    // 'custom', disabling Vite's own HTML serving logic so parent server
    // can take control
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'custom'
    })

    // Use vite's connect instance as middleware. If you use your own
    // express router (express.Router()), you should use router.use
    app.use(vite.middlewares)
    
    app.get('/', handleMetadata)
    app.use(express.static(path.resolve(process.cwd(), "dist")))
    app.get('*', handleMetadata)


    app.listen(process.env.PORT)
}

createServer()

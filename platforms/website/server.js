import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import { createServer as createViteServer } from 'vite'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import {generateSitemap} from './generate-sitemap.js'
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function getMetadata(url = '') {
    if (url === '/') {
        return {
            title: 'Smithed',
            description: 'Datapacks: the community, the tooling; all bundled into the perfect package.',
            image: 'https://beta.smithed.dev/icon.png'
        }
    }
    if (url.match(/packs\/.+/g)) {
        const packId = url.split('/')[2]

        const resp = await fetch('https://api.smithed.dev/v2/packs/' + packId)
        if (!resp.ok)
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
        if (!resp.ok)
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

        let index = fs.readFileSync(path.join(__dirname, 'dist', 'index.html'), { encoding: 'utf-8' })

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

const distFolder = "dist/client"

const isProd = process.env.NODE_ENV === 'production'


globalThis.fetch = fetch

async function createServer() {
    await generateSitemap(distFolder)

    const app = express()

    let vite
    if (!isProd) {
        // Create Vite server in middleware mode and configure the app type as
        // 'custom', disabling Vite's own HTML serving logic so parent server
        // can take control
        vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'custom'
        })

        // Use vite's connect instance as middleware. If you use your own
        // express router (express.Router()), you should use router.use
        app.use(vite.middlewares)
    } else {
        app.get('/sitemap.xml', (req, res) => {
            res.setHeader("Content-Type", "text/xml")
            res.send(fs.readFileSync(path.resolve(distFolder, "sitemap.xml")))
        })
        app.use(express.static(distFolder))
    }
    

    app.use('*', async (req, res, next) => {
        const url = req.originalUrl
        try {
            let template, render

            if (!isProd) {
                template = fs.readFileSync(
                    path.resolve(__dirname, 'index.html'),
                    'utf-8',
                )

                template = await vite.transformIndexHtml(url, template)

                render = (await vite.ssrLoadModule('/src/entry-server.tsx')).default
            } else {
                template = fs.readFileSync(
                    path.resolve(distFolder, 'index.html'),
                    'utf-8'
                )

                const files = fs.readdirSync(distFolder + '/assets')

                // const links = files.filter(f => f.endsWith('.css')).map(f => `<link rel="stylesheet" href="${distFolder}/assets/${f}"/>`)

                // template = template.replace('<!--link-css-->', links.join('\n'))

                render = (await import('./dist/server/entry-server.js')).default
            }
            // console.log(template)
            const parts = template.split('<!--ssr-outlet-->');

            // 3. Load the server entry. ssrLoadModule automatically transforms
            //    ESM source code to be usable in Node.js! There is no bundling
            //    required, and provides efficient invalidation similar to HMR.

            // const stream = await render(req, {
            //     onShellReady() {
            //         res.write(parts[0]);
            //         stream.pipe(res);
            //     },
            //     onAllReady() {
            //         res.write(parts[1])
            //         res.end();
            //     },
            // });

            // // 4. render the app HTML. This assumes entry-server.js's exported
            // //     `render` function calls appropriate framework SSR APIs,
            // //    e.g. ReactDOMServer.renderToString()
            const {html: appHtml, helmet} = await render(req, {})

            // // 5. Inject the app-rendered HTML into the template.
            const html = template
                .replace(`<!--ssr-outlet-->`, appHtml)
                .replace(`<!--helmet-title-outlet-->`, helmet.title.toString())
                .replace(`<!--helmet-meta-outlet-->`, helmet.meta.toString())
                .replace(`<!--helmet-link-outlet-->`, helmet.link.toString())
            
            // // 6. Send the rendered HTML back.
            res.status(200).set({ 'Content-Type': 'text/html' }).end(html)

        } catch (e) {
            // If an error is caught, let Vite fix the stack trace so it maps back
            // to your actual source code.
            if(!isProd)
                vite.ssrFixStacktrace(e)
            next(e)
        }
    })

    app.listen(process.env.PORT)
}

createServer()
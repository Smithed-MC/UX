import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import express from "express"
import { createServer as createViteServer } from "vite"
import fetch from "node-fetch"
import dotenv from "dotenv"
import { generateSitemap } from "./generate-sitemap.js"
import compression from "compression"

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const distFolder = "dist/client"
const isProd =
	process.env.NODE_ENV === "production" ||
	process.env.SERVER_ENV === "production"
const sitemap = isProd ? await generateSitemap(distFolder) : ""

console.log("Is server production?", isProd)
console.log("Running on port:", process.env.PORT)
globalThis.fetch = fetch

async function createServer() {
	const TEMPLATE = isProd
		? fs.readFileSync(path.resolve(distFolder, "index.html"), "utf-8")
		: ""
	const RENDERER = isProd
		? (await import("./dist/server/entry-server.js")).default
		: undefined

	const app = express()
	app.use(compression())

	let vite
	if (!isProd) {
		// Create Vite server in middleware mode and configure the app type as
		// 'custom', disabling Vite's own HTML serving logic so parent server
		// can take control
		vite = await createViteServer({
			server: { middlewareMode: true },
			appType: "custom",
		})

		// Use vite's connect instance as middleware. If you use your own
		// express router (express.Router()), you should use router.use
		app.use(vite.middlewares)
	} else {
		app.get("/sitemap.xml", (req, res, next) => {
			console.log(req.baseUrl, req.originalUrl, req.url, req.hostname)

			res.setHeader("Content-Type", "application/xml")
			res.send(sitemap.replace(/%s/g, req.header("host")))
		})
		app.use(express.static(distFolder, { index: false }))
	}

	app.use("*", async (req, res, next) => {
		const url = req.originalUrl

		// console.log('URL is', url)
		const lastElement = url.split("/").at(-1)
		// console.log('Last Element is', lastElement)
		if (lastElement.substring(0, lastElement.indexOf("?")).includes("."))
			return next()

		try {
			let template, render

			if (!isProd) {
				template = fs.readFileSync(
					path.resolve(__dirname, "index.html"),
					"utf-8"
				)

				template = await vite.transformIndexHtml(url, template)
				render = (await vite.ssrLoadModule("/src/entry-server.tsx"))
					.default
			} else {
				template = TEMPLATE
				render = RENDERER
			}

			// console.time('Render content')
			// // 4. render the app HTML. This assumes entry-server.js's exported
			// //     `render` function calls appropriate framework SSR APIs,
			// //    e.g. ReactDOMServer.renderToString()
			const result = await render(req, res, {})
			if (result == undefined) return next()
			const { html: appHtml, helmet } = result
			// console.timeEnd('Render content')
			// console.time('Replace w/ helmet and ssr')
			// // 5. Inject the app-rendered HTML into the template.
			const html = template
				.replace(`<!--helmet-title-outlet-->`, helmet.title.toString())
				.replace(`<!--helmet-meta-outlet-->`, helmet.meta.toString())
				.replace(`<!--helmet-link-outlet-->`, helmet.link.toString())
				.replace(`<!--ssr-outlet-->`, appHtml)
			// console.timeEnd('Replace w/ helmet and ssr')

			// // 6. Send the rendered HTML back.
			res.status(200).set({ "Content-Type": "text/html" }).end(html)
		} catch (e) {
			// If an error is caught, let Vite fix the stack trace so it maps back
			// to your actual source code.
			if (!isProd) vite.ssrFixStacktrace(e)
			next(e)
		}
	})

	app.listen(process.env.PORT)
}

createServer()

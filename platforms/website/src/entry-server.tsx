import { routes, subRoutes } from "client"
import ReactDOMServer from "react-dom/server"
import "./index.css"
import {
	StaticRouterProvider,
	createStaticHandler,
	createStaticRouter,
	StaticHandlerContext
} from "react-router-dom/server"
import { Request as ExpressRequest, Response as ExpressResponse } from "express"
import { Headers, Request } from "node-fetch"
import { Helmet } from "react-helmet"
import React from "react"
import { HTTPResponses } from "data-types"

function createFetchRequest(req: ExpressRequest) {
	let origin = `${req.protocol}://${req.get("host")}`
	// Note: This had to take originalUrl into account for presumably vite's proxying
	let url = new URL(req.originalUrl || req.url, origin)

	let controller = new AbortController()
	req.on("close", () => controller.abort())

	let headers = new Headers()

	for (let [key, values] of Object.entries(req.headers)) {
		if (values) {
			if (Array.isArray(values)) {
				for (let value of values) {
					headers.append(key, value)
				}
			} else {
				headers.set(key, values)
			}
		}
	}

	let init: any = {
		method: req.method,
		headers,
		signal: controller.signal,
	}

	if (req.method !== "GET" && req.method !== "HEAD") {
		init.body = req.body
	}

	return new Request(url.href, init)
}

let handler = createStaticHandler(routes)

export default async function render(
	req: ExpressRequest,
	res: ExpressResponse,
	options: ReactDOMServer.RenderToPipeableStreamOptions
) {

	let fetchRequest = createFetchRequest(req)
	let context: any = await handler.query(fetchRequest as any)

	if (
		context instanceof Response &&
		[301, 302, 303, 307, 308].includes(context.status)
	) {
		return res.redirect(context.status, context.headers.get("Location")!)
	}

	if (!(context instanceof Response) && context.statusCode == HTTPResponses.NOT_FOUND) {
		res.status(HTTPResponses.NOT_FOUND);
	}

	let router = createStaticRouter(handler.dataRoutes, context)
	let html = ReactDOMServer.renderToString(
		<StaticRouterProvider router={router} context={context} />
	)
	const helmet = Helmet.renderStatic()

	return { html, helmet }
}

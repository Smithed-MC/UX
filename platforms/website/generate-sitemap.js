import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import express from "express"
import { createServer as createViteServer } from "vite"
import fetch from "node-fetch"
import dotenv from "dotenv"

export async function generateSitemap(folder) {
	const packs = await (
		await fetch("https://api.smithed.dev/v2/packs?limit=100")
	).json()
	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${packs
	.map(
		(p) => `
    <url> 
       <loc>https://%s/packs/${p.id}</loc>
    </url>`
	)
	.join("\n")}

    <url>
        <loc>https://%s/</loc>
    </url>
    <url>
        <loc>https://%s/browse</loc>
    </url>
</urlset>`

	return sitemap
}

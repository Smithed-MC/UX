import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import { createServer as createViteServer } from 'vite'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

export async function generateSitemap(folder) {
    const packs = await (await fetch('https://api.smithed.dev/v2/packs?limit=100')).json()

    const sitemap = 
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${packs.map(p => `
    <url> 
       <loc>https://beta.smithed.dev/packs/${p.id}</loc>
    </url>`).join('\n')
}

    <url>
        <loc>https://beta.smithed.dev/</loc>
    </url>
    <url>
        <loc>https://beta.smithed.dev/browse</loc>
    </url>
</urlset>`

    fs.writeFileSync(path.resolve(folder, 'sitemap.xml'), sitemap)
}
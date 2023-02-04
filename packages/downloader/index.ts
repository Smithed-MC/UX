import * as fs from 'fs'
import { PythonShell } from 'python-shell'
import fetch from 'node-fetch'
import semver from 'semver'

import { MinecraftVersion, PackData, PackVersion } from 'data-types'
import { getFirestore } from 'firebase-admin/firestore'
import { getPackDoc } from 'database'
import { RUNNER } from './runner.js'

if (!fs.existsSync('temp'))
    fs.mkdirSync('temp')

export class DownloadRunner {
    id: string
    constructor() {
        this.id = Date.now().toString()
    }

    private runWeld(mode: string) {
        return new Promise<void>((resolve, reject) => {
            const python = PythonShell.runString(RUNNER, { mode: 'text', args: [this.id, mode], pythonOptions: ['-u'] }, () => { })
            python.on('error', (error) => { console.error(error); reject(error) })
            python.on('pythonError', (error) => { console.error(error); reject(error) })
            python.on('message', (c) => console.log(c))
            python.on('close', () => { resolve() })
        })
    }

    private async downloadPacks(packs: string[], version: MinecraftVersion) {
        for (let pack of packs) {
            await this.processPack(pack, version)
        }
    }

    private async tryToDownload(filename: string, url: string) {
        if(fs.existsSync(filename))
            return;

        const resp = await fetch(url)

        if (!resp.ok)
            return console.log('Failed to download', filename)

        fs.writeFileSync(`temp/${this.id}/${filename}.zip`, Buffer.from(await resp.arrayBuffer()))
    }

    private async processPack(pack: string, gameVersion: MinecraftVersion) {
        const [packId, packVersion] = pack.split('@')
        const packDoc = await getPackDoc(packId)

        if (packDoc === undefined)
            return console.log('Unknown pack', packId);

        const packVersions: PackVersion[] = packDoc.get('data.versions')

        const filteredVersions = packVersions
            .filter((v) =>                                  // Filter out all packs that don't satisfy the supplied pack 
                semver.satisfies(v.name, packVersion ?? '*', { includePrerelease: true }) &&    // version and that don't support the supplied game version
                v.supports.includes(gameVersion)
            )
            .sort((a, b) => semver.compare(a.name, b.name)) // Sort and reverse to the latest version is at index 0
            .reverse()                                      // If an exact value was specified, only one version will be left after
        // the initial filtering

        const version = filteredVersions[0]
        if (version === undefined)
            return console.log('No version statisfies', packVersion ?? '*', 'or no version supports', gameVersion, 'for pack', packId);

        for (const d of version.dependencies ?? []) {
            await this.processPack(d.id + '@' + d.version, gameVersion)
        }

        if (version.downloads.datapack !== undefined && version.downloads.datapack !== '') {
            await this.tryToDownload(packDoc.id + version.name + '-dp', version.downloads.datapack)
        }
        if (version.downloads.resourcepack !== undefined && version.downloads.resourcepack !== '') {
            await this.tryToDownload(packDoc.id + version.name + '-rp', version.downloads.resourcepack)
        }
    }

    async run(packs: string[], version: MinecraftVersion, mode: 'datapack' | 'resourcepack' | 'both') {
        const path = 'temp/' + this.id
        fs.mkdirSync(path);
        await this.downloadPacks(packs, version)
        await this.runWeld(mode)

        let datapack: Buffer | undefined = undefined
        let resourcepack: Buffer | undefined = undefined
        if (mode === 'datapack' && fs.existsSync(path + '/welded-dp.zip')) {
            return fs.readFileSync(path + '/welded-dp.zip')
        }
        else if (mode === 'resourcepack' && fs.existsSync(path + '/welded-rp.zip')) {
            return fs.readFileSync(path + '/welded-rp.zip')
        } 
        else if (mode === 'both' && fs.existsSync(path + "/welded-both.zip")) {
            return fs.readFileSync(path + '/welded-both.zip')
        }
        // fs.rmSync(path, {recursive: true, force: true})
        return undefined
    }
}


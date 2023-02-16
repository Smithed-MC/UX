import * as fs from 'fs'
import { PythonShell } from 'python-shell'
import fetch from 'node-fetch'
import semver from 'semver'

import { MinecraftVersion, PackData, PackVersion } from 'data-types'
import { getFirestore } from 'firebase-admin/firestore'
import { getPackDoc } from 'database'
import { RUNNER } from './runner.js'
import { CompactSign } from 'jose'

if (!fs.existsSync('temp'))
    fs.mkdirSync('temp')

export async function incrementPackDownloadCount(userHash: string, weight: number, packId: string) {
    const analytics = getFirestore().collection("analytics").doc(packId)
    const today = analytics.collection("downloads").doc(new Date().toLocaleDateString().replaceAll('/', '-'))

    const todayVal = await today.get()

    if (await todayVal.get(userHash) === undefined) {
        const downloads: any = todayVal.data() ?? {}
        downloads[userHash] = weight

        if (downloads["total"] === undefined)
            downloads["total"] = 1
        else
            downloads["total"] += 1

        const totalDownloads = await analytics.collection("downloads").doc("total").get()
        const totalDownloadCount = totalDownloads.data() !== undefined ? await totalDownloads.get('value') : 0

        await totalDownloads.ref.set({ value: totalDownloadCount + 1 })

        // console.log(downloads)
        await today.set(downloads, { merge: true })
    }
}

export type CollectedPack = [string, PackVersion, boolean]

export async function collectPacks(pack: string, gameVersion: MinecraftVersion, dependency: boolean = false): Promise<CollectedPack[]> {
    const [packId, packVersion] = pack.split('@')
    const packDoc = await getPackDoc(packId)

    if (packDoc === undefined) {
        console.log('Unknown pack', packId);
        return []
    }

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
    if (version === undefined) {
        console.log('No version statisfies', packVersion ?? '*', 'or no version supports', gameVersion, 'for pack', packId);
        return []
    }

    let packs: CollectedPack[] = [[packDoc.id, version, dependency]]

    for (const d of version.dependencies ?? []) {
        packs = packs.concat(await collectPacks(d.id + '@' + d.version, gameVersion, true))
    }

    return packs;

}

export class DownloadRunner {
    id: string
    userHash: string
    constructor(userHash: string) {
        this.id = Date.now().toString()
        this.userHash = userHash
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

    private async downloadPack(pack: CollectedPack) {
        console.log(pack)
        const [packId, version, dependency] = pack
        let successfullyDownloaded = false

        if (version.downloads.datapack !== undefined && version.downloads.datapack !== '') {
            successfullyDownloaded = await this.tryToDownload(packId + version.name + '-dp', version.downloads.datapack)
        }
        if (version.downloads.resourcepack !== undefined && version.downloads.resourcepack !== '') {
            let rpSuccess = await this.tryToDownload(packId + version.name + '-rp', version.downloads.resourcepack)
            successfullyDownloaded ||= rpSuccess
        }

        if (successfullyDownloaded)
            await incrementPackDownloadCount(this.userHash, dependency ? 1 : 3, packId)
    }

    private async downloadPacks(packs: string[], version: MinecraftVersion) {
        let foundPacks: CollectedPack[] = []
        for (let pack of packs) {
            foundPacks = foundPacks.concat(await collectPacks(pack, version, false))
        }

        foundPacks = foundPacks.filter((pack, idx, arr) => arr.indexOf(pack) === idx)

        for (let pack of foundPacks)
            await this.downloadPack(pack)
    }

    private async tryToDownload(filename: string, url: string) {
        if (fs.existsSync(filename))
            return false;

        const resp = await fetch(url)

        if (!resp.ok) {
            console.log('Failed to download', filename)
            return false;
        }
        fs.writeFileSync(`temp/${this.id}/${filename}.zip`, Buffer.from(await resp.arrayBuffer()))
        return true;
    }


    async run(packs: string[], version: MinecraftVersion, mode: 'datapack' | 'resourcepack' | 'both', userHash?: string) {
        const path = 'temp/' + this.id
        fs.mkdirSync(path);
        console.log('Downloading packs...')
        console.log('Packs', packs, '\nVersion', version, '\nMode', mode)
        await this.downloadPacks(packs, version)
        console.log('Done downloading packs!\nRunning weld...')
        await this.runWeld(mode)
        console.log('Done running weld!')


        var output = undefined

        if (mode === 'datapack' && fs.existsSync(path + '/welded-dp.zip')) {
            output = fs.readFileSync(path + '/welded-dp.zip')
        }
        else if (mode === 'resourcepack' && fs.existsSync(path + '/welded-rp.zip')) {
            output = fs.readFileSync(path + '/welded-rp.zip')
        }
        else if (mode === 'both' && fs.existsSync(path + "/welded-both.zip")) {
            output = fs.readFileSync(path + '/welded-both.zip')
        }
        fs.rmSync(path, { recursive: true, force: true })
        return output
    }
}


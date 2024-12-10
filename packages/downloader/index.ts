import * as fs from "fs"
import { PythonShell } from "python-shell"
import fetch from "node-fetch"
import semver from "semver"

import {
	BundleVersion,
	MinecraftVersion,
	PackData,
	PackDownloadOptions,
	PackReference,
	PackVersion,
} from "data-types"
import { getFirestore } from "firebase-admin/firestore"
import { getPackDoc } from "database"
import { RUNNER } from "./runner.js"
import { CompactSign } from "jose"

if (!fs.existsSync("temp")) fs.mkdirSync("temp")

class PackDownloadError extends Error {
	constructor(
		id: string,
		version: string,
		downloadType: string,
		downloadUrl: string,
		error: any
	) {
		super(
			`An Error occured while downloading pack ${id}, version ${version}.\n` +
				`The ${downloadType} link ${downloadUrl} resulted in\n` +
				`${error}`
		)
	}
}

class PatchDownloadError extends Error {
	constructor(
		id: string,
		version: string,
		patchIndex: number,
		downloadType: string,
		downloadUrl: string,
		error: any
	) {
		super(
			`An Error occured while downloading bundle ${id}, version ${version} patch #${patchIndex}.\n` +
				`The ${downloadType} link ${downloadUrl} resulted in\n` +
				`${error}`
		)
	}
}

export async function incrementPackDownloadCount(
	userHash: string,
	weight: number,
	packId: string
) {
	const analytics = getFirestore().collection("analytics").doc(packId)
	const today = analytics
		.collection("downloads")
		.doc(new Date().toLocaleDateString().replaceAll("/", "-"))

	const todayVal = await today.get()

	if ((await todayVal.get(userHash)) === undefined) {
		const downloads: any = todayVal.data() ?? {}
		
		downloads[userHash] = weight

		if (downloads["total"] === undefined) downloads["total"] = 1
		else downloads["total"] += 1

		const totalDownloads = await analytics
			.collection("downloads")
			.doc("total")
			.get()
		const totalDownloadCount =
			totalDownloads.data() !== undefined
				? await totalDownloads.get("value")
				: 0

		await totalDownloads.ref.set({ value: totalDownloadCount + 1 })

		// console.log(downloads)
		await today.set(downloads, { merge: true })
	}
}

export type CollectedPack = {
	id: string
	version: PackVersion
	isDependency: boolean
}

export async function collectPacks(
	collectedPacks: CollectedPack[],
	pack: string | PackReference,
	gameVersion: MinecraftVersion,
	dependency: boolean = false
): Promise<void> {
	const [packId, packVersion] =
		typeof pack === "string" ? pack.split("@") : [pack.id, pack.version]

	const packDoc = await getPackDoc(packId)

	if (packDoc === undefined) {
		console.log("Unknown pack", packId)
		return
	}

	if (
		collectedPacks.find(
			(cp) => cp.id === packDoc.id && cp.version.name === packVersion
		)
	)
		return

	const packVersions: PackVersion[] = packDoc.get("data.versions")

	const filteredVersions = packVersions
		.filter(
			(
				v // Filter out all packs that don't satisfy the supplied pack
			) =>
				semver.satisfies(v.name, packVersion ?? "*", {
					includePrerelease: true,
				}) && // version and that don't support the supplied game version
				v.supports.includes(gameVersion)
		)
		.sort((a, b) => semver.compare(a.name, b.name)) // Sort and reverse so the latest version is at index 0
		.reverse() // If an exact value was specified, only one version will be left after
	// the initial filtering

	let version: PackVersion | undefined = filteredVersions[0]
	if (version === undefined) {
		if (packVersion !== undefined) {
			version = packVersions.find((v) => v.name === packVersion)

			if (version === undefined) {
				console.log("No version matches", packVersion)
				return
			}

			console.log(
				`Using version ${packVersion} for ${packId} but it does not explicitly support ${gameVersion}`
			)
		} else {
			console.log("No version supports", gameVersion, "for pack", packId)
			return
		}
	}

	collectedPacks.push({ id: packDoc.id, version, isDependency: dependency })

	for (const d of version.dependencies ?? []) {
		await collectPacks(
			collectedPacks,
			d.id + "@" + d.version,
			gameVersion,
			true
		)
	}
}

export class DownloadRunner {
	id: string
	userHash: string
	constructor(userHash: string) {
		this.id = Date.now().toString()
		this.userHash = userHash
	}

	private runWeld(mode: string, version: string) {
		return new Promise<void>((resolve, reject) => {
			const python = PythonShell.runString(
				RUNNER,
				{
					mode: "text",
					args: [this.id, mode, version],
					pythonOptions: ["-u"],
				},
				() => {}
			)
			python.on("error", (error) => {
				console.error(error)
				reject(error)
			})
			python.on("pythonError", (error) => {
				console.error(error)
				reject(error)
			})
			python.on("message", (c) => console.log(c))
			python.on("close", () => {
				resolve()
			})
		})
	}

	private async downloadDataAndResources(
		id: string,
		version: PackVersion | BundleVersion
	): Promise<boolean> {
		// console.log(pack)

		let successfullyDownloaded = false

		if ("downloads" in version) {
			for (const [downloadType, downloadUrl] of Object.entries(
				version.downloads
			)) {
				console.log([downloadType, downloadUrl])
				successfullyDownloaded = await this.downloadPackUrl(
					successfullyDownloaded,
					id,
					version,
					downloadType,
					downloadUrl
				) || successfullyDownloaded
			}
		} else {
			const patches = version.patches
				.map((p, idx) =>
					Object.entries(p).map(
						([type, url]) =>
							[idx, type, url] as [number, string, string]
					)
				)
				.reduce((p, n) => [...p, ...n])

			for (const [idx, downloadType, downloadUrl] of patches) {
				successfullyDownloaded = await this.downloadPatchUrl(
					successfullyDownloaded,
					idx,
					downloadType,
					downloadUrl,
					id,
					version
				) || successfullyDownloaded
			}
		}

		return successfullyDownloaded
	}

	private async downloadPatchUrl(
		successfullyDownloaded: boolean,
		idx: number,
		downloadType: string,
		downloadUrl: string,
		id: string,
		version: {
			name: string
			supports: string[]
			patches: Partial<{ datapack: string; resourcepack: string }>[]
			packs: { id: string; version: string }[]
		}
	) {
		try {
			successfullyDownloaded = await this.tryToDownload(
				`patch-${idx}-${downloadType}`,
				downloadUrl
			)
		} catch (e) {
			throw new PatchDownloadError(
				id,
				version.name,
				idx,
				downloadType,
				downloadUrl,
				e
			)
		}
		return successfullyDownloaded
	}

	private async downloadPackUrl(
		successfullyDownloaded: boolean,
		id: string,
		version: {
			downloads: Partial<{ datapack: string; resourcepack: string }>
			dependencies: { id: string; version: string }[]
			name: string
			supports: string[]
		},
		downloadType: string,
		downloadUrl: string
	) {
		try {
			console.log(downloadType, downloadUrl)
			successfullyDownloaded = await this.tryToDownload(
				`${id}-${version.name}-${downloadType}`,
				downloadUrl
			)
		} catch (e) {
			throw new PackDownloadError(
				id,
				version.name,
				downloadType,
				downloadUrl,
				e
			)
		}
		return successfullyDownloaded
	}

	private async downloadPacks(
		packs: (string | PackReference)[],
		version: MinecraftVersion
	) {
		if (packs.length === 1) {
			console.log("Single pack, finding game version")

			const [id, packVersion] =
				typeof packs[0] === "string"
					? packs[0].split("@")
					: [packs[0].id, packs[0].version]
			console.log(`https://api.smithed.dev/v2/packs/${id}`)
			const resp = await fetch(`https://api.smithed.dev/v2/packs/${id}`)
			if (!resp.ok) return version

			const data: PackData = (await resp.json()) as any

			var versionData = data.versions
				.filter(
					(
						v // Filter out all packs that don't satisfy the supplied pack
					) =>
						semver.satisfies(v.name, packVersion ?? "*", {
							includePrerelease: true,
						}) // version and that don't support the supplied game version
				)
				.sort((a, b) => semver.compare(a.name, b.name))
				.reverse()[0]

			console.log("Found version", packVersion)

			if (versionData) version = versionData.supports[0]
			console.log("Download set to ", version)
		}

		let foundPacks: CollectedPack[] = []
		for (let pack of packs) {
			await collectPacks(foundPacks, pack, version, false)
		}

		foundPacks = foundPacks.filter(
			(pack, idx) =>
				foundPacks.findIndex((curPack) => {
					return (
						curPack.id === pack.id &&
						curPack.version.name === pack.version.name
					)
				}) === idx
		)

		if (foundPacks.length == 0)
			throw new Error("No packs found meeting all specified criteria!")

		await Promise.all(
			foundPacks.map((pack) =>
				(async () => {
					const success = await this.downloadDataAndResources(
						pack.id,
						pack.version
					)
					if (success) {
						await incrementPackDownloadCount(
							this.userHash,
							pack.isDependency ? 1 : 3,
							pack.id
						)
					}
				})()
			)
		).catch((e) => {
			throw e
		})

		return version
	}

	private async tryToDownload(filename: string, url: string) {
		if (url.length === 0 || !url.startsWith("http")) return false
  if (fs.existsSync(filename)) return false

		const resp = await fetch(url)

		if (!resp.ok) {
			throw new Error(
				`${resp.status} - ${resp.headers.get("Content-Type") === "text/plain" ? await resp.text() : resp.statusText}`
			)
		}
		fs.writeFileSync(
			`temp/${this.id}/${filename}.zip`,
			Buffer.from(await resp.arrayBuffer()) as any
		)
		return true
	}

	async mergePacks(
		packs: (string | PackReference)[],
		version: MinecraftVersion,
		mode: "datapack" | "resourcepack" | "both"
	): Promise<fs.ReadStream | undefined> {
		const path = this.setupTemporaryFolder()

		let activeVersion = await this.collectAndDownloadPacks(
			packs,
			version,
			mode
		)

		console.log("Done downloading packs!\nRunning weld...")
		await this.runWeld(mode, activeVersion)
		console.log("Done running weld!")

		return this.collectResultZip(mode, path)
	}

	private async collectAndDownloadPacks(
		packs: (string | PackReference)[],
		version: string,
		mode: string
	) {
		console.log("Downloading packs...")
		console.log("Packs", packs, "\nVersion", version, "\nMode", mode)
		let activeVersion = await this.downloadPacks(packs, version)
		return activeVersion
	}

	async mergePacksAndPatches(
		bundleId: string,
		bundleVersion: BundleVersion,
		mode: "datapack" | "resourcepack" | "both"
	): Promise<fs.ReadStream | undefined> {
		const path = this.setupTemporaryFolder()

		let activeVersion = await this.collectAndDownloadPacks(
			bundleVersion.packs,
			bundleVersion.supports[0],
			mode
		)

		console.log("Done download packs!\nDownloading patches...")
		await this.downloadPatches(bundleId, bundleVersion)
		console.log("Done downloading patches!\nRunning weld...")

		await this.runWeld(mode, activeVersion)
		console.log("Done running weld!")

		return this.collectResultZip(mode, path)
	}

	private async downloadPatches(id: string, version: BundleVersion) {
		await this.downloadDataAndResources(id, version)
	}

	private setupTemporaryFolder() {
		const path = "temp/" + this.id
		fs.mkdirSync(path)
		return path
	}

	private collectResultZip(mode: string, path: string) {
		if (mode === "datapack" && fs.existsSync(path + "/welded-dp.zip")) {
			return fs.createReadStream(path + "/welded-dp.zip")
			// console.log('Size of datapack:', output.byteLength / 1000 / 1000, 'mB')
		} else if (
			mode === "resourcepack" &&
			fs.existsSync(path + "/welded-rp.zip")
		) {
			return fs.createReadStream(path + "/welded-rp.zip")
			// console.log('Size of resourcepack:', output.byteLength / 1000 / 1000, 'mB')
		} else if (
			mode === "both" &&
			fs.existsSync(path + "/welded-both.zip")
		) {
			return fs.createReadStream(path + "/welded-both.zip")
			// console.log('Size of b:', output.byteLength / 1000 / 1000, 'mB')
		}

		return undefined
	}
}

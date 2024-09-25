import * as fs from "fs"
import { PythonShell } from "python-shell"
import fetch from "node-fetch"
import semver from "semver"

import {
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
		name: string,
		downloads: PackDownloadOptions
	): Promise<boolean> {
		// console.log(pack)

		let successfullyDownloaded = false

		if (downloads.datapack !== undefined && downloads.datapack !== "") {
			successfullyDownloaded = await this.tryToDownload(
				name + "-dp",
				downloads.datapack
			)
		}
		if (
			downloads.resourcepack !== undefined &&
			downloads.resourcepack !== ""
		) {
			let rpSuccess = await this.tryToDownload(
				name + "-rp",
				downloads.resourcepack
			)
			successfullyDownloaded ||= rpSuccess
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

		await Promise.allSettled(
			foundPacks.map((pack) =>
				(async () => {
					const success = await this.downloadDataAndResources(
						pack.id + pack.version.name,
						pack.version.downloads
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
		)

		return version
	}

	private async tryToDownload(filename: string, url: string) {
		if (fs.existsSync(filename)) return false

		const resp = await fetch(url)

		if (!resp.ok) {
			console.log("Failed to download", filename)
			return false
		}
		fs.writeFileSync(
			`temp/${this.id}/${filename}.zip`,
			Buffer.from(await resp.arrayBuffer())
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
		packs: (string | PackReference)[],
		patches: PackDownloadOptions[],
		version: MinecraftVersion,
		mode: "datapack" | "resourcepack" | "both"
	): Promise<fs.ReadStream | undefined> {
		const path = this.setupTemporaryFolder()

		let activeVersion = await this.collectAndDownloadPacks(
			packs,
			version,
			mode
		)

		console.log("Done download packs!\nDownloading patches...")
		await this.downloadPatches(patches)
		console.log("Done downloading patches!\nRunning weld...")

		await this.runWeld(mode, activeVersion)
		console.log("Done running weld!")

		return this.collectResultZip(mode, path)
	}

	private async downloadPatches(patches: PackDownloadOptions[]) {
		for (let i = 0; i < patches.length; i++) {
			await this.downloadDataAndResources("patch-" + i, patches[i])
		}
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

import { Type } from "@sinclair/typebox"
import { API_APP, sendError } from "../../../app.js"
import {
	FirebasePackDocument,
	HTTPResponses,
	ModrinthLink,
	PackData,
	PackEntry,
	PackVersion,
	PermissionScope,
} from "data-types"
import {
	ModrinthProject,
	ModrinthUser,
	ModrinthVersion,
} from "data-types/modrinth"
import { getPackDoc, validateToken } from "database"
import { getLatestVersion } from "./versions.js"
import { prerelease } from "semver"
import { DownloadRunner } from "downloader"
import { fileFrom } from "node-fetch"

const SMITHED_USER_AGENT = "Smithed-MC/UX (smithed.net)"

async function getModrinthUser(
	modrinthToken: string
): Promise<ModrinthUser | null> {
	const resp = await fetch("https://api.modrinth.com/v2/user", {
		headers: {
			Authorization: modrinthToken,
			"User-Agent": SMITHED_USER_AGENT,
		},
	})

	if (!resp.ok) return null

	return await resp.json()
}

async function getModrinthProjects(
	modrinthUserId: string
): Promise<ModrinthProject[] | null> {
	const resp = await fetch(
		`https://api.modrinth.com/v2/user/${modrinthUserId}/projects`,
		{
			headers: {
				"User-Agent": SMITHED_USER_AGENT,
			},
		}
	)

	if (!resp.ok) return null

	return await resp.json()
}

async function getModrinthProject(
	modrinthProjectId: string,
	modrinthToken?: string
): Promise<ModrinthProject | null> {
	const resp = await fetch(
		`https://api.modrinth.com/v2/project/${modrinthProjectId}`,
		{
			headers: {
				"User-Agent": SMITHED_USER_AGENT,
				Authorization: modrinthToken ?? "",
			},
		}
	)

	if (!resp.ok) return null

	return await resp.json()
}

async function getModrinthVersions(
	modrinthVersions: string[],
	modrinthToken?: string
): Promise<ModrinthVersion[] | null> {
	const resp = await fetch(
		`https://api.modrinth.com/v2/versions?ids=${JSON.stringify(modrinthVersions)}`,
		{
			headers: {
				"User-Agent": SMITHED_USER_AGENT,
				Authorization: modrinthToken ?? "",
			},
		}
	)

	if (!resp.ok) {
		console.log(await resp.json())
		return null
	}
	return await resp.json()
}

API_APP.route({
	method: "POST",
	url: "/packs/:id/modrinth/link",
	schema: {
		querystring: Type.Object({
			token: Type.String(),
			modrinthToken: Type.String(),
			modrinthProject: Type.String(),
		}),
		params: Type.Object({
			id: Type.String(),
		}),
	},
	handler: async (req, reply) => {
		const { token, modrinthToken, modrinthProject } = req.query
		const { id: packId } = req.params

		const doc = await getPackDoc(packId)
		if (doc === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Pack with ID ${packId} was not found`
			)
		const owner: string = await doc.get("owner")

		const tokenData = await validateToken(reply, token, {
			requiredUid: [owner],
			requiredScopes: [PermissionScope.WRITE_PACKS],
		})

		if (tokenData === undefined)
			return sendError(
				reply,
				HTTPResponses.UNAUTHORIZED,
				"You do not have access to link this pack with Modrinth"
			)

		const user = await getModrinthUser(modrinthToken)

		if (user == null)
			return sendError(
				reply,
				HTTPResponses.BAD_REQUEST,
				"Token does not match a Modrinth user"
			)

		const packs = await getModrinthProjects(user.id)

		if (packs == null)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				"User has no packs"
			)

		const targetPack = packs.find((p) => p.id == modrinthProject)

		if (targetPack == undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				"User does not own pack " + modrinthProject
			)

		if (!targetPack.loaders.includes("datapack"))
			return sendError(
				reply,
				HTTPResponses.BAD_REQUEST,
				"Provided project is not marked as a datapack, check loaders"
			)

		doc.ref.set(
			{
				modrinth: {
					linkedProject: modrinthProject,
					linkOwner: "smithed",
				} as ModrinthLink,
			},
			{ merge: true }
		)

		reply.status(HTTPResponses.OK).send("Project's successfully linked")
	},
})

API_APP.route({
	method: "POST",
	url: "/packs/:id/modrinth/unlink",
	schema: {
		querystring: Type.Object({
			token: Type.String(),
		}),
		params: Type.Object({
			id: Type.String(),
		}),
	},
	handler: async (req, reply) => {
		const { token } = req.query
		const { id: packId } = req.params

		const doc = await getPackDoc(packId)
		if (doc === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Pack with ID ${packId} was not found`
			)
		const owner: string = await doc.get("owner")

		const tokenData = await validateToken(reply, token, {
			requiredUid: [owner],
			requiredScopes: [PermissionScope.WRITE_PACKS],
		})

		if (tokenData === undefined)
			return sendError(
				reply,
				HTTPResponses.UNAUTHORIZED,
				"You do not have access to unlink this pack with Modrinth"
			)

		doc.ref.set(
			{
				modrinth: undefined,
			},
			{ merge: true }
		)

		reply.status(HTTPResponses.OK).send("Project's successfully unlinked")
	},
})

function applyChanges(original, comparisonPairs: [string, any][]) {
	const newData = {}

	for (const pair of comparisonPairs) {
		if (original[pair[0]] != pair[1]) {
			newData[pair[0]] = pair[1]
		}
	}

	return newData
}

async function syncProjectData(
	modrinthToken: string,
	modrinthProject: ModrinthProject,
	smithedPack: PackData
) {
	const comparisonPairs: [string, any][] = [
		["title", smithedPack.display.name],
		["description", smithedPack.display.description],
		[
			"body",
			smithedPack.display.webPage
				? await (await fetch(smithedPack.display.webPage)).text()
				: undefined,
		],
	]

	const newData = applyChanges(modrinthProject, comparisonPairs)

	if (Object.keys(newData).length >= 1) {
		const resp = await fetch(
			`https://api.modrinth.com/v2/project/${modrinthProject.id}`,
			{
				method: "PATCH",
				headers: {
					Authorization: modrinthToken,
					"User-Agent": SMITHED_USER_AGENT,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(newData),
			}
		)

		if (!resp.ok) {
			console.error("Failed to sync with modrinth!", await resp.json())
		}
	}
}

async function updateExistingVersion(
	packId: string,
	modrinthToken: string,
	modrinthVersion: ModrinthVersion,
	smithedVersion: PackVersion,
	latestVersion: string
) {
	const comparisonPairs: [string, any][] = [
		["game_versions", smithedVersion.supports],
	]

	const newData = applyChanges(modrinthVersion, comparisonPairs)

	if (
		modrinthVersion.featured !==
		(modrinthVersion.version_number === latestVersion)
	)
		newData["featured"] = modrinthVersion.version_number === latestVersion

	const updateResp = await fetch(
		`https://api.modrinth.com/v2/version/${modrinthVersion.id}`,
		{
			method: "PATCH",
			headers: {
				Authorization: modrinthToken,
				"User-Agent": SMITHED_USER_AGENT,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(newData),
		}
	)

	if (!updateResp.ok) {
		throw new Error(
			`Failed to sync version ${modrinthVersion.id} with Modrinth!`,
			await updateResp.json()
		)
	}
}

async function getPackDownload(
	packId: string,
	version: PackVersion,
	downloadType: string
) {
	const runner = new DownloadRunner("smithed-api")
	try {
		const result = await runner.mergePacks(
			[packId + "@" + version.name],
			version.supports[0],
			downloadType as any
		)

		if (result == null)
			throw new Error(
				`Failed to download the ${downloadType} for version ${version.name}`
			)

		const file = await fileFrom(result.path.toString(), "application/zip")

		return file
	} catch (e) {
		throw new Error(
			`An error occured while downloading the ${downloadType} for version ${version.name}\n${e}`
		)
	}
}

async function createNewVersion(
	packId: string,
	modrinthToken: string,
	modrinthProjectId: string,
	smithedVersion: PackVersion,
	latestVersion: string
) {
	const formData = new FormData()

	const data = {
		project_id: modrinthProjectId,
		name: "Version " + smithedVersion.name,
		version_number: smithedVersion.name,
		version_type:
			prerelease(smithedVersion.name) == null ? "release" : "alpha",
		game_versions: smithedVersion.supports,
		featured: smithedVersion.name === latestVersion,
		dependencies: [],
		loaders: ["datapack"],
		file_parts: [...Object.keys(smithedVersion.downloads)],
		primary: Object.keys(smithedVersion.downloads)[0],
	}

	formData.set(
		"data",
		new Blob([JSON.stringify(data)], { type: "application/json" })
	)

	for (const downloadType in smithedVersion.downloads) {
		const file = await getPackDownload(packId, smithedVersion, downloadType)
		formData.set(downloadType, file, downloadType + ".zip")
	}

	const resp = await fetch("https://api.modrinth.com/v2/version", {
		method: "POST",
		headers: {
			Authorization: modrinthToken,
			"User-Agent": SMITHED_USER_AGENT,
		},
		body: formData,
	})

	if (!resp.ok) {
		console.error(
			`Failed to create new version ${smithedVersion.name} on Modrinth!`,
			await resp.json()
		)
	}
}

async function syncVersionsData(
	packId: string,
	modrinthToken: string,
	modrinthProjectId: string,
	modrinthVersions: ModrinthVersion[],
	smithedVersions: PackVersion[]
) {
	const versionNumbers = smithedVersions.map((v) => v.name)

	const latestVersion = getLatestVersion(smithedVersions).name

	const tasks: Promise<void>[] = []

	for (const modrinthVersion of modrinthVersions) {
		if (versionNumbers.includes(modrinthVersion.version_number)) {
			tasks.push(
				updateExistingVersion(
					packId,
					modrinthToken,
					modrinthVersion,
					smithedVersions.find(
						(v) => v.name === modrinthVersion.version_number
					)!,
					latestVersion
				)
			)

			versionNumbers.splice(
				versionNumbers.indexOf(modrinthVersion.version_number)
			)
		}
	}

	for (const version of versionNumbers) {
		const smithedVersion = smithedVersions.find((v) => v.name === version)!
		tasks.push(
			createNewVersion(
				packId,
				modrinthToken,
				modrinthProjectId,
				smithedVersion,
				latestVersion
			)
		)
	}

	await Promise.all(tasks)
}

API_APP.route({
	method: "GET",
	url: "/packs/:id/modrinth/publish",
	schema: {
		querystring: Type.Object({
			token: Type.String(),
			modrinthToken: Type.String(),
		}),
		params: Type.Object({
			id: Type.String(),
		}),
	},
	handler: async (req, reply) => {
		const { token, modrinthToken } = req.query
		const { id: packId } = req.params

		const doc = await getPackDoc(packId)
		if (doc === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Pack with ID ${packId} was not found`
			)
		const owner: string = await doc.get("owner")

		const tokenData = await validateToken(reply, token, {
			requiredUid: [owner],
			requiredScopes: [PermissionScope.WRITE_PACKS],
		})

		if (tokenData == null)
			return sendError(
				reply,
				HTTPResponses.UNAUTHORIZED,
				"You cannot publish this pack to Modrinth"
			)

		const documentData = doc.data() as FirebasePackDocument

		if (documentData.modrinth === undefined)
			return sendError(
				reply,
				HTTPResponses.BAD_REQUEST,
				"Pack has not been linked to a Modrinth project!"
			)

		if (documentData.modrinth.linkOwner !== "smithed")
			return sendError(
				reply,
				HTTPResponses.BAD_REQUEST,
				"Modrinth owns the link, not Smithed"
			)

		const projectId = documentData.modrinth.linkedProject

		const project = await getModrinthProject(projectId, modrinthToken)

		if (project == null)
			return sendError(
				reply,
				HTTPResponses.SERVER_ERROR,
				"The linked project does not exist, please unlink/link the pack."
			)

		const versions = await getModrinthVersions(
			project.versions,
			modrinthToken
		)

		if (versions == null)
			return sendError(
				reply,
				HTTPResponses.SERVER_ERROR,
				"Failed to get modrinth project versions."
			)

		await syncProjectData(modrinthToken, project, documentData.data)
		await syncVersionsData(
			packId,
			modrinthToken,
			projectId,
			versions ?? [],
			documentData.data.versions
		)
	},
})

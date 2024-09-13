import { Type } from "@sinclair/typebox"
import { API_APP, get, sendError, set } from "../../../app.js"
import {
	HTTPResponses,
	MinecraftVersionSchema,
	PackVersion,
	PackVersionSchema,
	PermissionScope,
} from "data-types"
import { coerce, compare } from "semver"
import { getPackDoc, validateToken } from "database"
import { invalidateCachedData } from "./index.js"

/*
 * @route GET /packs/:id/versions
 * Get the list of a pack's versions
 *
 * @param id
 * The pack's UID or plaintext id. Using UID is more performant as it is a direct lookup.
 *
 * @return OK: PackVersion
 * @return NOT_FOUND: ApiError
 *
 * @example Get a pack's versions
 * fetch('https://api.smithed.dev/v2/packs/coc/versions')
 */
API_APP.route({
	method: "GET",
	url: "/packs/:id/versions",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
	},
	handler: async (request, reply) => {
		const { id } = request.params
		const doc = await getPackDoc(id)

		const requestIdentifier = "GET-PACK-VERSIONS::" + id
		const tryCachedResult = await get(requestIdentifier)
		if (
			tryCachedResult &&
			request.headers["cache-control"] !== "max-age=0"
		) {
			request.log.info("served cached /packs/", id, "/versions")
			return tryCachedResult.item
		}

		if (doc === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Pack with ID ${id} was not found`
			)

		const data = await doc.get("data.versions")
		await set(requestIdentifier, data, 60 * 60 * 1000)
		return data
	},
})

/*
 * @route POST /packs/:id/versions
 * Add to the list of a pack's versions
 *
 * @param id
 * The pack's UID or plaintext id. Using UID is more performant as it is a direct lookup.
 *
 * @body data: PackVersion
 * The data to add to the list
 *
 * @query token: string
 * Either Firebase Id Token or a valid PAT
 * @query version: string
 * The valid semver version number to assign
 *
 * @return OK: string
 * @return NOT_FOUND: ApiError
 * @return UNAUTHORIZED: ApiError
 * @return FORBIDDEN: ApiError
 *
 * @example Add a version to a pack
 * fetch('https://api.smithed.dev/v2/packs/coc/versions?token=FOO&version=0.0.1', {
 *   method: 'POST',
 *   body: {data: <PackVersion>},
 *   headers: {'Content-Type': 'application/json'}
 * })
 */
API_APP.route({
	method: "POST",
	url: "/packs/:id/versions",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
		querystring: Type.Object({
			version: Type.String(),
			token: Type.String(),
		}),
		body: Type.Object({
			data: PackVersionSchema,
		}),
	},
	handler: async (response, reply) => {
		const { id: packId } = response.params
		const { version: versionId, token } = response.query
		const { data: versionData } = response.body

		if (coerce(versionId) == null)
			return sendError(
				reply,
				HTTPResponses.BAD_REQUEST,
				"Version ID is not valid semver. Reference: https://semver.org"
			)

		const doc = await getPackDoc(packId)
		if (doc === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Pack with ID ${packId} was not found`
			)
		const contributors: string[] = await doc.get("contributors")

		const tokenData = await validateToken(reply, token, {
			requiredUid: contributors,
			requiredScopes: [PermissionScope.WRITE_PACKS],
		})

		if (tokenData === undefined) return

		const versions: PackVersion[] = await doc.get("data.versions")

		if (versions.find((v) => v.name === versionId))
			return sendError(
				reply,
				HTTPResponses.CONFLICT,
				`Version with ID ${versionId} already exists`
			)

		versionData.name = versionId
		versions.push(versionData)

		invalidateCachedData(await doc.get("data.id"), doc.id)
		
		await doc.ref.set(
			{
				data: {
					versions: versions,
				},
				stats: {
					updated: Date.now(),
				},
			},
			{ merge: true }
		)

		return reply
			.status(HTTPResponses.CREATED)
			.send(`Version ${versionId} successfully created`)
	},
})

/*
 * @route PATCH /packs/:id/versions/:versionId
 * Add to the list of a pack's versions
 *
 * @param id
 * The pack's UID or plaintext id. Using UID is more performant as it is a direct lookup.
 * @param versionId
 * The version number to target
 *
 * @body data: PackVersion
 * The data to merge/overwrite with
 *
 * @query token: string
 * Either Firebase Id Token or a valid PAT
 *
 * @return OK: string
 * @return NOT_FOUND: ApiError
 * @return UNAUTHORIZED: ApiError
 * @return FORBIDDEN: ApiError
 *
 * @example Add a version to a pack
 * fetch('https://api.smithed.dev/v2/packs/coc/versions/0.0.1?token=FOO', {
 *   method: 'PATCH',
 *   body: {data: <PackVersion>},
 *   headers: {'Content-Type': 'application/json'}
 * })
 */
API_APP.route({
	method: "PATCH",
	url: "/packs/:packId/versions/:versionId",
	schema: {
		params: Type.Object({
			packId: Type.String(),
			versionId: Type.String(),
		}),
		querystring: Type.Object({
			token: Type.String(),
		}),
		body: Type.Object({
			data: Type.Partial(PackVersionSchema),
		}),
	},
	handler: async (response, reply) => {
		const { packId, versionId } = response.params
		const { token } = response.query
		const { data: versionData } = response.body

		if (coerce(versionId) == null)
			return sendError(
				reply,
				HTTPResponses.BAD_REQUEST,
				"Version ID is not valid semver. Reference: https://semver.org"
			)

		const doc = await getPackDoc(packId)
		if (doc === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Pack with ID ${packId} was not found`
			)
		const contributors: string[] = await doc.get("contributors")

		const tokenData = await validateToken(reply, token, {
			requiredUid: contributors,
			requiredScopes: [PermissionScope.WRITE_PACKS],
		})

		if (tokenData === undefined) return

		const versions: PackVersion[] = await doc.get("data.versions")

		const versionIndex = versions.findIndex((v) => v.name === versionId)
		if (versionIndex === -1)
			return sendError(
				reply,
				HTTPResponses.CONFLICT,
				`Version with ID ${versionId} already exists`
			)

		versions[versionIndex].dependencies =
			versionData.dependencies ?? versions[versionIndex].dependencies
		versions[versionIndex].name =
			versionData.name ?? versions[versionIndex].name
		versions[versionIndex].supports =
			versionData.supports ?? versions[versionIndex].supports
		versions[versionIndex].downloads =
			versionData.downloads ?? versions[versionIndex].downloads

		await doc.ref.set(
			{
				data: {
					versions: versions,
				},
			},
			{ merge: true }
		)

		invalidateCachedData(await doc.get("data.id"), doc.id)

		return reply
			.status(HTTPResponses.CREATED)
			.send(`Version ${versionId} successfully updated`)
	},
})

/*
 * @route DELETE /packs/:id/versions/:versionId
 * Add to the list of a pack's versions
 *
 * @param id
 * The pack's UID or plaintext id. Using UID is more performant as it is a direct lookup.
 * @param versionId
 * The version number to target
 *
 * @query token: string
 * Either Firebase Id Token or a valid PAT
 *
 * @return OK: string
 * @return NOT_FOUND: ApiError
 * @return UNAUTHORIZED: ApiError
 * @return FORBIDDEN: ApiError
 *
 * @example Delete a version
 * fetch('https://api.smithed.dev/v2/packs/coc/versions/0.0.1?token=FOO', {
 *   method: 'DELETE',
 * })
 */
API_APP.route({
	method: "DELETE",
	url: "/packs/:packId/versions/:versionId",
	schema: {
		params: Type.Object({
			packId: Type.String(),
			versionId: Type.String(),
		}),
		querystring: Type.Object({
			token: Type.String(),
		}),
	},
	handler: async (response, reply) => {
		const { packId, versionId } = response.params
		const { token } = response.query

		if (coerce(versionId) == null)
			return sendError(
				reply,
				HTTPResponses.BAD_REQUEST,
				"Version ID is not valid semver. Reference: https://semver.org"
			)

		const doc = await getPackDoc(packId)
		if (doc === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Pack with ID ${packId} was not found`
			)
		const contributors: string[] = await doc.get("contributors")

		const tokenData = await validateToken(reply, token, {
			requiredUid: contributors,
			requiredScopes: [PermissionScope.WRITE_PACKS],
		})
		
		if (tokenData === undefined)
			return

		const versions: PackVersion[] = await doc.get("data.versions")

		const versionIndex = versions.findIndex((v) => v.name === versionId)
		if (versionIndex === -1)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Version with ID ${versionId} doesn't exist`
			)

		versions.splice(versionIndex, 1)

		await doc.ref.set(
			{
				data: {
					versions: versions,
				},
			},
			{ merge: true }
		)

		invalidateCachedData(await doc.get("data.id"), doc.id)

		return reply
			.status(HTTPResponses.CREATED)
			.send(`Version ${versionId} successfully deleted`)
	},
})

/*
 * @route DELETE /packs/:id/versions/latest
 * Returns the latest version of the specified pack
 *
 * @param id
 * The pack's UID or plaintext id. Using UID is more performant as it is a direct lookup.
 *
 * @query version: MinecraftVersion?
 * Optionally, get the latest version for the specified game version
 *
 * @return OK: PackVersion
 * @return NOT_FOUND: ApiError
 *
 * @example Get the latest version for 1.19
 * fetch('https://api.smithed.dev/v2/packs/coc/versions/latest?version=1.19', {})
 */
API_APP.route({
	method: "GET",
	url: "/packs/:id/versions/latest",
	schema: {
		params: Type.Object({
			id: Type.String(),
		}),
		querystring: Type.Object({
			version: Type.Optional(MinecraftVersionSchema),
		}),
	},
	handler: async (response, reply) => {
		const { id } = response.params
		const { version: gameVersion } = response.query

		const doc = await getPackDoc(id)
		if (doc === undefined)
			return sendError(
				reply,
				HTTPResponses.NOT_FOUND,
				`Pack with ID ${id} was not found`
			)

		const versions: PackVersion[] = await doc.get("data.versions")

		const latestVersion = versions
			.filter((v) =>
				gameVersion !== undefined
					? v.supports.includes(gameVersion)
					: true
			)
			.sort((a, b) => compare(a.name, b.name))
			.reverse()[0]

		return latestVersion
	},
})

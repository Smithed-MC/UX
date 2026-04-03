import { Static, Type } from "@sinclair/typebox"

export const ModrinthUserSchema = Type.Object({
	username: Type.String(),
	name: Type.Optional(Type.String()),
	email: Type.Optional(Type.String()),
	bio: Type.String(),
	payout_data: Type.Any(),
	id: Type.String(),
	avatar_url: Type.String(),
	created: Type.String(),
	role: Type.Union([
		Type.Literal("admin"),
		Type.Literal("moderator"),
		Type.Literal("developer"),
	]),
	badges: Type.Number(),
	auth_providers: Type.Array(Type.String()),
	email_verified: Type.Optional(Type.Boolean()),
	has_password: Type.Optional(Type.Boolean()),
	has_totp: Type.Optional(Type.Boolean()),
	github_id: Type.Optional(Type.Number()),
})

export const ModrinthGalleryImageSchema = Type.Object({
	url: Type.String(),
	featured: Type.Boolean(),
	title: Type.Optional(Type.String()),
	description: Type.Optional(Type.String()),
	created: Type.String(),
	ordering: Type.Number(),
})

export const ModrinthProjectSchema = Type.Object({
	id: Type.String(),
	team: Type.String(),
    title: Type.String(),
    description: Type.String(),
    body: Type.String(),
	body_url: Type.Optional(Type.String()),
	moderator_message: Type.Any(),
	published: Type.String(),
	updated: Type.String(),
	approved: Type.Optional(Type.String()),
	queued: Type.Optional(Type.String()),
	followers: Type.Number(),
	liscense: Type.Any(),
	versions: Type.Array(Type.String()),
	game_versions: Type.Array(Type.String()),
	loaders: Type.Array(Type.String()),
	gallery: Type.Array(ModrinthGalleryImageSchema),
})

export const ModrinthFileSchema = Type.Object({
	hashes: Type.Object({
		sha512: Type.String(),
		sha1: Type.String(),
	}),
	url: Type.String(),
	filename: Type.String(),
	primary: Type.Boolean(),
	size: Type.Integer(),
	file_type: Type.Optional(
		Type.Union(
			["required-resource-pack", "optional-resource-pack"].map((l) =>
				Type.Literal(l)
			)
		)
	),
})

export const ModrinthVersionSchema = Type.Object({
	name: Type.String(),
	version_number: Type.String(),
	changelog: Type.Optional(Type.String()),
	dependencies: Type.Optional(Type.String()),
	game_versions: Type.String(),
	version_type: Type.String(),
	loaders: Type.Array(Type.String()),
	featured: Type.Boolean(),
	status: Type.Union(
		["listed", "archived", "draft", "unlisted", "scheduled", "unknown"].map(
			(l) => Type.Literal(l)
		)
	),
	requested_status: Type.Union(
		["listed", "archived", "draft", "unlisted"].map((l) => Type.Literal(l))
	),
	id: Type.String(),
	project_id: Type.String(),
	author_id: Type.String(),
	date_published: Type.String(),
	downloads: Type.Number(),
	changelog_url: Type.Optional(Type.String()),
	files: Type.Array(ModrinthFileSchema),
})

export type ModrinthUser = Static<typeof ModrinthUserSchema>
export type ModrinthProject = Static<typeof ModrinthProjectSchema>
export type ModrinthGalleryImage = Static<typeof ModrinthGalleryImageSchema>
export type ModrinthVersion = Static<typeof ModrinthVersionSchema>
export type ModrinthFile = Static<typeof ModrinthFileSchema>

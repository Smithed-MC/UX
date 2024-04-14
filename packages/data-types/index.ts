import { Static, Type } from "@sinclair/typebox"
import { Format } from "@sinclair/typebox/format"
import { coerce } from "semver"

export interface PackEntry {
	added: number
	downloads: { [key: string]: number }
	updated: number
	owner: string
}

Format.Set("semver", (v) => coerce(v) != null)
console.log(Format.Has("semver"))

export const supportedMinecraftVersions = [
	"1.20.5-pre1",
	"1.20.5-24w14a",
	"1.20.5-24w13a",
	"1.20.5-24w12a",
	"1.20.5-24w10a",
	"1.20.5-24w09a",
	"1.20.5-23w51b",
	"1.20.4",
	"1.20.4-rc1",
	"1.20.3",
	"1.20.3-rc1",
	"1.20.3-pre4",
	"1.20.2",
	"1.20.1",
	"1.20",
	"1.19.4",
	"1.19",
	"1.18.2",
	"1.18.1",
	"1.18",
	"1.17.1",
	"1.17",
]

export const fullMinecraftVersions = supportedMinecraftVersions.filter(
	(v) => !v.includes("-")
)

export const latestMinecraftVersion = "1.20.4"

export const MinecraftVersionSchema = Type.Union(
	supportedMinecraftVersions.map((v) => Type.Literal(v))
)

export const VisibilitySchema = Type.Union([
	Type.Literal("public"),
	Type.Literal("unlisted"),
	Type.Literal("private"),
])

const sharedCategories = [
	"Extensive",
	"Lightweight",
	"QoL",
	"Vanilla+",
	"Tech",
	"Magic",
	"Exploration",
	"World Overhaul",
]

export const packCategories = [
	...sharedCategories,
	"Library",
	"No Resource Pack",
]

export const bundleCategories = [
	...sharedCategories,
	"Quest Driven",
	"Multiplayer Focus",
]

export const PackReferenceSchema = Type.Object({
	id: Type.String(),
	version: Type.String(),
})

export const PackCategorySchema = Type.Union(
	packCategories.map((c) => Type.Literal(c))
)

export const BundleCategorySchema = Type.Union(
	bundleCategories.map((c) => Type.Literal(c))
)

export const PackDownloadOptionsSchema = Type.Partial(
	Type.Object({
		datapack: Type.String(),
		resourcepack: Type.String(),
	}),
	{ minProperties: 1 }
)

export const PackVersionSchema = Type.Object({
	name: Type.String({ minLength: 1 }),
	downloads: PackDownloadOptionsSchema,
	supports: Type.Array(MinecraftVersionSchema, { minItems: 1 }),
	dependencies: Type.Array(PackReferenceSchema),
})

export const BundleVersionSchema = Type.Object({
	name: Type.String({ minLength: 1 }),
	patches: Type.Array(PackDownloadOptionsSchema),
	supports: Type.Array(MinecraftVersionSchema, { minItems: 1 }),
	packs: Type.Array(PackReferenceSchema),
})

export const PackGalleryImageSchema = Type.Union([
	Type.Object({
		type: Type.Literal("bucket"),
		uid: Type.String(),
		content: Type.Optional(Type.String()),
	}),
	Type.String(),
])

export const DisplaySchema = Type.Object({
	name: Type.String({ minLength: 3 }),
	description: Type.String({ minLength: 3 }),
	icon: Type.String(),
	hidden: Type.Boolean({ default: false }),
	webPage: Type.Optional(Type.String()),
	urls: Type.Optional(
		Type.Object({
			discord: Type.Optional(Type.String()),
			source: Type.Optional(Type.String()),
			homepage: Type.Optional(Type.String()),
		})
	),
	gallery: Type.Optional(Type.Array(PackGalleryImageSchema)),
})

export const PackDataSchema = Type.Object({
	id: Type.String({ minLength: 3 }),
	display: DisplaySchema,
	versions: Type.Array(PackVersionSchema, { minItems: 1 }),
	categories: Type.Array(PackCategorySchema),
})

export const MetaDataSchema = Type.Object({
	docId: Type.String(),
	rawId: Type.String(),
	stats: Type.Object({
		updated: Type.Optional(Type.Number()),
		added: Type.Number(),
		downloads: Type.Object({
			total: Type.Number(),
			today: Type.Number(),
		}),
	}),
	owner: Type.String(),
	contributors: Type.Array(Type.String(), { default: [] }),
})

export const BundleSchema_v1 = Type.Object({
	schemaVersion: Type.Null(),
	owner: Type.String(),
	name: Type.String(),
	version: MinecraftVersionSchema,
	packs: Type.Array(PackReferenceSchema),
	public: Type.Boolean(),
	uid: Type.Optional(Type.String()),
})

export const BundleSchema_v2 = Type.Object({
	schemaVersion: Type.Literal("v2"),
	id: Type.String({ minLength: 3 }),
	uid: Type.Optional(Type.String()),
	owner: Type.String(),
	display: Type.Omit(DisplaySchema, ["gallery", "hidden"]),
	visibility: VisibilitySchema,
	versions: Type.Array(BundleVersionSchema, { minItems: 1 }),
	categories: Type.Array(BundleCategorySchema),
})
export const BundleSchema = Type.Union([BundleSchema_v1, BundleSchema_v2])

/**
 * This function takes in a v1 or v2 bundle and returns a v2 bundle.
 * If the input is a v1, it will be updated as best as possible
 * @param bundle
 * @returns
 */
export function BundleUpdater(bundle: PackBundle): PackBundle_v2 {
	if (bundle.schemaVersion == "v2") return bundle

	return {
		schemaVersion: "v2",
		owner: bundle.owner,
		id: bundle.uid ?? "",
		uid: bundle.uid,
		display: {
			name: bundle.name,
			description: "A new bundle",
			icon: "",
		},
		visibility: bundle.public ? "public" : "private",
		versions: [
			{
				name: "0.0.1",
				patches: [],
				supports: [bundle.version],
				packs: bundle.packs,
			},
		],
		categories: [],
	}
}

export const UserDataSchema = Type.Object({
	displayName: Type.String(),
	cleanName: Type.String(),
	creationTime: Type.Number(),
	uid: Type.String(),
	pfp: Type.Optional(Type.String()),
	banner: Type.Optional(Type.String()),
	biography: Type.Optional(Type.String({ maxLength: 2000 })),
	role: Type.Readonly(
		Type.Union([Type.Literal("member"), Type.Literal("admin")])
	),
})

export enum SortOptions {
	Trending = "trending",
	Downloads = "downloads",
	Alphabetically = "alphabetically",
	Newest = "newest",
}
export const SortSchema = Type.Enum(SortOptions, {
	default: SortOptions.Downloads,
})

export const ArticleSchema = Type.Object({
	title: Type.String(),
	category: Type.Union([
		Type.Literal("general"),
		Type.Literal("council"),
		Type.Literal("showcase"),
	]),
	banner: Type.String(),
	content: Type.String(),
	publisher: Type.String(),
	datePublished: Type.Number(),
	state: Type.Union([
		Type.Literal("not-created"),
		Type.Literal("unpublished"),
		Type.Literal("published"),
	]),
})


export enum PermissionScope {
	READ_PACKS,
	WRITE_PACKS,
	CREATE_PACKS,
	DELETE_PACKS,
	READ_BUNDLES,
	WRITE_BUNDLES,
	CREATE_BUNDLES,
	DELETE_BUNDLES,
	READ_USER,
	WRITE_USER
}

export const PermissionScopeSchema = Type.Enum(
	PermissionScope
)

export const PATokenSchema = Type.Object({
	owner: Type.String(),
	createdAt: Type.Number(),
	expiration: Type.Number(),
	scopes: Type.Array(PermissionScopeSchema, { default: [], uniqueItems: true}),
	tokenUid: Type.String(),
	name: Type.String(),
})

export type Article = Static<typeof ArticleSchema>
export type PackMetaData = Static<typeof MetaDataSchema>
export type MinecraftVersion = Static<typeof MinecraftVersionSchema>
export type PackDependency = Static<typeof PackReferenceSchema>
export type PackVersion = Static<typeof PackVersionSchema>
export type PackDownloadOptions = Static<typeof PackDownloadOptionsSchema>
export type PackData = Static<typeof PackDataSchema>

export type PackBundle_v1 = Static<typeof BundleSchema_v1>
export type PackBundle_v2 = Static<typeof BundleSchema_v2>
export type PackBundle = PackBundle_v1 | PackBundle_v2

export type BundleVersion = Static<typeof BundleVersionSchema>

export type PackReference = Static<typeof PackReferenceSchema>
export type PackGalleryImage = Static<typeof PackGalleryImageSchema>

export type UserData = Static<typeof UserDataSchema>

export type PAToken = Static<typeof PATokenSchema>

export enum HTTPResponses {
	OK = 200,
	CREATED = 201,
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	NOT_FOUND = 404,
	CONFLICT = 409,
	SERVER_ERROR = 500,
}

export type ReviewState = "verified" | "pending" | "unsubmitted" | "rejected"

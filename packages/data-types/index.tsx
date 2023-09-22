import {Static, Type} from '@sinclair/typebox'
import {Format} from '@sinclair/typebox/format'
import { coerce } from 'semver'

export interface PackEntry {
    added: number,
    downloads: { [key: string]: number }
    updated: number
    owner: string
}

Format.Set('semver', (v) => coerce(v) != null)
console.log(Format.Has('semver'))

export const supportedMinecraftVersions = [
    '1.17',
    '1.17.1',
    '1.18',
    '1.18.1',
    '1.18.2',
    '1.19',
    '1.19.4',
    '1.20',
    '1.20.1'
]
export const latestMinecraftVersion = '1.20.1'


export const MinecraftVersionSchema = Type.Union(supportedMinecraftVersions.map(v => Type.Literal(v)))

export const packCategories = [ 
    'Extensive' ,
    'Lightweight' ,
    'QoL' ,
    'Vanilla+' ,
    'Tech' ,
    'Magic' ,
    'Library' ,
    'Exploration' ,
    'World Overhaul' ,
    'No Resource Pack'
]

export const PackReferenceSchema = Type.Object({
    id: Type.String(),
    version: Type.String()
})

export const PackCategorySchema = Type.Union(packCategories.map(c => Type.Literal(c)))

export const PackVersionSchema = Type.Object({
    name: Type.String({minLength: 1}),
    downloads: Type.Partial(Type.Object({
        datapack: Type.String(),
        resourcepack: Type.String()
    }), {minProperties: 1}),
    supports: Type.Array(MinecraftVersionSchema, {minItems: 1}),
    dependencies: Type.Array(PackReferenceSchema)
})

export const PackDataSchema = Type.Object({
    id: Type.String({minLength: 3}),
    display: Type.Object({
        name: Type.String({minLength: 3}),
        description: Type.String({minLength: 3}),
        icon: Type.String({default: ''}),
        hidden: Type.Boolean({default: false}),
        webPage: Type.Optional(Type.String()),
        urls: Type.Optional(Type.Object({
            discord: Type.Optional(Type.String()),
            source: Type.Optional(Type.String()),
            homepage: Type.Optional(Type.String())
        }))
    }),
    versions: Type.Array(PackVersionSchema, {minItems: 1}),
    categories: Type.Array(PackCategorySchema)
})

export const MetaDataSchema = Type.Object({
    docId: Type.String(),
    rawId: Type.String(),
    stats: Type.Object({
        updated: Type.Optional(Type.Number()),
        added: Type.Number(),
        downloads: Type.Object({
            total: Type.Number(),
            today: Type.Number()
        })
    }),
    owner: Type.String(),
    contributors: Type.Array(Type.String(), {default: []})
})

export const BundleSchema = Type.Object({
    owner: Type.String(),
    name: Type.String(),
    version: MinecraftVersionSchema,
    packs: Type.Array(PackReferenceSchema),
    public: Type.Boolean(),
    uid: Type.Optional(Type.String())
})

export const UserDataSchema = Type.Object({
    displayName: Type.String(),
    cleanName: Type.String(),
    creationTime: Type.Number(),
    pfp: Type.Optional(Type.String()),
    uid: Type.String()
})

export enum SortOptions {
    Trending = "trending",
    Downloads = "downloads",
    Alphabetically = "alphabetically",
    Newest = "newest"
}
export const SortSchema = Type.Enum(SortOptions, {default: SortOptions.Downloads})

export type PackMetaData = Static<typeof MetaDataSchema>
export type MinecraftVersion = Static<typeof MinecraftVersionSchema>
export type PackDependency = Static<typeof PackReferenceSchema>
export type PackVersion = Static<typeof PackVersionSchema>
export type PackData = Static<typeof PackDataSchema>
export type PackBundle = Static<typeof BundleSchema>
export type PackReference = Static<typeof PackReferenceSchema>

export type UserData = Static<typeof UserDataSchema>

export enum HTTPResponses {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    SERVER_ERROR = 500   
}

export type ReviewState = 'verified'|'pending'|'unsubmitted'|'rejected'
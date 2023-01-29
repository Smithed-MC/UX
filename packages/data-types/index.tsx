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
    '1.18',
    '1.18.1',
    '1.18.2',
    '1.19'
]

const MinecraftVersionSchema = Type.Union(supportedMinecraftVersions.map(v => Type.Literal(v)))

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

const PackDependencySchema = Type.Object({
    id: Type.String(),
    version: Type.String()
})

export const PackVersionSchema = Type.Object({
    name: Type.String(),
    downloads: Type.Object({
        datapack: Type.String(),
        resourcepack: Type.String()
    }),
    supports: Type.Array(MinecraftVersionSchema),
    dependencies: Type.Array(PackDependencySchema)
})

export const PackDataSchema = Type.Object({
    id: Type.String(),
    display: Type.Object({
        name: Type.String(),
        description: Type.String(),
        icon: Type.String({default: ''}),
        hidden: Type.Boolean({default: false}),
        webPage: Type.Optional(Type.String())
    }),
    versions: Type.Array(PackVersionSchema),
    categories: Type.Array(Type.Union(packCategories.map(c => Type.Literal(c))))
})

export type MinecraftVersion = Static<typeof MinecraftVersionSchema>
export type PackDependency = Static<typeof PackDependencySchema>
export type PackVersion = Static<typeof PackVersionSchema>
export type PackData = Static<typeof PackDataSchema>

export interface UserData {
    displayName: string
}

export enum HTTPResponses {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409
}

export type ReviewState = 'verified'|'pending'|'unsubmitted'|'rejected'
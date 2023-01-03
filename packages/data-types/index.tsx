export interface PackEntry {
    added: number,
    downloads: { [key: string]: number }
    updated: number
    owner: string
}

export type MinecraftVersion = '1.18' | '1.18.1' | '1.18.2' | '1.19'

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

export interface PackDependency {
    id: string
    version: string
}

export interface PackVersion {
    name: string
    downloads: {
        datapack: string
        resourcepack: string
    }
    supports: MinecraftVersion[],
    dependencies: PackDependency[]
}

export interface PackData {
    id: string,
    display: {
        name: string,
        description: string
        icon: string,
        hidden: boolean
        webPage?: string
    },
    versions: PackVersion[],
    categories: string[]
}

export interface UserData {
    displayName: string
}
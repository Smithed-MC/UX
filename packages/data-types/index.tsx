export interface PackEntry {
    added: number,
    downloads: {[key: string]: number}
    updated: number
    owner: string
}

export type MinecraftVersion = '1.18'|'1.18.1'|'1.18.2'|'1.19'

export interface PackVersion {
    name: string
    downloads: {
        datapack: string
        resourcepack: string
    }
    supports: MinecraftVersion[]
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
    versions: PackVersion[]
}

export interface UserData {
    displayName: string
}
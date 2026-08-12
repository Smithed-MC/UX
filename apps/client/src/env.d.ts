/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_NIGHTLY
	readonly VITE_API_SERVER
	readonly VITE_BUILD_HASH: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}

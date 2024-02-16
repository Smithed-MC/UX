/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_NIGHTLY
	readonly VITE_API_SERVER
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}

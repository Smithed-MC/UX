/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_NIGHTLY
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
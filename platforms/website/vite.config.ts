import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import svgr from "vite-plugin-svgr"

// https://vitejs.dev/config/
export default ({ mode }) => {
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) } // <-
	console.log("VITE_NIGHTLY", process.env.VITE_NIGHTLY)
	console.log("VITE_API_SERVER", process.env.VITE_API_SERVER)
	console.log("VITE_BUILD_HASH", process.env.VITE_BUILD_HASH)

	return defineConfig({
		plugins: [svgr(), react()],
		resolve: {
			alias: {
				"node:url": "url",
				"import.meta.env.VITE_API_SERVER":
					process.env.VITE_API_SERVER ?? "https://api.smithed.dev/v2",
				"import.meta.env.VITE_FIREBASE_EMULATOR": process.env.VITE_FIREBASE_EMULATOR
			},
		},
		define: {
			"import.meta.env.VITE_NIGHTLY":
				process.env.VITE_NIGHTLY && process.env.VITE_NIGHTLY === "true"
					? true
					: false,
			"import.meta.env.VITE_BUILD_HASH": JSON.stringify(
				process.env.VITE_BUILD_HASH ?? ""
			),
		},
		build: {
			ssrEmitAssets: true,
			ssrManifest: true,
		},
	})
}

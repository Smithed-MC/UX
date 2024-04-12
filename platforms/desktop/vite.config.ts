import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import svgr from "vite-plugin-svgr"

export default ({ mode }) => {
	loadEnv(mode, "")
	console.log("VITE_NIGHTLY", process.env.VITE_NIGHTLY)
	console.log("VITE_API_SERVER", process.env.VITE_API_SERVER)
		
	return defineConfig({
		plugins: [svgr(), react()], // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
		// prevent vite from obscuring rust errors
		clearScreen: false,
		// tauri expects a fixed port, fail if that port is not available
		server: {
			port: 1420,
			strictPort: true,
		},
		define: {
			"import.meta.env.VITE_API_SERVER": '"https://api.smithed.dev/v2"'
		},
		envPrefix: ["VITE_", "TAURI_"],
		build: {
			// Tauri supports es2021
			target: ["es2021", "chrome100", "safari13"],
			// don't minify for debug builds
			minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
			// produce sourcemaps for debug builds
			sourcemap: !!process.env.TAURI_DEBUG,
		},
	})
}

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }; // <-
  console.log('VITE_NIGHTLY', process.env.VITE_NIGHTLY)

  return defineConfig({
    plugins: [svgr(), react()],
    resolve: {
      alias: {
        "node:url": 'url'
      },
    },
    define: {
      "import.meta.env.VITE_NIGHTLY": process.env.VITE_NIGHTLY ? true : false
    },
    build: {
      ssrEmitAssets: true,
      ssrManifest: true
    }
  })
}

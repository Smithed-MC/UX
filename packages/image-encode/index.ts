import { Buffer } from "buffer"
import { PNG } from "pngjs/browser"

export function encodePixelArray(rawPixels: number[][], palette: number[][]) {
	const w = rawPixels.length
	const h = rawPixels[0].length

	/// RGBA input (color type 6)

	const png = new PNG({ width: w, height: h })

	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			let idx = (w * y + x) << 2

			const color = palette[rawPixels[y][x]]

			png.data[idx] = color[0]
			png.data[idx + 1] = color[1]
			png.data[idx + 2] = color[2]
			png.data[idx + 3] = color[3]
		}
	}
	const buffer = PNG.sync.write(png)
	return buffer
}

import * as fs from "fs"

export async function deleteTempFiles() {
	console.log("Deleting old temp files...")
	for (let file of fs.readdirSync("temp")) {
		const fileStat = fs.statSync("temp/" + file)
		const ctimeDiff = Date.now() - fileStat.ctimeMs
		if (ctimeDiff > 3600 * 1000) {
			fs.rmSync("temp/" + file, { recursive: true, force: true })
		}
	}
}

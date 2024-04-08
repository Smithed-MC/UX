dotenv.config()
import { API_APP, setupApp } from "./app.js"
import dotenv from "dotenv"
import { calculateDownloads } from "./tasks/createMetrics.js"
import { deleteTempFiles } from "./tasks/deleteTempFiles.js"
import { updateGalleries } from "./tasks/updateGalleries.js"

export type Queryable =
	| FirebaseFirestore.Query
	| FirebaseFirestore.CollectionReference

async function executeTasks(ignoreTime?: boolean) {
	console.log("Running tasks...")
	const now = new Date()

	if (now.getMinutes() % 60 === 30 || ignoreTime) {
		calculateDownloads()
		// checkIndices();
	}

	deleteTempFiles()
}

async function listen(port: number) {
	console.log("Starting to listen on ", port)

	await setupApp()
	await API_APP.listen({
		port: port,
		host: process.env.DOCKER ? "0.0.0.0" : "127.0.0.1",
	})

	executeTasks(process.env.TEST_TASKS == "true")
	setInterval(executeTasks, 60 * 1000)
}

if (process.env.PORT) listen(Number.parseInt(process.env.PORT))
else listen(9000)

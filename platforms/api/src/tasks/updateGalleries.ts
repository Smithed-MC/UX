import { getFirestore } from "firebase-admin/firestore"
import { API_APP } from "../app.js"
import { updateGalleryData } from "../routes/packs/id/index.js"

export async function updateGalleries() {
	API_APP.log.info("Calculating Metrics...")
	const docs = await getFirestore().collection("packs").listDocuments()

	for (const doc of docs) {
		const docData = (await doc.get()).data()
		if (docData === undefined) continue
		const packData = docData.data
		if (packData === undefined) continue

		if (packData.display?.gallery) {
			console.log("Updated", packData.display.name)
			await updateGalleryData(packData, undefined)
			console.log(packData.display.gallery)
			await doc.set({
			    data: {
			        display: {
			            gallery: packData.display.gallery
			        }
			    }
			}, {merge: true})
		}
	}

    console.log("done")
}

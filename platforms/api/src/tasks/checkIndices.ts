import { DocumentReference, getFirestore } from "firebase-admin/firestore";
import { API_APP } from "../app.js";

function generateIndex(field: string, minLength: number) {
    field = field.toLowerCase()
    let indices: string[] = []
    for (let c = 0; c < field.length; c++) {
        for (let l = c + minLength; l <= field.length; l++) {
            indices.push(field.substring(c, l))
        }
    }
    return indices.sort((a, b) => a.length - b.length)
}

function indexData(name: string, id: string) {
    name = name.toLowerCase();
    let indices: string[] = [];

    const add = (s: string) => { if (!indices.includes(s)) indices.push(s) }

    name.split(/[\s_-]/).forEach(s => generateIndex(s, 3).forEach(i => add(i)))
    generateIndex(name, 3).forEach(s => add(s))
    generateIndex(id, 1).forEach(s => add(s))
    return indices
}

export async function checkIndices() {
    API_APP.log.info('Calculating Metrics...')
    const docs = await getFirestore().collection("packs").listDocuments()


    for (const doc of docs) {
        const packData = (await doc.get()).data()
        if (packData === undefined)
            continue;
        if (packData['_indices'] == undefined && packData.data !== undefined) {
            packData['_indices'] = indexData(packData.data.display.name, packData.id);
            await doc.set(packData)
        }

    }
}
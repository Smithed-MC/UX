import { PackData, PackMetaData, UserData } from "data-types"
import { correctGithubLinks } from "formatters"

async function getPack(id: string) {
	const response = await fetch(
		import.meta.env.VITE_API_SERVER + `/packs/${id}`
	)
	if (!response.ok) return undefined
	const data = await response.json()
	return data as PackData
}

async function getMeta(id: string) {
	const response = await fetch(
		import.meta.env.VITE_API_SERVER + `/packs/${id}/meta`
	)
	if (!response.ok) return undefined
	const data = await response.json()
	return data as PackMetaData
}

async function getOwner(id: string) {
	const response = await fetch(
		import.meta.env.VITE_API_SERVER + `/users/${id}`
	)
	if (!response.ok) return undefined
	const data = await response.json()
	return data as UserData
}

async function getReadMe(packData?: PackData) {
	if (packData !== undefined && packData.display.webPage !== undefined && packData.display.webPage.startsWith("https://")) {
		// console.log(packData.display.webPage)
		try {
			const response = await fetch(
				correctGithubLinks(packData.display.webPage)
			)
			// console.log(response.status, response.statusText)
			if (response.ok) {
				// console.log('returning text')
				return await response.text()
			}
		} catch {
			return "An error occured loading pack's readme"
		}
	}
	return packData?.display.description ?? "No ReadMe has been specified"
}
export default async function loadPackData({ params }: any) {
	const id: string = params.id
	const [packData, metaData] = await Promise.all([getPack(id), getMeta(id)])

	const [fullview, owner] = await Promise.all([
		getReadMe(packData),
		getOwner(metaData?.owner ?? ""),
	])

	return { packData, metaData, fullview, owner }
}

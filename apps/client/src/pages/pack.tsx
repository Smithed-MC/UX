import { useLoaderData, useParams } from "react-router-dom"
import React, { useEffect, useState } from "react"
import { PackData, PackMetaData, UserData } from "data-types"
import PackInfo from "../widget/packInfo"
import Download from "../widget/download"
import { DownloadButton, Spinner } from "components"
import "./pack.css"
import { Helmet } from "react-helmet"
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

async function getFullview(packData?: PackData) {
	if (packData !== undefined && packData.display.webPage !== undefined) {
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
	return ""
}

export async function loadPackData({ params }: any) {
	const id: string = params.id
	const [packData, metaData] = await Promise.all([getPack(id), getMeta(id)])

	const [fullview, owner] = await Promise.all([
		getFullview(packData),
		getOwner(metaData?.owner ?? ""),
	])

	return { packData, metaData, fullview, owner }
}

export default function Packs({
	packDownloadButton,
	showBackButton,
}: PacksProps) {
	const { id: id } = useParams()
	const data = useLoaderData() as any

	const packData: PackData = data.packData
	// console.log(packData)

	// if (packData === undefined) return <div className="container" style={{ width: '100%', height: '100%', gap: 8, boxSizing: 'border-box' }}>
	//     <h1 style={{ color: 'var(--disturbing)', marginBottom: 0 }}>Error 404</h1>
	//     <label style={{ fontSize: '1.5rem', marginBottom: 16 }}>That pack could not be found!</label>
	//     <a className="button" href="/browse" style={{ padding: 12, borderRadius: 'var(--defaultBorderRadius)' }}>Back to Browse</a>
	// </div>

	// if (data === undefined) return <div className="container" style={{ width: '100%', height: '95vh' }}>
	//     <Spinner />
	// </div>

	return (
		<div className="" style={{ width: "100%", boxSizing: "border-box" }}>
			<Helmet>
				<title>{packData.display.name}</title>
				<meta
					name="description"
					content={packData.display.description}
				/>
				<meta name="og:image" content={packData.display.icon} />
				<meta name="og:site_name" content="Smithed" />
			</Helmet>
			<div
				className="container"
				style={{
					gap: 16,
					height: "100%",
					boxSizing: "border-box",
					width: "100%",
					justifyContent: "safe start",
					alignItems: "safe center",
				}}
			>
				<PackInfo
					yOffset={/*window.scrollY*/ 0}
					id={id ?? ""}
					fixed={false}
					onClose={() => {}}
					downloadButton={packDownloadButton}
					showBackButton={showBackButton}
				/>
			</div>
		</div>
	)
}

export interface PacksProps {
	packDownloadButton: DownloadButton
	showBackButton: boolean
}

import { useLoaderData, useParams } from "react-router-dom"
import { PackData } from "data-types"
import PackInfo from "../../../widget/packInfo"
import { DownloadButton } from "components"
import "./index.css"
import { Helmet } from "react-helmet"


export default function Packs() {
	const { id: id } = useParams()
	const data = useLoaderData() as any

	const packData: PackData = data.packData
	// console.log(packData)

	// if (packData === undefined) return <div className="container" style={{ width: '100%', height: '100%', gap: 8, boxSizing: 'border-box' }}>
	//     <h1 style={{ color: 'var(--disturbing)', marginBottom: 0 }}>Error 404</h1>
	//     <label style={{ fontSize: '1.5rem', marginBottom: 16 }}>That pack could not be found!</label>
	//     <Link className="button" to="/browse" style={{ padding: 12, borderRadius: 'var(--defaultBorderRadius)' }}>Back to Browse</Link>
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
					id={id ?? ""}
					fixed={false}
					onClose={() => {}}
				/>
			</div>
		</div>
	)
}

export interface PacksProps {
	packDownloadButton: DownloadButton
	showBackButton: boolean
}

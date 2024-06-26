import { CSSProperties, useEffect, useRef, useState } from "react"
import { PackBundle, PackData, PackEntry, PackMetaData } from "data-types"
import { formatDownloads, prettyTimeDifference } from "formatters"
import { ReactComponent as QuestionMark } from "./assets/question-mark.svg"
import { useMatch, useNavigate } from "react-router-dom"
import "./PackCard.css"
import { compare, coerce } from "semver"
import { User } from "firebase/auth"
import IconTextButton from "./IconTextButton.js"
import { Edit, Right } from "./svg.js"
import Link from "./Link"

interface PackCardProps {
	id: string
	packEntry?: PackEntry
	packData?: PackData
	state?: "editable" | "add"
	style?: CSSProperties
	parentStyle?: CSSProperties
	bundleData?: PackBundle
	user?: User | null
	onClick?: () => void
	addWidget?: JSX.Element
	[key: string]: any
}

export default function PackCard({
	id,
	packData,
	onClick,
	state,
	style,
	parentStyle,
	bundleData,
	user,
	addWidget,
	...props
}: PackCardProps) {
	const [data, setData] = useState<PackData | undefined>(packData)
	const [metaData, setMetaData] = useState<PackMetaData>()
	const [fallback, setFallback] = useState(false)
	const [author, setAuthor] = useState("")
	const [loaded, setLoaded] = useState(false)
	const [contained, setContained] = useState(false)
	const [validForBundle, setValidForBundle] = useState(false)
	const [showInvalidTooltip, setShowInvalidTooltip] = useState(false)

	const match = useMatch("/browse")
	const card = useRef<HTMLDivElement>(null)
	const navigate = useNavigate()

	async function getData() {
		const response = await fetch(
			import.meta.env.VITE_API_SERVER + `/packs/${id}`
		)
		if (!response.ok) return void setData(undefined)
		const data = await response.json()
		setData(data)
	}

	async function getAuthor(ownerId: string) {
		const response = await fetch(
			import.meta.env.VITE_API_SERVER + `/users/${ownerId}`
		)
		if (!response.ok) return void setAuthor("")
		const data = await response.json()
		setAuthor(data.displayName)
	}

	async function onLoad() {
		const metaDataResponse = await fetch(
			import.meta.env.VITE_API_SERVER + `/packs/${id}/meta`
		)
		if (!metaDataResponse.ok) {
			setData(undefined)
			return
		}
		const metaData = await metaDataResponse.json()

		await Promise.all([getData(), getAuthor(metaData.owner)])

		setMetaData(metaData)

		setLoaded(true)
		setFallback(false)
	}

	async function onAddClick() {
		console.log("ran")
		if (bundleData === undefined || user == null || data === undefined)
			return

		console.log(id, bundleData.packs)

		if (bundleData.packs.map((p) => p.id).includes(id)) {
			bundleData.packs.splice(
				bundleData.packs.findIndex((p) => p.id === id),
				1
			)
			setContained(false)
		} else {
			setContained(true)
			const latestVersion = data?.versions
				.filter((v) => v.supports.includes(bundleData.version))
				.sort((a, b) =>
					compare(coerce(a.name) ?? "", coerce(b.name) ?? "")
				)
				.reverse()[0]

			bundleData.packs.push({
				id: id,
				version: latestVersion.name,
			})
		}

		const token = await user.getIdToken()

		await fetch(
			import.meta.env.VITE_API_SERVER +
				`/bundles/${bundleData.uid}?token=${token}`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ data: bundleData }),
			}
		)
	}

	useEffect(() => {
		setContained(bundleData?.packs.find((p) => p.id === id) !== undefined)
	}, [bundleData])
	useEffect(() => {
		if (data === undefined || !(data.versions instanceof Array)) return
		setValidForBundle(
			bundleData !== undefined &&
				data?.versions.findIndex((v) =>
					v.supports.includes(bundleData.version)
				) === -1
		)
	}, [bundleData, data])

	useEffect(() => {
		onLoad()
	}, [id])

	if (data === undefined) return <div style={{ ...style }} />

	if (!data || (data.display.hidden && match))
		return (
			<div className="packCard" style={{ ...style }} {...props}>
				<div
					className="container"
					style={{
						flexDirection: "row",
						alignItems: "flex-start",
						gap: 16,
						width: "100%",
					}}
				>
					<div
						style={{
							display: "block",
							width: 32,
							height: 32,
							backgroundColor: "var(--section)",
							borderRadius: "var(--defaultBorderRadius)",
							overflow: "hidden",
							flexBasis: "max-content",
							flexShrink: "0",
						}}
					>
						<div className="packCardImage" />
					</div>
					<div
						className="container fadeOut"
						style={{
							alignItems: "start",
							flexGrow: 1,
							gap: 8,
							width: "100%",
						}}
					>
						<label
							className=""
							style={{
								fontSize: "1.5rem",
								backgroundColor: "var(--background)",
								maxWidth: 256,
								width: "100%",
								height: 24,
							}}
						/>
						<label
							className=""
							style={{
								fontSize: "1.5rem",
								backgroundColor: "var(--background)",
								width: "100%",
								height: 16,
							}}
						/>
					</div>
				</div>
			</div>
		)

	return (
		<div className="cardContainer" style={{ ...parentStyle }}>
			<div
				className="packCard"
				key={id}
				ref={card}
				onClick={(e) => {
					if (
						!(
							e.target instanceof HTMLDivElement ||
							e.target instanceof HTMLLabelElement
						)
					)
						return
					// if (onClick) onClick()
				}}
				style={{ ...style }}
				{...props}
			>
				<div className="container packCardDetails">
					{!fallback && (
						<img
							className="packCardImage"
							src={data.display.icon}
							onError={() => setFallback(true)}
						/>
					)}
					{fallback && (
						<div className="container packCardImage">
							<QuestionMark />
						</div>
					)}
					<Link
						className="compactButton packCardName"
						style={{ fontWeight: 600 }}
						to={`/packs/${id}`}
					>
						{data.display.name}
					</Link>
					<p className="packCardDescription">
						{data.display.description}
					</p>
				</div>
				<div
					className="container"
					style={{
						width: "100%",
						flexBasis: "fit-content",
						flexShrink: 0,
						gap: "1rem",
						flexDirection: "row",
						position: "relative",
					}}
				>
					<div className="packCardInfo">
						<span>
							by{" "}
							<Link
								className="compactButton"
								to={`/${metaData?.owner}`}
							>
								{author}
							</Link>
						</span>
						<span className="packCardInfoSeperator">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="4"
								height="4"
								viewBox="0 0 4 4"
								fill="none"
							>
								<circle cx="2" cy="2" r="2" fill="#FFF8F0" />
							</svg>
						</span>
						{formatDownloads(metaData?.stats.downloads.total ?? 0)}{" "}
						Download
						{metaData?.stats.downloads.total === 1 ? "" : "s"}
						<span className="packCardInfoSeperator">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="4"
								height="4"
								viewBox="0 0 4 4"
								fill="none"
							>
								<circle cx="2" cy="2" r="2" fill="#FFF8F0" />
							</svg>
						</span>
						<span className="packCardUpdateInfo">
							{prettyTimeDifference(
								metaData?.stats.updated ??
									metaData?.stats.added ??
									0
							)}{" "}
							ago
						</span>
					</div>
					<div style={{ flexGrow: 1 }} />
					{state === "editable" && (
						<Link
							className="buttonLike accentedButtonLike"
							to={`/edit?pack=${id}`}
						>
							<Edit />
						</Link>
					)}
					{state === "add" && addWidget}
					<IconTextButton
						className="accentedButtonLike"
						text={"Open"}
						icon={Right}
						reverse={true}
						to={`/packs/${id}`}
					/>
				</div>
			</div>
		</div>
	)
}

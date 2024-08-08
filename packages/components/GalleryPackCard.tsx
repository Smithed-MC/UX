import {
	CSSProperties,
	FunctionComponent,
	SVGProps,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react"
import {
	PackBundle,
	PackData,
	PackEntry,
	Image,
	PackMetaData,
} from "data-types"
import { formatDownloads, prettyTimeDifference } from "formatters"
import "./GalleryPackCard.css"
import { compare, coerce } from "semver"
import { User } from "firebase/auth"
import { Download, Edit, FlagCrossed, Logo, Refresh, Right } from "./svg.js"
import { useNavigate } from "react-router-dom"
import Link from "./Link"
import { IconTextButton } from "."

interface PackCardProps {
	id: string
	packEntry?: PackEntry
	packData: PackData
	packMeta: PackMetaData
	packAuthor?: string
	state?: "editable" | "add"
	style?: CSSProperties
	parentStyle?: CSSProperties
	bundleData?: PackBundle
	user?: User | null
	onClick?: () => void
	addWidget?: JSX.Element
	[key: string]: any
}

function CarouselDot({
	selected,
	onClick,
}: {
	selected?: boolean
	onClick: () => void
}) {
	return (
		<div
			style={{ width: "0.5rem", height: "0.5rem" }}
			className="container"
			onClick={onClick}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="9"
				height="8"
				viewBox="0 0 9 8"
				fill="none"
			>
				<circle
					cx="4.5"
					cy="4"
					r="4"
					fill={selected ? "var(--foreground)" : "var(--border)"}
					style={{ transition: "all 0.2s ease-in-out" }}
				/>
			</svg>
		</div>
	)
}

function Badge({
	svg: Svg,
	title,
}: {
	svg: FunctionComponent<SVGProps<SVGSVGElement>>
	title: string
}) {
	return (
		<>
			<div
				style={{ width: "1rem", height: "1rem", position: "relative" }}
				title={title}
			>
				<Svg
					style={{
						width: "1rem",
						height: "1rem",
						position: "absolute",
					}}
				/>
			</div>
		</>
	)
}

export function getBadges(packData?: PackData, author?: string) {
	let badges: JSX.Element[] = []
	if (author === "Smithed") {
		badges.push(
			<Badge title="Official Pack" key="official" svg={Logo} />
		)
	}
	if (
		packData?.versions?.every(
			(v) =>
				v.downloads.resourcepack === undefined ||
				v.downloads.resourcepack === ""
		)
	)
		badges.push(
			<Badge title="No Resourcepack" key="no-rp" svg={FlagCrossed} />
		)

	return badges
}

export default function GalleryPackCard({
	id,
	packData,
	packMeta,
	onClick,
	state,
	style,
	parentStyle,
	bundleData,
	user,
	addWidget,
	packAuthor,
	ref,
	...props
}: PackCardProps) {
	const [data, setData] = useState<PackData | undefined>(packData)
	const [metaData, setMetaData] = useState<PackMetaData | undefined>(packMeta)

	const [author, setAuthor] = useState(packAuthor)

	const [badges, setBadges] = useState<JSX.Element[]>(getBadges(packData, author))

	const [displayGallery, setDisplayGallery] = useState(false)
	const [currentImage, setCurrentImage] = useState(0)

	const navigate = useNavigate()

	const card = useRef<HTMLDivElement>(null)

	

	const gallery = packData.display.gallery

	return (
		<div
			ref={ref}
			className={`galleryPackCardContainer${displayGallery ? " displayGallery" : ""}`}
			style={{ ...parentStyle }}
		>
			<div style={{ height: "100%", width: "100%" }}>
				<div
					className={`galleryPackCard${displayGallery ? " displayGallery" : ""}`}
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
					}}
					style={{ ...style }}
					{...props}
					onMouseLeave={() => {
						setDisplayGallery(false)
						setCurrentImage(0)
					}}
				>
					<div
						className="galleryImage"
						style={{
							position: "relative",
							backgroundColor: "var(--accent)",
						}}
					>
						{(!gallery || gallery.length == 0) && (
							<object
								style={{
									width: "100%",
									filter: "saturate(50%) brightness(50%)",
									backgroundColor: "var(--accent)",
								}}
								data={data?.display.icon}
								type="image/png"
							/>
						)}
						{gallery && gallery.length > 0 && (
							<img
								className="thumbnail"
								style={{ width: "100%", cursor: "pointer" }}
								src={((g: Image) =>
									typeof g === "object"
										? g.content ??
											`${import.meta.env.VITE_API_SERVER}/packs/${id}/gallery/${currentImage}`
										: g)(gallery[currentImage])}
								onClick={() => {
									setDisplayGallery(!displayGallery)
								}}
							/>
						)}
					</div>
					<div className="packInfo">
						<div
							className="container"
							style={{
								flexDirection: "row",
								fontWeight: 600,
								fontSize: "1.5rem",
								gridArea: "name",
								justifyContent: "start",
								width: "100%",
							}}
						>
							{data?.display.name}
							{!displayGallery && badges.length > 0 && (
								<>
									<div style={{ flexGrow: 1 }}></div>
									<div
										className="container"
										style={{
											flexDirection: "row",
											backgroundColor: "var(--bold)",
											borderRadius:
												"var(--defaultBorderRadius)",
											width: "min-content",
											padding: "0.5rem 1rem 0.5rem 1rem",
											gap: "1rem",
											maxHeight: "2rem",
										}}
									>
										{badges}
									</div>
								</>
							)}
						</div>
						<p
							className="description"
							style={{
								opacity: displayGallery ? 0 : undefined,
								width: displayGallery ? 0 : undefined,
								height: displayGallery ? 0 : undefined,
								display: displayGallery ? "none" : undefined,
							}}
						>
							{data?.display.description}
						</p>
						<span
							className="author"
							style={{
								opacity: displayGallery ? 0 : undefined,
								width: displayGallery ? 0 : undefined,
								height: displayGallery ? 0 : undefined,
								display: displayGallery ? "none" : undefined,
							}}
						>
							{`by `}
							<Link
								style={{ color: "var(--foreground)" }}
								to={`/${author}`}
							>
								{author}
							</Link>
							{data?.categories && data.categories.length > 0
								? " • " + data?.categories[0]
								: ""}
						</span>
						<div
							className="container"
							style={{
								flexDirection: "row",
								gap: "1rem",
								placeSelf: "end",
								gridArea: "open",
							}}
						>
							{/* {addWidget} */}
							{state === "editable" && (
								<Link
									className="buttonLike accentedButtonLike"
									to={"/packs/" + id + "/edit"}
								>
									<Edit />
								</Link>
							)}
							<IconTextButton
								className="accentedButtonLike"
								text={"Open"}
								icon={Right}
								reverse={true}
								href={`/packs/${metaData ? metaData.rawId : id}`}
							/>
						</div>
					</div>
					<div className="footer">
						<Download style={{ width: "1rem", height: "1rem" }} />
						{formatDownloads(metaData?.stats.downloads.total ?? 0)}
						<div
							style={{
								width: "0.25rem",
								height: "0.25rem",
								backgroundColor: "var(--foreground)",
								opacity: 0.5,
								borderRadius: "50%",
							}}
						/>
						<Refresh style={{ width: "1rem", height: "1rem" }} />
						{prettyTimeDifference(
							metaData?.stats.updated ??
								metaData?.stats.added ??
								0
						)}{" "}
						ago
					</div>
				</div>
			</div>
		</div>
	)
}

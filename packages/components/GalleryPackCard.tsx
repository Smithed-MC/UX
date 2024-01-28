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
	PackGalleryImage,
	PackMetaData,
} from "data-types"
import { formatDownloads, prettyTimeDifference } from "formatters"
import "./GalleryPackCard.css"
import { compare, coerce } from "semver"
import { User } from "firebase/auth"
import { IconTextButton } from "./IconTextButton.js"
import { Download, Edit, FlagCrossed, Logo, Refresh, Right } from "./svg.js"
import { useNavigate } from "react-router-dom"

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
	const [gallery, setGallery] = useState<PackGalleryImage[] | undefined>(
		undefined
	)
	const [fallback, setFallback] = useState<boolean>(false)
	const [author, setAuthor] = useState(packAuthor)

	const [badges, setBadges] = useState<JSX.Element[]>([])

	const [displayGallery, setDisplayGallery] = useState(false)
	const [currentImage, setCurrentImage] = useState(0)

	const navigate = useNavigate()

	const card = useRef<HTMLDivElement>(null)

	async function onLoad() {
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

		setBadges(badges)
		setData(packData)
		setMetaData(packMeta)
		setAuthor(packAuthor)

		if (!packData.display.icon) {
			setFallback(true)
		}
	}

	async function populateGallery() {
		const resp = await fetch(
			import.meta.env.VITE_API_SERVER + "/packs/" + id + "/gallery"
		)

		if (!resp.ok) return

		setGallery(await resp.json())
	}
	useEffect(() => {
		populateGallery()
	}, [data])
	useMemo(() => {
		onLoad()
	}, [id])

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
						style={{ position: "relative" }}
					>
						{fallback && (
							<div
								style={{
									backgroundColor: "var(--accent)",
									width: "100%",
									height: "100%",
									flexGrow: 1,
								}}
							/>
						)}
						{(!gallery || gallery.length == 0) && !fallback && (
							<img
								style={{
									width: "100%",
									filter: "saturate(50%) brightness(50%)",
								}}
								src={data?.display.icon}
								onError={(e) => {
									setFallback(true)
								}}
								onClick={() => {
									if (!card.current) return

									const animation =
										"galleryPackCardShake 0.3s ease-in-out"
									if (
										card.current.style.animation ===
										animation
									)
										return

									card.current.style.setProperty(
										"animation",
										animation
									)
									setTimeout(
										() =>
											card.current?.style.removeProperty(
												"animation"
											),
										0.4 * 1000
									)
								}}
							/>
						)}
						{gallery && gallery.length > 0 && (
							<img
								className="thumbnail"
								style={{ width: "100%", cursor: "pointer" }}
								src={((g: PackGalleryImage) =>
									typeof g === "object"
										? g.content ??
											`${import.meta.env.VITE_API_SERVER}/packs/${id}/gallery/${currentImage}`
										: g)(gallery[currentImage])}
								onClick={() => {
									setDisplayGallery(!displayGallery)
								}}
							/>
						)}
						{displayGallery && gallery && (
							<div className="carousel">
								<button
									className="buttonLike"
									style={{
										height: "2.5rem",
										backgroundColor: "var(--background)",
									}}
									onClick={() => {
										if (currentImage == 0) {
											setCurrentImage(
												(gallery.length ?? 1) - 1
											)
										} else {
											setCurrentImage(
												Math.max(currentImage - 1, 0)
											)
										}
									}}
								>
									<Right
										style={{
											height: "1rem",
											color: "var(--foreground)",
											scale: "-1",
										}}
									/>
								</button>
								<div
									className="container"
									style={{
										padding: "1rem 2rem",
										backgroundColor: "var(--background)",
										borderRadius: "2rem",
										gap: "1rem",
										flexDirection: "row",
									}}
								>
									{gallery.map((_, i) => (
										<CarouselDot
											key={"carouselDot" + i}
											selected={currentImage === i}
											onClick={() => setCurrentImage(i)}
										/>
									))}
								</div>
								<button
									className="buttonLike"
									style={{
										height: "2.5rem",
										backgroundColor: "var(--background)",
									}}
									onClick={() => {
										if (
											currentImage ==
											(gallery?.length ?? 1) - 1
										) {
											setCurrentImage(0)
										} else {
											setCurrentImage(
												Math.min(
													currentImage + 1,
													(gallery?.length ?? 1) - 1
												)
											)
										}
									}}
								>
									<Right
										style={{
											height: "1rem",
											color: "var(--foreground)",
										}}
									/>
								</button>
							</div>
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
							<a
								style={{ color: "var(--text)" }}
								href={`/${author}`}
							>
								{author}
							</a>
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
							{addWidget}
							{state === "editable" && (
								<a
									className="buttonLike accentedButtonLike"
									href={"/edit?pack=" + id}
								>
									<Edit />
								</a>
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

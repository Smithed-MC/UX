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
import { formatDownloads, prettyTimeDifference, sanitize } from "formatters"
import "./GalleryPackCard.css"
import { compare, coerce } from "semver"
import { User } from "firebase/auth"
import {
	Download,
	Edit,
	FlagCrossed,
	Folder,
	Logo,
	Refresh,
	Right,
} from "./svg.js"
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
				style={{
					width: "1.25rem",
					height: "1.25rem",
					position: "relative",
				}}
				title={title}
			>
				<Svg
					style={{
						width: "1.25rem",
						height: "1.25rem",
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
		badges.push(<Badge title="Official Pack" key="official" svg={Logo} />)
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

export function GalleryImage({
	onClick,
	onError,
	currentImage,
	packId,
}: {
	onClick: () => void
	onError: () => void
	currentImage: number
	packId: string
}) {
	return (
		<img
			id={"thumbnail"}
			className="thumbnail"
			style={{
				width: "100%",
				cursor: "pointer",
				overflow: "hidden",
				aspectRatio: "16 / 9",
				opacity: 0,
				transition: "opacity 0.1s ease-out",
			}}
			onClick={onClick}
			src={`${import.meta.env.VITE_API_SERVER}/packs/${packId}/gallery/${currentImage}`}
			onLoad={(e) => {
				e.currentTarget.style.setProperty("opacity", "1")
			}}
			onError={onError}
		/>
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
	user,
	addWidget,
	packAuthor,
	ref,
	...props
}: PackCardProps) {
	const [data, setData] = useState<PackData | undefined>(packData)
	const [metaData, setMetaData] = useState<PackMetaData | undefined>(packMeta)

	const [author, setAuthor] = useState(packAuthor)

	const [badges, setBadges] = useState<JSX.Element[]>(
		getBadges(packData, author)
	)

	const [displayGallery, setDisplayGallery] = useState(false)
	const [currentImage, setCurrentImage] = useState(0)

	const navigate = useNavigate()

	const card = useRef<HTMLDivElement>(null)

	const gallery = packData.display.gallery

	useEffect(() => {
		const icon: HTMLImageElement = card.current!.querySelector("#packIcon")!
		icon.src = packData.display.icon
		if (gallery && gallery.length >= 1) {
			const thumbnail: HTMLImageElement =
				card.current!.querySelector("#thumbnail")!
			thumbnail.src = `${import.meta.env.VITE_API_SERVER}/packs/${id}/gallery/0`
		}
	}, [packData])

	return (
		<div
			ref={ref}
			className={`galleryPackCardContainer${displayGallery ? " displayGallery" : ""}`}
			style={{ ...parentStyle }}
		>
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
						aspectRatio: "16 / 9",
						zIndex: 0,
						overflow: "hidden",
					}}
				>
					<div
						className="container"
						style={{
							width: "100%",
							height: "100%",
							background: `repeating-linear-gradient(
									-45deg, 
									var(--background), 
									var(--background) 2rem, 
									color-mix(in srgb, var(--highlight), rgba(0,0,0,1) 50%) 2rem, 
									color-mix(in srgb, var(--highlight), rgba(0,0,0,1) 50%) 4rem
								)`,
							position: "absolute",
							zIndex: -1,
						}}
					>
						<span
							style={{
								fontSize: "1.5rem",
								fontWeight: 600,
								textAlign: "center",
								opacity: 0.3,
							}}
						>
							THE DEVELOPER IS TOO LAZY. NOT EVEN A SCREENSHOT IS
							HERE
						</span>
					</div>
					<img
						id="packIcon"
						style={{
							width: "100%",
							filter: "saturate(50%) brightness(50%)",
							position: "absolute",
							backgroundColor: "var(--section)",
							zIndex: -1,
							opacity: 0,
							transition: "opacity 0.1s ease-out",
						}}
						onClick={() => navigate(`/packs/${id}`)}
						src={data?.display.icon}
						onLoad={(e) =>
							e.currentTarget.style.setProperty("opacity", "1")
						}
					/>
					{gallery && gallery?.length > 0 && (
						<GalleryImage
							currentImage={currentImage}
							packId={id}
							onClick={() => navigate(`/packs/${id}`)}
							onError={() => {
								const carousel: HTMLDivElement =
									card.current!.querySelector(".carousel")!
								carousel.style.setProperty("opacity", "0")
							}}
						/>
					)}
					{gallery && gallery?.length > 1 && (
						<div
							className="infoBox container carousel"
							style={{
								right: "1rem",
								bottom: "1rem",
								gap: "0.5rem",
							}}
						>
							<button
								style={{
									padding: "0.25rem 0.5rem",
									height: "2rem",
									width: "2rem",
									backgroundColor: "var(--bold)",
									alignItems: "center",
									justifyContent: "center",
								}}
								onClick={() =>
									setCurrentImage(
										((currentImage == 0
											? gallery?.length
											: currentImage) -
											1) %
											gallery?.length
									)
								}
							>
								<Right
									style={{ transform: "rotate(180deg)" }}
								/>
							</button>
							<button
								style={{
									padding: "0.25rem 0.5rem",
									height: "2rem",
									width: "2rem",
									backgroundColor: "var(--bold)",
									alignItems: "center",
									justifyContent: "center",
								}}
								onClick={() =>
									setCurrentImage(
										(currentImage + 1) % gallery?.length
									)
								}
							>
								<Right />
							</button>
						</div>
					)}
					<div
						className="infoBox container"
						style={{
							bottom: "1rem",
							left: "1rem",
						}}
					>
						<div
							className="container"
							style={{ zIndex: 0, alignItems: "start" }}
						>
							<Link
								style={{
									fontSize: "0.8rem",
									color: "var(--foreground)",
									textDecoration: "none",
								}}
								to={"/" + sanitize(packAuthor ?? "")}
							>
								by {packAuthor}
							</Link>
							{packData.categories?.length >= 1 && (
								<span
									style={{
										opacity: 0.5,
										fontSize: "0.75rem",
									}}
								>
									{packData.categories[0]}
								</span>
							)}
						</div>
						{badges.length >= 1 && (
							<div
								style={{
									width: "0.125rem",
									height: "1.5rem",
									backgroundColor: "var(--foreground)",
								}}
							></div>
						)}
						{badges}
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
						metaData?.stats.updated ?? metaData?.stats.added ?? 0
					)}{" "}
					ago
				</div>
				<div className="packInfo">
					<div
						className="container"
						style={{
							flexDirection: "row",
							fontWeight: 600,
							fontSize: "1.25rem",
							gridArea: "name",
							justifyContent: "start",
							width: "100%",
							position: "relative",
							gap: "1rem",
							overflow: "hidden"
						}}
					>
						<span
							style={{
								flexShrink: 1,
								whiteSpace: "nowrap",
								textOverflow: "ellipsis",
								overflow: "hidden",
							}}
						>
							{data?.display.name}
						</span>
						<span
							style={{
								fontSize: "0.75rem",
								backgroundColor: "var(--bold)",
								borderRadius:
									"calc(var(--defaultBorderRadius) * 0.5)",
								padding: "0.25rem 0.5rem",
								fontWeight: "normal",
								width: "max-content",
								whiteSpace: "nowrap",
								alignSelf: "start",
							}}
						>
							{data?.versions
								.map((v) => v.supports)
								.reduce((p, c) => p.concat(c))
								.filter((v, i, a) => a.indexOf(v) == i)
								.sort((a, b) =>
									compare(coerce(a) ?? "", coerce(b) ?? "")
								)
								.filter(
									(v, i, a) => i == 0 || i == a.length - 1
								)
								.join(" - ")}
						</span>
					</div>
					<p
						className="description"
						style={{
							opacity: displayGallery ? 0 : undefined,
							width: displayGallery ? 0 : undefined,
							height: displayGallery ? 0 : undefined,
							display: displayGallery ? "none" : undefined,
							overflow: "hidden"
						}}
					>
						{data?.display.description}
					</p>
					<div
						className="container"
						style={{
							flexDirection: "row",
							gap: "1rem",
							placeSelf: "end",
							gridArea: "open",
							width: "100%",
							justifyContent: "end"
						}}
					>
						{state === "add" && addWidget}
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
			</div>
		</div>
	)
}

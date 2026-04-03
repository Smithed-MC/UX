import { IconInput, IconTextButton } from "components"
import {
	Account,
	At,
	Edit,
	Flag,
	QuestionMark,
	Right,
	SummitLogoFull,
} from "components/svg"
import { Helmet } from "react-helmet"
import { Divider } from "./home"

import GM4Booth from "../assets/summit/gm4_booth.webp"
import MainStage from "../assets/summit/main_stage.webp"
import Plushies from "../assets/summit/plushies.webp"

import GM4Logo from "../assets/summit/gm4_logo.svg"
import VTLogo from "../assets/summit/vt_logo.png"
import BeetLogo from "../assets/summit/beet_logo.png"
import StardustLogo from "../assets/summit/stardust_logo.png"
import MCCLogo from "../assets/summit/mcc_logo.png"
import MyriadLogo from "../assets/summit/myriad_logo.png"

import GImg1 from "../assets/summit/gallery/anvil.webp"
import GImg2 from "../assets/summit/gallery/bridge.webp"
import GImg3 from "../assets/summit/gallery/forest.webp"
import GImg4 from "../assets/summit/gallery/gondola_station.webp"
import GImg5 from "../assets/summit/gallery/lighthouse.webp"
import GImg6 from "../assets/summit/gallery/pine.webp"

import SummitMap from "../assets/summit/map.png"

import { ReactComponent as Artboard } from "../assets/summit/art-board.svg"

const GALLERY_IMAGES = [GImg1, GImg2, GImg3, GImg4, GImg5, GImg6]

import "./summit.css"
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"

const EMAIL_REGEX =
	/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g

export default function SummitPage() {
	const location = useLocation()
	const mainRef = useRef<HTMLDivElement | null>(null)

	function scrollTo(
		id: string,
		behavior: "smooth" | "auto" | "instant" = "smooth"
	) {
		if (id === "") return

		const rect = mainRef
			.current!.querySelector("#" + id)
			?.getBoundingClientRect()

		console.log(rect)

		if (rect == null) return

		document
			.getElementById("app")
			?.children.item(0)
			?.scrollBy({
				behavior: behavior,
				top: rect.top - rect.height / 2,
			})
	}

	useEffect(() => {
		if (import.meta.env.SSR) return

		setTimeout(() => scrollTo(location.hash.slice(1), "smooth"), 10)
	}, [])

	return (
		<div
			className="container summitPage"
			style={{
				width: "100%",
				boxSizing: "border-box",
				justifyContent: "safe start",
				gap: "4rem",
				paddingBottom: 80,
			}}
			ref={mainRef}
		>
			<Helmet>
				<title>Summit 2026</title>
				<meta
					name="description"
					content="Come explore Smithed's second ever in-game convention!"
				/>

				<meta name="og:image" content="/summit-logo.png" />
				<meta name="og:site_name" content="Smithed" />
			</Helmet>

			<div className="container" style={{ gap: "4rem" }}>
				<div
					className="container"
					style={{
						alignSelf: "center",
						textAlign: "center",
						color: "#BFDCF8",
						fontWeight: 500,
						gap: "1rem",
					}}
				>
					<Artboard style={{ flexGrow: 1 }} />A convention celebrating
					the community-made content of vanilla Minecraft
				</div>
				<div className="container" style={{}}>
					<span
						style={{
							color: "#00D269",
							fontSize: "2rem",
							fontWeight: 800,
						}}
					>
						SUMMER 2026
					</span>
					<span style={{ fontSize: "1.5rem", fontWeight: 700 }}>
						EVENT START
					</span>
				</div>
				<MapGallery images={GALLERY_IMAGES} />

				<div
					className="container"
					style={{
						borderRadius: "var(--defaultBorderRadius)",
						backgroundColor: "var(--section)",
						border: "0.125rem solid var(--border)",
						padding: "1rem",
						gap: "1rem",
						maxWidth: "52rem",
					}}
				>
					<div>
						Summit is a 2-week long in-game event where you will be
						able to check out handcrafted showcase booths, meet
						skilled creators from across the community, participate
						in informative panels, find collectibles and explore the
						interactive map with the help of our public transit
						system. <br /> <br />
						If you work on projects like datapacks, resourcepacks,
						maps, or development tools, Summit is a great
						opportunity to get the word out. You can apply to become
						a booth vendor and have a physical presence at the
						convention, or to hold a panel sharing your knowledge
						and experience with others. <br /> <br />
						Regardless of if you are giving a talk, exhibiting, or
						just a visitor, the event is entirely free; As long as
						you have Minecraft Java, you can join!
					</div>
					<IconTextButton
						className="accentedButtonLike"
						icon={Flag}
						text={"Reserve your booth"}
						href="/summit/apply"
					/>
				</div>
			</div>
			<div
				className="container"
				style={{ flexDirection: "row", gap: "1rem", width: "100%" }}
			>
				<Divider />
				<span
					style={{
						whiteSpace: "nowrap",
					}}
				>
					Tell me more!
				</span>
				<Divider />
			</div>
			<SummitSection
				id="booths"
				image={GM4Booth}
				imageDescription="Gamemode 4's booth on the Summit server"
				header={"CHECK OUT THE BOOTHS"}
				color="accent2"
			>
				Locations found all around the map, created by community members
				to showcase their work. They can include custom assets and
				interactive elements, even full gameplay experiences. Booth
				vendors are equipped with Summit-specific tooling, extending
				creative possibilities and ensuring the server runs as smoothly
				as possible.
				<br />
				<br />
				<span style={{ fontWeight: 700, color: "var(--accent2)" }}>
					Booth applications are now open!
				</span>
				<span>
					If you would like to become a booth vendor, submit an
					application via the form. We expect to be accepting
					applicants until May, but spots are limited, so it's best to
					apply as a soon as possible!
				</span>
				<IconTextButton
					className="lightAccentedButtonLike"
					text={"Apply for a booth"}
					icon={Edit}
					href="/summit/apply"
					style={{
						alignSelf: "end",
					}}
				/>
			</SummitSection>

			<SummitSection
				id="panels"
				image={MainStage}
				imageDescription="Summit's largest stage out of the 3 on the server."
				header={"WATCH THE PANELS"}
				color="success"
			>
				In-game talks given by community members about various topics.
				In the past, these have revolved around data pack game design,
				technical deep-dives into hard to learn features like worldgen,
				and broader looks into content creation among many others.
				<br /> <br />
				This year, we'll be opening panel applications at a later time.
				Look out for an announcement in the Smithed Discord for updates
				on when we open these applications if you are interested in
				hosting a panel this Summit.
				<br /> <br />
				<span>
					Check out panels previously held at Smithed Summit on{" "}
					<a href="https://www.youtube.com/watch?v=7mT7NhzGQHQ">
						YouTube
					</a>
					.
				</span>
				<IconTextButton
					disabled
					className="successButtonLike"
					text={"Applications coming soon"}
					icon={Edit}
					// href="/summit/apply"
					style={{
						alignSelf: "end",
					}}
				/>
			</SummitSection>
			<SummitSection
				id="collectibles"
				image={Plushies}
				imageDescription="Plushies of Smithie found around the world"
				header={"OTHER EVENTS"}
				color="disturbing"
			>
				Besides panels, you can expect additional events to happen
				throughout the convention, such as 2024's Fireside Chats. Stay
				tuned for more information as we get closer to summer!
			</SummitSection>
			<div
				className="container"
				style={{ flexDirection: "row", gap: "1rem", width: "100%" }}
			>
				<Divider />
				<span
					style={{
						whiteSpace: "nowrap",
					}}
				>
					RSVP
				</span>
				<Divider />
			</div>
			<div
				className="container"
				style={{ width: "100%", gap: "2.5rem" }}
				id="rsvp"
			>
				<Artboard style={{ height: "6rem" }} />
				<RSVP />
			</div>
			<div
				className="container"
				style={{ flexDirection: "row", gap: "1rem", width: "100%" }}
			>
				<Divider />
				<span
					style={{
						whiteSpace: "nowrap",
					}}
				>
					Previous event
				</span>
				<Divider />
			</div>
			<div className="container" style={{ gap: "2rem", width: "100%" }}>
				<span className="header" style={{ alignSelf: "center" }}>
					Summit{" "}
					<span style={{ color: "var(--disturbing)" }}>2024</span>'s
					Attendees & Server Map
				</span>
				<a href="/summit-map.png" style={{ width: "100%" }}>
					<img
						src={SummitMap}
						style={{ imageRendering: "pixelated", width: "100%" }}
					/>
				</a>
			</div>
		</div>
	)
}

function RSVP() {
	const [email, setEmail] = useState("")
	const [error, setError] = useState("")
	const [success, setSuccess] = useState(false)

	return (
		<>
			<div
				className="container"
				style={{
					gap: "1rem",
					flexDirection: "row",
					width: "100%",
					flexWrap: "wrap",
				}}
			>
				<div style={{ position: "relative" }}>
					<div
						className="container"
						style={{
							flexDirection: "row",
							gap: "0.5rem",
							fontWeight: 500,
							fontSize: "0.75rem",
							position: "absolute",
							bottom: "100%",
							marginBottom: "0.5rem",
							left: 0,
						}}
					>
						EMAIL
						<QuestionMark
							style={{ width: "1rem", height: "1rem" }}
							title="We'll use your email to send you updates about the event"
						/>
					</div>
					<IconInput
						icon={At}
						placeholder="example@smithed.net"
						defaultValue={email}
						onChange={(e) => setEmail(e.currentTarget.value)}
						style={{ width: "100%", maxWidth: "24rem" }}
					/>
				</div>
				<IconTextButton
					className="accentedButtonLike"
					icon={Right}
					reverse
					text={"RSVP"}
					disabled={!email.match(EMAIL_REGEX)}
					onClick={async () => {
						if (!email.match(EMAIL_REGEX)) return

						setError("")
						setSuccess(false)

						const resp = await fetch(
							import.meta.env.VITE_API_SERVER +
								"/email-lists/summit-26/subscribe?email=" +
								email,
							{ method: "POST" }
						)

						if (!resp.ok) {
							const error = await resp.json()
							return setError("Failed to RSVP\n" + error.message)
						}

						setSuccess(true)
					}}
				/>
			</div>
			{error !== "" && (
				<span style={{ color: "var(--disturbing)" }}>{error}</span>
			)}
			{success && (
				<span style={{ color: "var(--success)" }}>
					You have been RSVP'd
				</span>
			)}
		</>
	)
}

function AttendeeCard({
	image,
	name,
	website,
}: {
	image: string
	name: string
	website: string
}) {
	return (
		<div className="attendeeCard" key={name}>
			<img src={image} />
			<div
				className="container"
				style={{
					flexDirection: "column",
					justifyContent: "start",
					alignItems: "start",
				}}
			>
				<span className="name">{name}</span>
				<a className="website" href={website}>
					{website}
				</a>
			</div>
		</div>
	)
}

function SummitSection({
	id,
	image,
	imageDescription,
	header,
	children,
	color,
}: {
	id: string
	image: string
	imageDescription: string
	header: string
	children: any
	color: string
}) {
	const headerParts = header.split(" ")
	const headerStart = headerParts.slice(0, -1).join(" ")
	const headerEnd = headerParts.at(-1)

	return (
		<section key={header} id={id}>
			<div className="image">
				<img src={image} style={{ borderColor: `white` }} />
				{imageDescription}
			</div>
			<span className="header">
				{headerStart + " "}
				<span style={{ color: `var(--${color})` }}>{headerEnd}</span>
			</span>
			<div className="text">{children}</div>
		</section>
	)
}

function MapGallery({ images }: { images: string[] }) {
	const [index, setIndex] = useState(0)
	const currentImageRef = useRef<HTMLImageElement>(null)
	const timeoutRef = useRef<number>()
	const intervalRef = useRef<number>()

	const mod = (n: number, m: number) => ((n % m) + m) % m

	const cycleImage = useCallback(
		(direction: number) => {
			const image = currentImageRef.current!

			image.style.setProperty("filter", "blur(0.125rem) saturate(50%)")
			setTimeout(
				() => setIndex((i) => mod(i + direction, images.length)),
				150
			)
			clearInterval(intervalRef.current!)
			clearTimeout(timeoutRef.current)
			timeoutRef.current = setTimeout(startInterval, 1000)
		},
		[currentImageRef, intervalRef, timeoutRef]
	)

	const startInterval = useCallback(() => {
		intervalRef.current = setInterval(() => cycleImage(1), 5000)
	}, [intervalRef])

	useEffect(() => {
		startInterval()

		return () => {
			clearInterval(intervalRef.current!)
		}
	}, [])

	return (
		<div className="mapGallery">
			<div className="imageHolder">
				<img
					ref={currentImageRef}
					src={images[index]}
					onLoad={(e) => {
						e.currentTarget.style.setProperty("filter", "blur(0px)")
					}}
				/>
			</div>
			<div className="buttonHolder">
				<button onClick={() => cycleImage(-1)}>
					<Right style={{ transform: "rotate(180deg)" }} />
				</button>
				{images.map((_, i) => (
					<div
						key={i}
						style={{
							width: "0.5rem",
							height: "0.5rem",
							borderRadius: "50%",
							backgroundColor: "var(--foreground)",
							opacity: i == index ? 1 : 0.2,
							transition: "all 0.2s ease-in-out",
						}}
					/>
				))}
				<button onClick={() => cycleImage(1)}>
					<Right />
				</button>
			</div>
		</div>
	)
}

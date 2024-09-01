import { IconInput, IconTextButton } from "components"
import { Account, Edit, Right, SummitLogoFull } from "components/svg"
import { Helmet } from "react-helmet"
import { Divider } from "./home"

import BloomLogo from "../assets/summit/bloom_logo.svg"

import GM4Booth from "../assets/summit/gm4_booth.webp"
import MainStage from "../assets/summit/main_stage.webp"
import Plushies from "../assets/summit/plushies.webp"

import GM4Logo from "../assets/summit/gm4_logo.svg"
import VTLogo from "../assets/summit/vt_logo.png"
import BeetLogo from "../assets/summit/beet_logo.png"
import StardustLogo from "../assets/summit/stardust_logo.png"
import MCCLogo from "../assets/summit/mcc_logo.png"
import TCCLogo from "../assets/summit/tcc_logo.png"

import GImg1 from "../assets/summit/gallery/beach_stage.webp"
import GImg2 from "../assets/summit/gallery/gm4.webp"
import GImg3 from "../assets/summit/gallery/mountain.webp"
import GImg4 from "../assets/summit/gallery/mountain2.webp"
import GImg5 from "../assets/summit/gallery/spawn_center.webp"
import GImg6 from "../assets/summit/gallery/spawn_crane.webp"

const GALLERY_IMAGES = [GImg1, GImg2, GImg3, GImg4, GImg5, GImg6]

import SmithieHappy from "../assets/smithie/awww.png"

import "./summit.css"
import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"

const EMAIL_REGEX =
	/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g

const ATTENDEES = [
	["Gamemode 4", GM4Logo, "https://gm4.co/"],
	["Vanilla Tweaks", VTLogo, "https://vanillatweaks.net/"],
	["Beet", BeetLogo, "https://mcbeet.dev/"],
	["Stardust Labs", StardustLogo, "https://stardustlabs.net/"],
	["r/MinecraftCommands", MCCLogo, "https://discord.gg/9wNcfsH"],
	["The Creeper's Code", TCCLogo, "https://thecreeperscode.com"],
	["You!", SmithieHappy, ""],
].sort((a, b) => a[0].localeCompare(b[0]))

const SUMMIT_LINK =
	(import.meta.env.DEV ? "smithed.dev" : "smithed.net") + "/summit"

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
				<meta
					name="description"
					content="Come explore Smithed's first ever in-game convention! Join us: 11/2 - 11/9"
				/>

				<meta name="og:image" content="/summit-logo.png" />
			</Helmet>

			<div className="container" style={{ gap: "2rem" }}>
				<span
					className="header"
					style={{ alignSelf: "center", textAlign: "center" }}
				>
					Introducing
					<SummitLogoFull
						style={{ maxHeight: "12rem", color: "var(--accent2)" }}
					/>
				</span>
				<div style={{ textAlign: "center", maxWidth: "48rem" }}>
					A convention held inside of Minecraft, featuring datapack
					creators, map makers, and more!
					<br />
					<br />
					Over the course of a week, you'll be able to explore
					community made <a href="#booths">booths</a>, live{" "}
					<a href="#panels">panels</a>, and discover various
					collectables hidden around the server!
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						justifyContent: "center",
						gap: "2rem",
						width: "100%",
						flexWrap: "wrap",
					}}
				>
					<div
						className="container"
						style={{
							gap: "0.5rem",
							borderRadius: "var(--defaultBorderRadius)",
							backgroundColor: "var(--section)",
							width: "100%",
							padding: "1rem",
							alignSelf: "center",
							maxWidth: "14rem",
						}}
					>
						<span style={{ color: "var(--subText)" }}>
							Save the dates
						</span>
						<div
							className="container"
							style={{
								flexDirection: "row",
								gap: "0.5rem",
								fontSize: "1.5rem",
								fontWeight: 500,
							}}
						>
							Nov. 2
							<div
								style={{
									width: "1rem",
									height: "0.25rem",
									backgroundColor: "var(--subText)",
								}}
							></div>
							Nov. 9
						</div>
					</div>
					<div
						className="container"
						style={{
							gap: "0.5rem",
							borderRadius: "var(--defaultBorderRadius)",
							backgroundColor: "var(--section)",
							width: "100%",
							padding: "1rem",
							alignSelf: "center",
							maxWidth: "14rem",
						}}
					>
						<span style={{ color: "var(--subText)" }}>
							Reserve your spot
						</span>
						<div
							className="container compactButton"
							style={{
								flexDirection: "row",
								gap: "0.5rem",
								fontSize: "1.5rem",
								fontWeight: 500,
							}}
							onClick={() => {
								scrollTo("rsvp")
							}}
						>
							RSVP
						</div>
					</div>
					<div
						className="container"
						style={{
							gap: "0.5rem",
							borderRadius: "var(--defaultBorderRadius)",
							backgroundColor: "var(--section)",
							width: "100%",
							padding: "1rem",
							alignSelf: "center",
							maxWidth: "14rem",
							height: "5.625rem",
						}}
						onMouseOut={(e) => {
							document.querySelector("#summitLink")!.innerHTML =
								SUMMIT_LINK
						}}
					>
						<span style={{ color: "var(--subText)" }}>
							Share it around!
						</span>
						<div
							className="container"
							style={{
								flexDirection: "row",
								gap: "0.5rem",
								fontSize: "1rem",
								fontWeight: 500,
							}}
						>
							<a
								id="summitLink"
								href="/summit"
								style={{ color: "var(--foreground)" }}
								onClick={(e) => {
									e.preventDefault()
									navigator.clipboard.writeText(
										"https://smithed" +
											(import.meta.env.DEV
												? ".dev"
												: ".net") +
											"/summit"
									)

									e.currentTarget.innerText = "Copied!"
								}}
							>
								{SUMMIT_LINK}
							</a>
						</div>
					</div>
				</div>
				<div className="container" style={{}}>
					Generously sponsored by
					<img
						src={BloomLogo}
						style={{ height: "5rem", filter: "saturate(80%)" }}
					/>
					<a
						href="https://bloom.host"
						style={{ color: "var(--subText)" }}
					>
						https://bloom.host/
					</a>
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
				Booths are built by various community members in order to
				showcase the content they're working on.
				<br />
				<br />
				If you're interested in making your own, head to the application
				form.
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
				Panels are live events that happen on various stages around the
				server. Creators will talk about a given topic, showcase
				content, and potentionally interact directly with the audience.
				<br /> <br />
				Have something you're passionate about and want to share it with
				the server? Apply down below!
				<IconTextButton
					className="successButtonLike"
					text={"Apply for a panel"}
					icon={Edit}
					href="/summit/apply"
					style={{
						alignSelf: "end",
					}}
				/>
			</SummitSection>
			<SummitSection
				id="collectibles"
				image={Plushies}
				imageDescription="Plushies of Smithie found around the world"
				header={"FIND THE SECRETS"}
				color="disturbing"
			>
				While you go between booths, keep your eyes peeled for various
				secrets! Spread throughout the server are stickers and plushies
				waiting to be collected.
				<br />
				<br />
				If you're interested in exploring the server, make sure to RSVP!
				<IconTextButton
					className="disturbingButtonLike"
					text={"RSVP now!"}
					icon={Account}
					href="#rsvp"
					style={{ alignSelf: "end" }}
				/>
			</SummitSection>

			<MapGallery images={GALLERY_IMAGES} />

			<div
				className="container"
				style={{ width: "100%", gap: "2rem" }}
				id="attendees"
			>
				<span className="header" style={{ alignSelf: "center" }}>
					Who's coming?
				</span>
				<div className="attendeesContainer">
					{ATTENDEES.map((attendee) => (
						<AttendeeCard
							key={attendee[0]}
							name={attendee[0]}
							image={attendee[1]}
							website={attendee[2]}
						/>
					))}
				</div>
			</div>
			<div
				className="container"
				style={{ width: "100%", gap: "1rem" }}
				id="rsvp"
			>
				<span className="header" style={{ alignSelf: "center" }}>
					Sign me up!
				</span>
				<div
					className="container"
					style={{ gap: "1rem", width: "100%", textAlign: "center" }}
				>
					RSVP to reserve a spot!
					<RSVP />
				</div>
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
				<IconInput
					icon={Account}
					placeholder="Email"
					defaultValue={email}
					onChange={(e) => setEmail(e.currentTarget.value)}
					style={{ width: "100%", maxWidth: "24rem" }}
				/>
				<IconTextButton
					icon={Edit}
					text={"RSVP"}
					disabled={!email.match(EMAIL_REGEX)}
					onClick={async () => {
						if (!email.match(EMAIL_REGEX)) return

						setError("")
						setSuccess(false)

						const resp = await fetch(
							import.meta.env.VITE_API_SERVER +
								"/email-lists/summit-24/subscribe?email=" +
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
				<img src={image} style={{ borderColor: `var(--${color})` }} />
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

	const mod = (n: number, m: number) => ((n % m) + m) % m

	function CycleImage(direction: number) {
		const image = currentImageRef.current!
		const nextIndex = mod(index + direction, images.length)

		// if (image.style.opacity !== "0.5") {
		// 	image.style.setProperty("opacity", "0.5")
		// 	setTimeout(() => setIndex(nextIndex), 100)
		// } else {
		setIndex(nextIndex)
		// }
	}

	// useEffect(() => {
	// 	const image = currentImageRef.current!
	// 	const timeout = setTimeout(() => image.style.setProperty("opacity", "1"), 200)

	// 	return () => clearTimeout(timeout)
	// }, [index])

	return (
		<div className="mapGallery">
			<div className="imageHolder">
				<img ref={currentImageRef} src={images[index]} />
			</div>
			<div className="buttonHolder">
				<button onClick={() => CycleImage(-1)}>
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
				<button onClick={() => CycleImage(1)}>
					<Right />
				</button>
			</div>
		</div>
	)
}

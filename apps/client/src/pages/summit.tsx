import { IconInput, IconTextButton } from "components"
import { Account, At, Edit, QuestionMark, Right } from "components/svg"
import { Helmet } from "react-helmet"
import { Divider } from "./home"

import GM4Booth from "../assets/summit/gm4_booth.webp"
import MainStage from "../assets/summit/main_stage.webp"
import Plushies from "../assets/summit/plushies.webp"

import GImg1 from "../assets/summit/gallery/anvil.webp"
import GImg2 from "../assets/summit/gallery/bridge.webp"
import GImg3 from "../assets/summit/gallery/forest.webp"
import GImg4 from "../assets/summit/gallery/gondola_station.webp"
import GImg5 from "../assets/summit/gallery/lighthouse.webp"
import GImg6 from "../assets/summit/gallery/pine.webp"

import SummitMap from "../assets/summit/map.png"

import { ReactComponent as Artboard } from "../assets/summit/art-board.svg"
import { ReactComponent as Modrinth } from "../assets/summit/modrinth.svg"

const GALLERY_IMAGES = [GImg1, GImg2, GImg3, GImg4, GImg5, GImg6]

import "./summit.css"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocation } from "react-router-dom"

const EMAIL_REGEX =
	/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g

const MC_REGEX = /^[A-Za-z0-9_]{3,16}$/g

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
					<span style={{ fontSize: "1.5rem", fontWeight: 700 }}>
						EVENT START
					</span>
					<span
						style={{
							color: "#00D269",
							fontSize: "2rem",
							fontWeight: 800,
						}}
					>
						AUGUST 2026
					</span>
				</div>
				<div
					className="container"
					style={{ gap: "0.5rem", fontWeight: 600 }}
				>
					Powered by
					<a href="https://modrinth.com">
						<Modrinth style={{ height: "3rem" }} />
					</a>
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
						opportunity to get the word out. Soon, you can apply to
						hold a panel sharing your knowledge and experience with
						others. <br /> <br />
						Regardless of if you are giving a talk, exhibiting, or
						just a visitor, the event is entirely free; As long as
						you have Minecraft Java, you can join!
					</div>
					{/* <IconTextButton
						className="accentedButtonLike"
						icon={Flag}
						text={"Reserve your booth"}
						href="/summit/apply"
					/> */}
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
				{/* <IconTextButton
					className="lightAccentedButtonLike"
					text={"Apply for a booth"}
					icon={Edit}
					href="/summit/apply"
					style={{
						alignSelf: "end",
					}}
				/> */}
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
					Get Summit updates
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
				<a
					className="container"
					href="/summit-map.png"
					style={{ width: "100%" }}
				>
					<img
						src={SummitMap}
						style={{
							imageRendering: "pixelated",
							width: "100%",
							maxWidth: "800px",
						}}
					/>
				</a>
			</div>
		</div>
	)
}

function RSVP() {
	const [email, setEmail] = useState("")
	const [minecraftUsername, setMinecraftUsername] = useState("")
	const [error, setError] = useState("")
	const [success, setSuccess] = useState(false)

	// New states to handle the magic link flow
	const [isEmailTaken, setIsEmailTaken] = useState(false)
	const [managementSent, setManagementSent] = useState(false)
	const [isRequestingManagement, setIsRequestingManagement] = useState(false)

	const isEmailValid = useMemo(
		() => email.match(EMAIL_REGEX) !== null,
		[email]
	)

	const isMcNameValid = useMemo(
		() => minecraftUsername.match(MC_REGEX) !== null,
		[minecraftUsername]
	)

	console.log(isEmailValid, isMcNameValid)

	// Resets the error states if the user starts typing a new email
	const handleEmailChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setEmail(e.currentTarget.value)
			setIsEmailTaken(false)
			setManagementSent(false)
			setError("")
		},
		[]
	)

	const handleMcNameChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setMinecraftUsername(e.currentTarget.value)
			setManagementSent(false)
			setError("")
		},
		[]
	)

	const handleRequestManagement = useCallback(async () => {
		setIsRequestingManagement(true)
		setError("")

		try {
			const resp = await fetch(
				`${import.meta.env.VITE_API_SERVER}/email-lists/summit-26/request-management`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: email,
						redirectUrl: window.location.origin + "/manage-emails",
					}),
				}
			)

			if (!resp.ok) {
				const errorData = await resp.json()
				throw new Error(errorData.message || "Failed to send link")
			}

			setManagementSent(true)
		} catch (err: any) {
			setError(err.message || "Network error. Try again.")
		} finally {
			setIsRequestingManagement(false)
		}
	}, [email])

	return (
		<>
			<div
				className="container"
				style={{
					gap: "2rem",
					flexDirection: "column",
					width: "100%",
					maxWidth: "24rem",
					flexWrap: "wrap",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<div style={{ position: "relative", width: "100%" }}>
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
						{/* <QuestionMark
							style={{ width: "1rem", height: "1rem" }}
							title="We'll use your email to send you updates about the event"
						/> */}
					</div>
					<IconInput
						icon={At}
						placeholder="example@smithed.net"
						value={email}
						onChange={handleEmailChange}
						style={{ width: "100%", maxWidth: "24rem" }}
						disabled={success || managementSent}
					/>
				</div>
				<div style={{ position: "relative", width: "100%" }}>
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
						MINECRAFT USERNAME
						<QuestionMark
							style={{ width: "1rem", height: "1rem" }}
							title="We'll use this to identify your account in-game"
						/>
					</div>
					<IconInput
						icon={Account}
						placeholder="SmithedBot"
						value={minecraftUsername}
						onChange={handleMcNameChange}
						style={{ width: "100%", maxWidth: "24rem" }}
						disabled={success || managementSent}
					/>
				</div>
				<IconTextButton
					className="accentedButtonLike"
					icon={Right}
					reverse
					text={success ? "RSVP'd!" : "RSVP"}
					disabled={
						!isEmailValid ||
						!isMcNameValid ||
						success ||
						managementSent
					}
					onClick={async () => {
						if (!isEmailValid) return setError("Invalid email")
						if (!isMcNameValid)
							return setError("Invalid Minecraft username")

						setError("")
						setSuccess(false)
						setIsEmailTaken(false)

						const queryParams = new URLSearchParams({
							email,
							minecraftUsername: minecraftUsername.trim(),
						})

						try {
							const resp = await fetch(
								`${import.meta.env.VITE_API_SERVER}/email-lists/summit-26/subscribe?${queryParams.toString()}`,
								{ method: "POST" }
							)

							if (!resp.ok) {
								const errorData = await resp.json()

								// Check for the exact error message we defined in the Fastify route
								if (
									errorData.message ===
									"Email already registered!"
								) {
									setIsEmailTaken(true)
									return setError(
										"This email is already registered."
									)
								}

								return setError(
									"Failed to RSVP\n" +
										(errorData.message || "Unknown error")
								)
							}

							setSuccess(true)
						} catch (err) {
							setError(
								"Failed to reach the server. Please try again later."
							)
						}
					}}
				/>
			</div>

			{error !== "" && (
				<span
					style={{
						color: "var(--disturbing)",
						whiteSpace: "pre-wrap",
					}}
				>
					{error}
				</span>
			)}

			{/* Magic Link Prompt State */}
			{isEmailTaken && !managementSent && (
				<span style={{ color: "var(--subText)", fontSize: "0.9rem" }}>
					Need to update your Minecraft username or unsubscribe?{" "}
					<a
						href="#"
						onClick={(e) => {
							e.preventDefault()
							if (!isRequestingManagement)
								handleRequestManagement()
						}}
						style={{
							color: "var(--accent2)",
							cursor: "pointer",
							textDecoration: "none",
						}}
					>
						{isRequestingManagement
							? "Sending link..."
							: "Click here to receive a management link."}
					</a>
				</span>
			)}

			{managementSent && (
				<span style={{ color: "var(--success)" }}>
					Management link sent! Please check your inbox.
				</span>
			)}

			{success && (
				<span style={{ color: "var(--success)" }}>
					You have been RSVP'd!
				</span>
			)}
		</>
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

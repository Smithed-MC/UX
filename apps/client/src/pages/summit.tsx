import { IconInput, IconTextButton } from "components"
import { Account, At, Right } from "components/svg"
import { Helmet } from "react-helmet"
import { Divider } from "./home"
import { VendorGallery } from "./summit/vendors"
import { MapGallery } from "./summit/map"

import SurenaBooth from "../assets/summit/surena.webp"
import MainStage from "../assets/summit/main_stage.webp"
import Plushies from "../assets/summit/plushies.webp"

import GImg1 from "../assets/summit/gallery/anvil.webp"
import GImg2 from "../assets/summit/gallery/bridge.webp"
import GImg3 from "../assets/summit/gallery/forest.webp"
import GImg4 from "../assets/summit/gallery/gondola_station.webp"
import GImg5 from "../assets/summit/gallery/lighthouse.webp"
import GImg6 from "../assets/summit/gallery/pine.webp"

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
					<Artboard className="summitLogo" />A convention celebrating
					the community-made content of vanilla Minecraft
					<div
						className="container eventsAnnouncement"
						onClick={() => {
							document
								.getElementById("eventForm")
								?.scrollIntoView({
									behavior: "smooth",
									block: "center",
								})
						}}
					>
						<Right
							style={{
								transform: "rotate(90deg)",
								height: "1.5rem",
								width: "1.5rem",
							}}
						/>
						EVENT APPLICATIONS NOW OPEN!
						<Right
							style={{
								transform: "rotate(90deg)",
								height: "1.5rem",
								width: "1.5rem",
							}}
						/>
					</div>
				</div>

				<MapGallery images={GALLERY_IMAGES} />

				<div className="container dateAndSponsor">
					<div
						className="container"
						style={{
							backgroundColor: "var(--section)",
							border: "0.125rem solid var(--border)",
							padding: "1rem",
							borderRadius: "var(--defaultBorderRadius)",
							flexGrow: 1,
							height: "100%",
						}}
					>
						<span style={{ fontSize: "1.5rem", fontWeight: 700 }}>
							EVENT START
						</span>
						<span
							style={{
								color: "#A0C4F9",
								fontSize: "2rem",
								fontWeight: 800,
							}}
						>
							AUGUST 8TH, 2026
						</span>
					</div>
					<div
						className="container"
						style={{
							gap: "0.5rem",
							fontWeight: 600,
							backgroundColor: "var(--section)",
							border: "0.125rem solid var(--border)",
							padding: "1rem",
							borderRadius: "var(--defaultBorderRadius)",
							height: "100%",
						}}
					>
						Powered by
						<a href="https://modrinth.com">
							<Modrinth className="modrinthLogo" />
						</a>
					</div>
				</div>

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
						Smithed Summit is a 2-week long convention held on a
						Minecraft server. During the event you will be able to
						check out handcrafted showcase booths, meet skilled
						creators from various communities, participate in
						informative panels, playtest maps, find collectibles,
						and explore the interactive world.
						<br />
						<br />
						If you work on projects like datapacks, resourcepacks,
						maps, or development tools, Summit is a great
						opportunity to get the word out. You can now apply to
						host an event at Summit, including panels, meet and
						greets, playtests, and the like. Look below for more
						information.
						<br />
						<br />
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
				image={SurenaBooth}
				imageDescription="Surena Studios' booth on the Summit server"
				header={"CHECK OUT THE ^BOOTHS"}
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

			<div className="container" style={{ gap: "1rem", width: "100%" }}>
				<span className="header" style={{ alignSelf: "center" }}>
					THIS YEAR'S VENDORS
				</span>
				<div style={{ height: "6rem", width: "100%" }}>
					<VendorGallery />
				</div>
			</div>

			<SummitSection
				id="panels"
				image={MainStage}
				imageDescription="The stage located in the Welded Woodlands"
				header={"WATCH ^PANELS AND OTHER ^EVENTS"}
				color="success"
			>
				<span>
					Panels are in-game talks given by community members, with
					the goal of sharing knowledge and experience. In the past,
					these have revolved around data pack game design, technical
					deep-dives into hard to learn features like worldgen, and
					broader looks into content creation, among many other
					topics. You can check out panels from Smithed Summit 2024 on
					our{" "}
					<a href="https://www.youtube.com/watch?v=7mT7NhzGQHQ">
						YouTube channel
					</a>
					.
				</span>
				<br />
				This year we are also hosting events other than panels. These
				could range anywhere from small meet and greets, to creative
				workshops, or even multiplayer map playtests.
			</SummitSection>
			<div
				id="eventForm"
				className="container"
				style={{
					padding: "1.5rem",
					border: "0.125rem solid var(--success)",
					backgroundColor:
						"color-mix(in srgb, transparent 80%, var(--success) 20%)",
					borderRadius: "var(--defaultBorderRadius)",
					width: "100%",
					maxWidth: "56rem",
					gap: "1rem",
				}}
			>
				<div
					style={{
						color: "var(--success)",
						fontSize: "2rem",
						fontWeight: 600,
					}}
				>
					EVENT APPLICATIONS NOW OPEN!
				</div>
				<div style={{ maxWidth: "46rem" }}>
					If you would like to hold a panel or another event, you can
					apply via{" "}
					<a href="https://forms.gle/xQwMnkbumWYmvUuW8">this form</a>.
					We are open to anyone, as long as you have a fun, or
					interesting idea we would love to have you at Summit. Please
					keep in mind{" "}
					<span style={{ fontWeight: 600 }}>spots are limited</span>,
					so it's best to apply as soon as possible.
				</div>
			</div>
			<SummitSection
				id="collectibles"
				image={Plushies}
				imageDescription="Plushies of Smithie found around the world"
				header={"SEE THE ^SIGHTS"}
				color="disturbing"
			>
				Besides the beautiful hand-built landscapes, Summit Island is
				full of interactive curios, and collectibles for all the
				completionists out there. Attendees can get around swiftly
				thanks to our custom public transit system. What could lay
				hidden in the far reaches of this place?
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
				<Artboard className="summitLogo small" />
				<RSVP />
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

	return (
		<section key={header} id={id}>
			<div className="image">
				<img src={image} style={{ borderColor: `white` }} />
				<span className="caption">{imageDescription}</span>
			</div>
			<span className="header">
				{headerParts.map((word, i, arr) => (
					<span
						style={{
							color: word.startsWith("^")
								? `var(--${color})`
								: undefined,
						}}
					>
						{word.replace("^", "") +
							(i < arr.length - 1 ? " " : "")}
					</span>
				))}
			</span>
			<div className="text">{children}</div>
		</section>
	)
}

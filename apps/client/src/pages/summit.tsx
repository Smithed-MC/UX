import { IconInput, IconTextButton } from "components"
import { Account, Edit } from "components/svg"
import { Helmet } from "react-helmet"
import { Divider } from "./home"

import BloomLogo from "../assets/summit/bloom_logo.svg"

import GM4Booth from "../assets/summit/gm4_booth.webp"
import MainStage from "../assets/summit/main_stage.webp"

import GM4Logo from "../assets/summit/gm4_logo.svg"
import VTLogo from "../assets/summit/vt_logo.png"
import BeetLogo from "../assets/summit/beet_logo.png"
import StardustLogo from "../assets/summit/stardust_logo.png"
import MCCLogo from "../assets/summit/mcc_logo.png"

import SmithieHappy from "../assets/smithie/awww.png"

import "./summit.css"
import { useState } from "react"

const EMAIL_REGEX =
	/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g

const ATTENDEES = [
	["Gamemode 4", GM4Logo, "https://gm4.co/"],
	["Vanilla Tweaks", VTLogo, "https://vanillatweaks.net/"],
	["Beet", BeetLogo, "https://mcbeet.dev/"],
	["Stardust Labs", StardustLogo, "https://stardustlabs.net/"],
	["r/MinecraftCommands", MCCLogo, "https://discord.gg/9wNcfsH"],
	["You!", SmithieHappy, ""],
].sort((a, b) => a[0].localeCompare(b[0]))

export default function SummitPage() {
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
		>
			<Helmet>
				<meta
					name="description"
					content="Come explore Smithed's first ever convention!"
				/>

				<meta name="og:image" content="/summit-logo.png" />
			</Helmet>

			<div className="container" style={{ gap: "2rem" }}>
				<span className="header" style={{ alignSelf: "center" }}>
					Here comes{" "}
					<span style={{ color: "var(--accent2)" }}>
						Smithed Summit
					</span>
					!
				</span>
				<div style={{ textAlign: "center" }}>
					A minecraft event featuring datapack creators, map makers,
					and more!
					<br />
					Come explore our server and enjoy the many live panels being
					hosted through out the week of the event!
				</div>
				<div
					className="container"
					style={{
						gap: "0.5rem",
						borderRadius: "var(--defaultBorderRadius)",
						backgroundColor: "var(--section)",
						width: "max-content",
						padding: "1rem",
						alignSelf: "center",
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

				<div className="container" style={{}}>
					Generously sponsored by
					<img src={BloomLogo} style={{ height: "5rem" }} />
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
			<div className="container" style={{ width: "100%", gap: "2rem" }}>
				<span className="header" style={{ alignSelf: "center" }}>
					Who's coming?
				</span>
				<div
					style={{
						width: "100%",
						display: "grid",
						gridTemplateColumns: "repeat(auto-fill, 22rem)",
						gap: "2rem",
						justifyContent: "center",
					}}
				>
					{ATTENDEES.map((attendee) => (
						<AttendeeCard
							name={attendee[0]}
							image={attendee[1]}
							website={attendee[2]}
						/>
					))}
				</div>
			</div>
			<div className="container" style={{ width: "100%", gap: "1rem" }}>
				<span className="header" style={{ alignSelf: "center" }}>
					Sign me up!
				</span>
				<div className="container" style={{ gap: "1rem" }}>
					RSVP to be notified with all updates about Summit!
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
				style={{ gap: "1rem", flexDirection: "row" }}
			>
				<IconInput
					icon={Account}
					placeholder="Email"
					defaultValue={email}
					onChange={(e) => setEmail(e.currentTarget.value)}
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
		<div className="attendeeCard">
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
	image,
	imageDescription,
	header,
	children,
	color,
}: {
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
		<section>
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

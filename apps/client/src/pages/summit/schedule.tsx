import { useEffect, useMemo, useState } from "react"
import { IconTextButton } from "components"
import { Calendar, Pin } from "components/svg"
import "./schedule.css"

const GOOGLE_CALENDAR_URL =
	"https://calendar.google.com/calendar/u/1?cid=bWNzbWl0aGVkbWNAZ21haWwuY29t"
const CALENDAR_SYNC_INTERVAL_MS = 5 * 60 * 1000

export interface SummitRawEvent {
	id: string
	title: string
	startISO: string
	endISO: string
	type: string
	host: string
	location: string
	description?: string
}

export interface ProcessedEvent extends SummitRawEvent {
	startDate: Date
	endDate: Date
	isLive: boolean
	isNext: boolean
	isPast: boolean
}

interface SummitCalendarResponse {
	events: SummitRawEvent[]
	syncedAt: string
	stale?: boolean
}

export const SUMMIT_2026_EVENTS: SummitRawEvent[] = [
	{
		id: "opening-ceremony",
		title: "Opening Ceremony",
		startISO: "2026-08-08T17:00:00Z",
		endISO: "2026-08-08T18:00:00Z",
		type: "Panel",
		host: "Summit Staff",
		location: "Patched Plateaus",
		description: "Welcome to Summit Island. We have a short presentation to introduce Summit so sit back and get ready to explore!",
	},
	{
		id: "how-to-boost-productivity",
		title: "How to Boost your Productivity",
		startISO: "2026-08-09T16:00:00Z",
		endISO: "2026-08-09T17:00:00Z",
		type: "Panel",
		host: "Stoupy",
		location: "Welded Woodlands",
	},
	{
		id: "a-gneiss-chat",
		title: "A Gneiss Chat",
		startISO: "2026-08-09T21:30:00Z",
		endISO: "2026-08-09T22:30:00Z",
		type: "Meet and Greet / QnA",
		host: "Gneissname",
		location: "Other",
		description: "Meet and greet with Gneissname!",
	},
	{
		id: "jumpr",
		title: "Jumpr",
		startISO: "2026-08-10T19:30:00Z",
		endISO: "2026-08-10T20:30:00Z",
		type: "Play Session",
		host: "The Stove",
		location: "Other",
	},
	{
		id: "beating-boredom",
		title: "Beating Boredom: The Creation of Play",
		startISO: "2026-08-11T05:00:00Z",
		endISO: "2026-08-11T06:00:00Z",
		type: "Panel",
		host: "Sproutling Studio",
		location: "Welded Woodlands",
	},
	{
		id: "golg-minigolf",
		title: "golg: Minigolf in Minecraft",
		startISO: "2026-08-11T15:00:00Z",
		endISO: "2026-08-11T16:00:00Z",
		type: "Map Playtest",
		host: "hablethedev",
		location: "Other",
	},
	{
		id: "seven-deadly-sins-mapjamming",
		title: "The Seven Deadly Sins of Minecraft Mapjamming",
		startISO: "2026-08-11T23:00:00Z",
		endISO: "2026-08-12T00:00:00Z",
		type: "Panel",
		host: "Fingermaps (Technodono)",
		location: "Textured Tropics",
	},
	{
		id: "chit-chat-thalastro",
		title: "Chit n’ Chat with Thalastro",
		startISO: "2026-08-12T02:30:00Z",
		endISO: "2026-08-12T03:30:00Z",
		type: "Meet and Greet / QnA",
		host: "Thalastro",
		location: "Other",
		description: "Come chat with the developer of Thalastro",
	},
	{
		id: "map-development",
		title: "Map Development",
		startISO: "2026-08-12T20:00:00Z",
		endISO: "2026-08-12T21:00:00Z",
		type: "Panel",
		host: "Gamemode 4 (Djoness & Kyrius)",
		location: "Patched Plateaus",
	},
	{
		id: "minecraft-middle-earth",
		title: "Minecraft Middle Earth",
		startISO: "2026-08-13T15:30:00Z",
		endISO: "2026-08-13T16:30:00Z",
		type: "Meet and Greet / QnA",
		host: "TotiGonzolas",
		location: "Other",
	},
	{
		id: "density-functions",
		title: "Intermediate to Advanced Density Functions",
		startISO: "2026-08-13T21:45:00Z",
		endISO: "2026-08-13T22:45:00Z",
		type: "Panel",
		host: "Uni",
		location: "Textured Tropics",
	},
	{
		id: "gingsmp-event",
		title: "GingSMP Event",
		startISO: "2026-08-14T20:00:00Z",
		endISO: "2026-08-14T21:00:00Z",
		type: "Panel",
		host: "GingerWomann, TheLeming, NotGemu, Psychoxistence",
		location: "Textured Tropics",
	},
	{
		id: "roleplay-servers-qna",
		title: "Roleplay Servers: A QnA",
		startISO: "2026-08-14T23:00:00Z",
		endISO: "2026-08-15T00:00:00Z",
		type: "Meet and Greet / QnA",
		host: "Call of the Wild (group)",
		location: "Other",
		description: "Ever wondered about the intricacies of creating a safe, community experience for your Minecraft server?",
	},
	{
		id: "battleforged",
		title: "Battleforged - A Hero Brawl Minigame",
		startISO: "2026-08-15T02:00:00Z",
		endISO: "2026-08-15T03:00:00Z",
		type: "Play Session",
		host: "Battleforged co.",
		location: "Other",
	},
	{
		id: "keynote-ceremony",
		title: "Keynote Ceremony",
		startISO: "2026-08-15T17:00:00Z",
		endISO: "2026-08-15T18:30:00Z",
		type: "Panel",
		host: "Smithed Summit Staff",
		location: "Patched Plateaus",
	},
	{
		id: "figurigamma-1",
		title: "Figurigamma: An Animated Music Performance",
		startISO: "2026-08-15T21:00:00Z",
		endISO: "2026-08-15T22:00:00Z",
		type: "Live show",
		host: "OpenNBS",
		location: "Textured Tropics",
	},
	{
		id: "gm4-module-creation",
		title: "GM4 Module Creation",
		startISO: "2026-08-16T16:30:00Z",
		endISO: "2026-08-16T17:30:00Z",
		type: "Panel",
		host: "Gamemode 4 - runcows, Beeps, Bloo",
		location: "Patched Plateaus",
	},
	{
		id: "pink-prince-jigsaw",
		title: "Pink Prince: Advanced Jigsaw Techniques",
		startISO: "2026-08-16T20:00:00Z",
		endISO: "2026-08-16T21:00:00Z",
		type: "Panel",
		host: "kanokarob",
		location: "Textured Tropics",
		description: "Learn to take your Jigsaw structures to the next level on this tongue-in-cheek journey through the Mount Holly Estate",
	},
	{
		id: "masquerade-map",
		title: "Playing The Masquerade Map",
		startISO: "2026-08-17T19:00:00Z",
		endISO: "2026-08-17T20:00:00Z",
		type: "Play Session",
		host: "Gamemode 4 - Kyrius, Djones & Catter",
		location: "Other",
	},
	{
		id: "port-packs-fast",
		title: "How to Port your Packs Fast",
		startISO: "2026-08-18T21:00:00Z",
		endISO: "2026-08-18T22:00:00Z",
		type: "Panel",
		host: "CreeperMagnet_",
		location: "Welded Woodlands",
	},
	{
		id: "vault-of-minigames",
		title: "Vault of Minigames",
		startISO: "2026-08-19T15:15:00Z",
		endISO: "2026-08-19T16:15:00Z",
		type: "Play Session",
		host: "SwitchedCube",
		location: "Other",
	},
	{
		id: "custom-dimensions",
		title: "Creating Custom Dimension in Minecraft",
		startISO: "2026-08-19T21:00:00Z",
		endISO: "2026-08-19T22:00:00Z",
		type: "Panel",
		host: "Reppeti",
		location: "Textured Tropics",
	},
	{
		id: "stacking-core-shaders",
		title: "Only One Shader Survives - Stacking Core Shaders",
		startISO: "2026-08-20T18:00:00Z",
		endISO: "2026-08-20T19:00:00Z",
		type: "Panel",
		host: "Neylz (& eventually Surena)",
		location: "Patched Plateaus",
	},
	{
		id: "oddities-datapacking",
		title: "The Oddities of Minecraft Datapacking",
		startISO: "2026-08-21T01:30:00Z",
		endISO: "2026-08-21T02:30:00Z",
		type: "Panel",
		host: "Moxvallix",
		location: "Patched Plateaus",
	},
	{
		id: "designing-open-world",
		title: "Designing an Open World in Minecraft",
		startISO: "2026-08-21T19:00:00Z",
		endISO: "2026-08-21T20:00:00Z",
		type: "Panel",
		host: "Primordial Team",
		location: "Patched Plateaus",
	},
	{
		id: "figurigamma-2",
		title: "Figurigamma: An Animated Music Performance",
		startISO: "2026-08-22T01:30:00Z",
		endISO: "2026-08-22T02:30:00Z",
		type: "Live show",
		host: "OpenNBS",
		location: "Textured Tropics",
	},
	{
		id: "closing-ceremony",
		title: "Closing Ceremony",
		startISO: "2026-08-22T21:00:00Z",
		endISO: "2026-08-22T22:00:00Z",
		type: "Panel",
		host: "Smithed Summit Staff",
		location: "Textured Tropics",
		description: "Bittersweet, but beautiful. A bombastic end to a week of adventure and ambiance",
	},
]

const LOCATION_COLORS: Record<string, string> = {
	"Patched Plateaus": "#FF66A7",
	"Welded Woodlands": "#C6FF56",
	"Textured Tropics": "#FFD059",
}

export function EventCard({ event }: { event: ProcessedEvent }) {
	const startTimeStr = event.startDate.toLocaleTimeString(undefined, {
		hour: "numeric",
		minute: "2-digit",
	})
	const endTimeStr = event.endDate.toLocaleTimeString(undefined, {
		hour: "numeric",
		minute: "2-digit",
	})

	const locationColor = LOCATION_COLORS[event.location]

	return (
		<div className="event">
			<div
				className={
					"card" +
					`${event.isLive ? " live" : ""}` +
					`${event.isNext ? " next" : ""}` +
					`${event.isPast ? " past" : ""}`
				}
			>
				{event.isLive && (
					<div className="liveBadge">
						<span className="liveDot" />
						HAPPENING NOW
					</div>
				)}

				{event.isNext && !event.isLive && (
					<div className="nextMarker">Up Next</div>
				)}

				<span className="time">
					{startTimeStr} - {endTimeStr}
				</span>

				<span className="title">{event.title}</span>

				{event.description && (
					<span className="tagline">{event.description}</span>
				)}

				<div className="meta">
					<span className="badge">{event.type}</span>
					<span
						className="badge"
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: "0.3rem",
							color: locationColor || "var(--subText)",
							borderColor: locationColor || "var(--border)",
							backgroundColor: locationColor
								? `color-mix(in srgb, ${locationColor} 15%, transparent)`
								: undefined,
						}}
					>
						<Pin style={{ width: "0.75rem", height: "0.75rem", color: "currentColor" }} />
						{event.location}
					</span>
				</div>

				<span className="host">Hosted by: {event.host}</span>
			</div>
		</div>
	)
}

export function DayColumn({
	dateLabel,
	events,
}: {
	dateLabel: string
	events: ProcessedEvent[]
}) {
	return (
		<div className="column">
			<span className="header">{dateLabel}</span>
			{events.map((e) => (
				<EventCard key={e.id} event={e} />
			))}
		</div>
	)
}

export default function Schedule() {
	const [now, setNow] = useState(() => Date.now())
	const [selectedType, setSelectedType] = useState<string>("All")
	const [events, setEvents] = useState<SummitRawEvent[]>(SUMMIT_2026_EVENTS)
	const [syncState, setSyncState] = useState<"syncing" | "synced" | "stale">(
		"syncing"
	)

	useEffect(() => {
		const interval = setInterval(() => setNow(Date.now()), 30000)
		return () => clearInterval(interval)
	}, [])

	useEffect(() => {
		const controller = new AbortController()

		async function syncCalendar() {
			try {
				const response = await fetch("/api/summit-calendar", {
					signal: controller.signal,
				})
				if (!response.ok) throw new Error("Unable to sync calendar")

				const calendar =
					(await response.json()) as SummitCalendarResponse
				if (
					!Array.isArray(calendar.events) ||
					calendar.events.length === 0
				) {
					throw new Error("Calendar contained no events")
				}

				setEvents(calendar.events)
				setSyncState(calendar.stale ? "stale" : "synced")
			} catch (error) {
				if (!controller.signal.aborted) setSyncState("stale")
			}
		}

		syncCalendar()
		const interval = setInterval(syncCalendar, CALENDAR_SYNC_INTERVAL_MS)

		return () => {
			controller.abort()
			clearInterval(interval)
		}
	}, [])

	const processedEvents = useMemo(() => {
		const parsed = events
			.map((e) => {
				const startDate = new Date(e.startISO)
				const endDate = new Date(e.endISO)
				const startMs = startDate.getTime()
				const endMs = endDate.getTime()

				const isLive = now >= startMs && now < endMs
				const isPast = now >= endMs

				return {
					...e,
					startDate,
					endDate,
					isLive,
					isNext: false,
					isPast,
				}
			})
			.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

		// Mark first upcoming event as next
		const nextEvent = parsed.find((e) => e.startDate.getTime() > now)
		if (nextEvent) {
			nextEvent.isNext = true
		}

		return parsed
	}, [events, now])

	const filteredEvents = useMemo(() => {
		if (selectedType === "All") return processedEvents
		return processedEvents.filter((e) => e.type === selectedType)
	}, [processedEvents, selectedType])

	// Group events by local date in user's browser locale
	const groupedByDay = useMemo(() => {
		const map = new Map<string, { label: string; events: ProcessedEvent[] }>()

		filteredEvents.forEach((e) => {
			const localDateKey = e.startDate.toLocaleDateString(undefined, {
				year: "numeric",
				month: "numeric",
				day: "numeric",
			})

			const dateLabel = e.startDate.toLocaleDateString(undefined, {
				weekday: "short",
				month: "short",
				day: "numeric",
			})

			if (!map.has(localDateKey)) {
				map.set(localDateKey, { label: dateLabel, events: [] })
			}
			map.get(localDateKey)!.events.push(e)
		})

		return Array.from(map.values())
	}, [filteredEvents])

	const clientTimeZone = useMemo(() => {
		try {
			return Intl.DateTimeFormat().resolvedOptions().timeZone
		} catch (e) {
			return "your local timezone"
		}
	}, [])

	const eventTypes = useMemo(
		() => [
			"All",
			...Array.from(new Set(events.map((event) => event.type))),
		],
		[events]
	)

	useEffect(() => {
		if (!eventTypes.includes(selectedType)) setSelectedType("All")
	}, [eventTypes, selectedType])

	return (
		<div className="container" style={{ width: "100%", gap: "2rem" }}>
			<div className="container" style={{ alignItems: "center", textAlign: "center", gap: "0.5rem" }}>
				<span className="header" style={{ alignSelf: "center" }}>
					EVENT & PANEL SCHEDULE
				</span>
				<span
					style={{
						color: "var(--subText)",
						fontSize: "0.95rem",
						display: "inline-flex",
						alignItems: "center",
						gap: "0.4rem",
					}}
				>
					<Calendar style={{ width: "1rem", height: "1rem", color: "#A0C4F9" }} />
					All times adjusted to your local timezone: <strong style={{ color: "#A0C4F9" }}>{clientTimeZone}</strong>
				</span>

				<div className="calendarSync">
					<span className={`calendarSyncStatus ${syncState}`}>
						{syncState === "syncing" &&
							"Syncing with Google Calendar…"}
						{syncState === "synced" &&
							"Synced with Google Calendar · refreshes automatically"}
						{syncState === "stale" &&
							"Live sync is temporarily unavailable · retrying automatically"}
					</span>
					<IconTextButton
						className="highlightButtonLike calendarLink"
						icon={Calendar}
						text="Open official Google Calendar"
						href={GOOGLE_CALENDAR_URL}
						target="_blank"
						rel="noreferrer"
					/>
				</div>

				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						gap: "0.5rem",
						justifyContent: "center",
						marginTop: "1rem",
					}}
				>
					{eventTypes.map((t) => (
						<button
							key={t}
							onClick={() => setSelectedType(t)}
							style={{
								backgroundColor: selectedType === t ? "var(--accent2)" : "var(--section)",
								color: selectedType === t ? "#000" : "var(--foreground)",
								border: "1px solid var(--border)",
								padding: "0.4rem 0.8rem",
								borderRadius: "var(--defaultBorderRadius)",
								fontWeight: 600,
								cursor: "pointer",
								fontSize: "0.85rem",
							}}
						>
							{t}
						</button>
					))}
				</div>
			</div>

			<div id="summit-schedule">
				{groupedByDay.map((group) => (
					<DayColumn key={group.label} dateLabel={group.label} events={group.events} />
				))}
			</div>
		</div>
	)
}

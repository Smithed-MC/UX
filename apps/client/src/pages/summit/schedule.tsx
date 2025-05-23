import { useState } from "react"
import "./schedule.css"

interface SummitEvent {
	title: string
	tagline?: string
	startTime: string
	length: number
	host: string
	vodUrl?: string
}

const EVENTS: Record<string, SummitEvent[]> = {
	"11/2/2024": [
		{
			title: "Opening Ceremony",
			startTime: "17:00",
			length: 1,
			host: "Smithed Team",
			vodUrl: "https://youtube.com/live/kCuL1RYJLYI?feature=share",
		},
		{
			title: "How we make data packs for YouTube",
			startTime: "23:00",
			length: 1,
			host: "Logdotzip Studios",
			vodUrl: "https://youtube.com/live/W56QPMhOMK0?feature=share",
		},
	],
	"11/3/2024": [
		{
			title: "Designing Zoglin",
			tagline: "A technical datapack preprocessor",
			startTime: "10:30",
			length: 1,
			host: "Moxvallix, Gears",
			vodUrl: "https://youtube.com/live/S2QSrtmDjD8?feature=share",
		},
		{
			title: "All About DevsCube",
			startTime: "12:00",
			length: 1,
			host: "DevsCube",
			vodUrl: "https://youtube.com/live/1W3mTJbY2Fo?feature=share",
		},
		{
			title: "Generating Datapacks with Python",
			startTime: "14:00",
			length: 1,
			host: "Stoupy51",
			vodUrl: "https://youtube.com/live/yMNk2_R_Bvw?feature=share",
		},
		{
			title: "Why Mojang Keeps Stealing Our Ideas",
			tagline: "Designing Datapacks for Survival",
			startTime: "16:00",
			length: 1,
			host: "Gamemode 4",
			vodUrl: "https://youtube.com/live/f6sLyQwWc84?feature=share",
		},
		{
			title: "Designing Vanilla+ Content",
			startTime: "18:00",
			length: 1,
			host: "CreeperMagnet_",
			vodUrl: "https://youtube.com/live/f6sLyQwWc84?feature=share",
		},
		{
			title: "The Strengths of Datapack Libraries",
			startTime: "20:00",
			length: 1,
			host: "Leirof, theogiraudet, Aksiome",
			vodUrl: "https://youtube.com/live/skAqER7oJzU?feature=share",
		},
	],
	"11/4/2024": [
		{
			title: "How to Finish Your First Pack",
			startTime: "0:00",
			length: 1,
			host: "SuperRed001",
			vodUrl: "https://youtube.com/live/uWgkpsYrxZw?feature=share",
		},
		{
			title: "Intro to Worldgen",
			startTime: "19:00",
			length: 1,
			host: "Kano, jacobsjo, catter",
			vodUrl: "https://youtube.com/live/ASB0dnxaQKk?feature=share",
		},
	],
	"11/5/2024": [
		{
			title: "Problem Solving with Minecraft",
			startTime: "23:00",
			length: 1,
			host: "Mr Pringouin",
			vodUrl: "https://youtube.com/live/XJL2DdURppY?feature=share",
		},
	],
	"11/6/2024": [
		{
			title: "15 Years of Note Block Music",
			tagline: "The History of Note Block Studio",
			startTime: "21:00",
			length: 1,
			host: "Note Block Studio",
			vodUrl: "https://www.youtube.com/watch?v=25IwJr7BtgI"
		},
	],
	"11/7/2024": [
		{
			title: "Intro to Snowcapped",
			startTime: "20:00",
			length: 1,
			host: "jacobsjo",
			vodUrl: "https://www.youtube.com/live/rXdwD88SS4k"
		},
	],
	"11/8/2024": [
		{
			title: "Pixelart for Minecraft",
			startTime: "19:00",
			length: 1,
			host: "Kyrius, Jachro",
			vodUrl: "https://www.youtube.com/watch?v=jGpUJRKfRLc"
		},
		{
			title: "Fireside Chats",
			startTime: "22:00",
			length: 3,
			host: "Smithed Team",
			vodUrl: "https://www.youtube.com/watch?v=0VgXm-IN-l4"
		},
	],
	"11/9/2024": [
		{
			title: "Core Shaders",
			tagline: "The unsupported feature unlocking the VFX world",
			startTime: "15:30",
			length: 1,
			host: "Neylz",
			vodUrl: "https://www.youtube.com/watch?v=2bfaBHWWLok"
		},
		{
			title: "Supercharging Datapacking with Beet",
			startTime: "19:00",
			length: 1,
			host: "rx97",
			vodUrl: "https://www.youtube.com/watch?v=WvuT4bKnfuU"
		},
		{
			title: "Closing Ceremony",
			startTime: "23:00",
			length: 1,
			host: "Smithed Team",
			vodUrl: "https://youtube.com/live/7mT7NhzGQHQ?feature=share"
		},
	],
}

const EVENTS_BY_DATE = Object.entries(EVENTS)
	.map(([day, events]) =>
		events.map((e) => ({
			...e,
			startDate: new Date(`${day} ${e.startTime} UTC`),
		}))
	)
	.reduce((p, n) => p.concat(n))
	.sort((a, b) => a.startDate.valueOf() - b.startDate.valueOf())

const NEXT_EVENT = EVENTS_BY_DATE.find(
	(e) => e.startDate.valueOf() >= Date.now()
)

export function EventCard({
	event,
}: {
	event: SummitEvent & { startDate: Date }
}) {
	const startDate = event.startDate
	const endDate = new Date(startDate)
	endDate.setHours(endDate.getHours() + event.length)

	return (
		<div className={`event`}>
			<div
				className={
					"card" +
					`${event === NEXT_EVENT ? " next" : ""}` +
					`${endDate.valueOf() < Date.now() ? " past" : ""}`
				}
			>
				{event === NEXT_EVENT && (
					<div className="nextMarker">Next up</div>
				)}
				<span className="time">
					{startDate.toLocaleTimeString(undefined, {
						timeStyle: "short",
					})}
					{" - "}
					{endDate.toLocaleString(undefined, { timeStyle: "short" })}
				</span>
				<span className="title">
					{event.title}
					{event.tagline ? ":" : ""}
				</span>
				{event.tagline && (
					<span className="tagline">{event.tagline}</span>
				)}
				{event.vodUrl && <a href={event.vodUrl}>View the Recording</a>}
				<span className="host">Hosted by: {event.host}</span>
			</div>
		</div>
	)
}

export function DayColumn({ startDate }: { startDate: Date }) {
	const daysEvents = EVENTS_BY_DATE.filter(
		(e) =>
			e.startDate.valueOf() >= startDate.valueOf() &&
			e.startDate.valueOf() < startDate.valueOf() + 24 * 60 * 60 * 1000
	)

	return (
		<div className="column">
			<span className="header">
				{startDate.toLocaleDateString(undefined, {
					month: "short",
					day: "numeric",
					weekday: "short",
				})}
			</span>
			{daysEvents.map((e) => (
				<EventCard key={e.startTime} event={e} />
			))}
		</div>
	)
}

export default function Schedule() {
	const summitStart = new Date(EVENTS_BY_DATE[0].startDate)
	summitStart.setHours(0, 0, 0, 0)

	const timeZone = summitStart
		.toLocaleDateString(undefined, {
			day: "2-digit",
			timeZoneName: "short",
		})
		.substring(4)

	return (
		<div className="container" style={{ width: "100%", gap: "2rem" }}>
			<span className="container" style={{}}>
				<h1>Summit Panel Schedule</h1>
				<span style={{ opacity: 0.5 }}>
					All times shown are in {timeZone}
				</span>
			</span>
			<div id="summit-schedule">
				{[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
					const start = new Date(summitStart)
					start.setDate(summitStart.getDate() + i)

					if (
						start.getDate() >
						EVENTS_BY_DATE.at(-1)!.startDate.getDate()
					)
						return <></>

					return (
						<DayColumn key={start + "Column"} startDate={start} />
					)
				})}
			</div>
		</div>
	)
}

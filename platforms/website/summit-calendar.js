export const SUMMIT_CALENDAR_URL =
	"https://calendar.google.com/calendar/ical/mcsmithedmc%40gmail.com/public/basic.ics"

const CACHE_DURATION_MS = 60 * 1000

let cachedCalendar
let cacheExpiresAt = 0
let calendarRequest

function unfoldLines(ical) {
	return ical.replace(/\r?\n[ \t]/g, "").split(/\r?\n/)
}

function unescapeText(value) {
	return value
		.replace(/\\[nN]/g, "\n")
		.replace(/\\,/g, ",")
		.replace(/\\;/g, ";")
		.replace(/\\\\/g, "\\")
}

function decodeHtmlEntities(value) {
	return value
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;|&apos;/gi, "'")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
}

function cleanDescription(value = "") {
	const text = decodeHtmlEntities(unescapeText(value))
		.replace(/<br\s*\/?\s*>/gi, "\n")
		.replace(/<\/p\s*>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/\r/g, "")

	let type = "Event"
	let host = "Smithed Summit"
	const descriptionLines = []

	for (const rawLine of text.split("\n")) {
		const line = rawLine.trim()
		if (!line) continue

		const typeMatch = line.match(/^type\s*:\s*(.+)$/i)
		if (typeMatch) {
			type = typeMatch[1].trim()
			continue
		}

		const hostMatch = line.match(/^hosts?\s*:\s*(.+)$/i)
		if (hostMatch) {
			host = hostMatch[1].trim()
			continue
		}

		descriptionLines.push(line)
	}

	const description = descriptionLines
		.join(" ")
		.replace(/^["“”']+|["“”']+$/g, "")
		.trim()

	return {
		type,
		host,
		description: description || undefined,
	}
}

function readProperty(lines, name) {
	const prefix = name.toUpperCase()
	const line = lines.find((candidate) => {
		const propertyName = candidate.slice(0, candidate.indexOf(":"))
		return propertyName.split(";", 1)[0].toUpperCase() === prefix
	})

	if (!line) return undefined
	const separator = line.indexOf(":")
	return separator === -1 ? undefined : line.slice(separator + 1)
}

function parseDate(value) {
	if (!value) return undefined

	const match = value.match(
		/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?(Z)?$/
	)
	if (!match) return undefined

	const [, year, month, day, hour = "00", minute = "00", second = "00"] =
		match

	return new Date(
		Date.UTC(
			Number(year),
			Number(month) - 1,
			Number(day),
			Number(hour),
			Number(minute),
			Number(second)
		)
	).toISOString()
}

function parseEvent(lines) {
	if (readProperty(lines, "STATUS") === "CANCELLED") return undefined

	const id = readProperty(lines, "UID")
	const title = readProperty(lines, "SUMMARY")
	const startISO = parseDate(readProperty(lines, "DTSTART"))
	const endISO = parseDate(readProperty(lines, "DTEND"))

	if (!id || !title || !startISO || !endISO) return undefined

	const metadata = cleanDescription(readProperty(lines, "DESCRIPTION"))

	return {
		id: unescapeText(id),
		title: unescapeText(title),
		startISO,
		endISO,
		type:
			metadata.type === "Event" && /ceremony/i.test(title)
				? "Ceremony"
				: metadata.type,
		host: metadata.host,
		location: unescapeText(
			readProperty(lines, "LOCATION") || "Summit Island"
		),
		description: metadata.description,
	}
}

export function parseSummitCalendar(ical) {
	const events = []
	let eventLines

	for (const line of unfoldLines(ical)) {
		if (line === "BEGIN:VEVENT") {
			eventLines = []
			continue
		}

		if (line === "END:VEVENT") {
			if (eventLines) {
				const event = parseEvent(eventLines)
				if (event) events.push(event)
			}
			eventLines = undefined
			continue
		}

		if (eventLines) eventLines.push(line)
	}

	return events.sort(
		(a, b) =>
			new Date(a.startISO).getTime() - new Date(b.startISO).getTime()
	)
}

async function requestSummitCalendar(fetchImplementation) {
	const response = await fetchImplementation(SUMMIT_CALENDAR_URL)
	if (!response.ok) {
		throw new Error(`Google Calendar returned ${response.status}`)
	}

	const events = parseSummitCalendar(await response.text())
	if (events.length === 0) {
		throw new Error("Google Calendar returned no valid Summit events")
	}

	return {
		events,
		syncedAt: new Date().toISOString(),
	}
}

export async function getSummitCalendar(fetchImplementation) {
	const now = Date.now()
	if (cachedCalendar && now < cacheExpiresAt) return cachedCalendar

	if (!calendarRequest) {
		calendarRequest = requestSummitCalendar(fetchImplementation)
			.then((calendar) => {
				cachedCalendar = calendar
				cacheExpiresAt = Date.now() + CACHE_DURATION_MS
				return calendar
			})
			.finally(() => {
				calendarRequest = undefined
			})
	}

	try {
		return await calendarRequest
	} catch (error) {
		if (cachedCalendar) return { ...cachedCalendar, stale: true }
		throw error
	}
}

import assert from "node:assert/strict"
import test from "node:test"
import { parseSummitCalendar } from "./summit-calendar.js"

test("parses, sorts, and normalizes Google Calendar events", () => {
	const calendar = `BEGIN:VCALENDAR\r
BEGIN:VEVENT\r
DTSTART:20260809T170000Z\r
DTEND:20260809T180000Z\r
UID:second-event\r
DESCRIPTION:<i>Ask us anything</i><br><b>Type</b>: Meet and Greet / QnA<br>\r
 <b>Host</b>: Smithie\\, Jr.\r
LOCATION:Other\r
SUMMARY:Community Q\\,A\r
END:VEVENT\r
BEGIN:VEVENT\r
DTSTART:20260808T170000Z\r
DTEND:20260808T180000Z\r
UID:opening-event\r
DESCRIPTION:"<i>Welcome to Summit Island!</i><br><b>Hosts</b>: Summit Staff\r
LOCATION:Patched Plateaus\r
SUMMARY:Opening Ceremony\r
END:VEVENT\r
BEGIN:VEVENT\r
STATUS:CANCELLED\r
DTSTART:20260810T170000Z\r
DTEND:20260810T180000Z\r
UID:cancelled-event\r
SUMMARY:Cancelled panel\r
END:VEVENT\r
END:VCALENDAR`

	assert.deepEqual(parseSummitCalendar(calendar), [
		{
			id: "opening-event",
			title: "Opening Ceremony",
			startISO: "2026-08-08T17:00:00.000Z",
			endISO: "2026-08-08T18:00:00.000Z",
			type: "Ceremony",
			host: "Summit Staff",
			location: "Patched Plateaus",
			description: "Welcome to Summit Island!",
		},
		{
			id: "second-event",
			title: "Community Q,A",
			startISO: "2026-08-09T17:00:00.000Z",
			endISO: "2026-08-09T18:00:00.000Z",
			type: "Meet and Greet / QnA",
			host: "Smithie, Jr.",
			location: "Other",
			description: "Ask us anything",
		},
	])
})

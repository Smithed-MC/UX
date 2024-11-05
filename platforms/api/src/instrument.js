import dotenv from "dotenv"
dotenv.config()
import * as Sentry from "@sentry/node"

if (process.env.SENTRY_PROFILING === "true") {
	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		integrations: [],
		// Tracing
		tracesSampleRate: 1.0, //  Capture 100% of the transactions

		// Set sampling rate for profiling - this is relative to tracesSampleRate
		profilesSampleRate: 1.0,
	})

	console.log("Initialized Sentry")
}

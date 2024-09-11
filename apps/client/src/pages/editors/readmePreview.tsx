import { IconTextButton, MarkdownRenderer } from "components"
import { Globe, Refresh } from "components/svg"
import { useState, useEffect } from "react"
import { TextInput, validUrlRegex } from "./inputs"
import { HTTPResponses } from "data-types"
import { correctGithubLinks, normalizeRelativeLinks } from "formatters"

export default function ReadmePreview({
	dataRef,
}: {
	dataRef: { display: { webPage?: string } }
}) {
	const [readme, setReadme] = useState<string>()
	const [error, setError] = useState<[string, number, string]>()

	useEffect(() => {
		loadReadme()
	}, [dataRef.display.webPage])

	async function loadReadme() {
		if (!dataRef.display.webPage) return

		try {
			const response = await fetch(correctGithubLinks(dataRef.display.webPage))

			if (!response.ok) {
				setError([
					"Failed to load readme!",
					response.status,
					response.statusText,
				])
				return
			}

			const newReadme = await response.text()
			setReadme(normalizeRelativeLinks(dataRef.display.webPage, newReadme))
			setError(undefined)
		} catch (e) {
			const error = e as Error;
			setError(["Failed to load readme!", HTTPResponses.SERVER_ERROR, error.message])
		}
	}

	return (
		<>
			<div
				className="container"
				style={{
					flexDirection: "row",
					backgroundColor: "var(--section)",
					padding: "1rem",
					gap: "1rem",
				}}
			>
				<TextInput
					dataRef={dataRef}
					area=""
					placeholder="Link to README.md"
					icon={Globe}
					path="display/webPage"
					validate={(v) =>
						!validUrlRegex.test(v) ? "Invalid url" : undefined
					}
					insetError
				/>
				<IconTextButton
					reverse
					className="accentedButtonLike"
					icon={Refresh}
					text="Update preview"
					onClick={loadReadme}
				/>
			</div>
			<div
				style={{
					backgroundColor: "var(--bold)",
					padding: "0rem 1rem 1rem 1rem",
					height: "100%",
					margin: 0,
					overflow: "hidden",
				}}
			>
				{error && (
					<>
						<h2 style={{color: "var(--disturbing)"}}>{error[0]}</h2>
						<span style={{color: "var(--border)"}}>Response Code:</span> {error[1]}
						<br />
						<span style={{color: "var(--border)"}}>Response Text:</span> {error[2]}
					</>
				)}
				{error === undefined && (
					<MarkdownRenderer>{readme}</MarkdownRenderer>
				)}
			</div>
		</>
	)
}

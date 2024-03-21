import { IconTextButton, MarkdownRenderer } from "components"
import { Globe, Refresh } from "components/svg"
import { useState, useEffect } from "react"
import { TextInput } from "./inputs"

export default function ReadmePreview({ dataRef }: { dataRef: {display: {webPage?: string }} }) {
	const [readme, setReadme] = useState<string>()

	useEffect(() => {
		loadReadme()
	}, [dataRef.display.webPage])

	async function loadReadme() {
		if (!dataRef.display.webPage) return

		const response = await fetch(dataRef.display.webPage)

		if (!response.ok) {
			setReadme('<span style="color: red;">Failed to load readme!</span>')
			return
		}
		const newReadme = await response.text()
		setReadme(newReadme)
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
				<MarkdownRenderer>{readme}</MarkdownRenderer>
			</div>
		</>
	)
}

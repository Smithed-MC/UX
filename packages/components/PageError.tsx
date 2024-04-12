import React from "react"

interface ErrorPageProps {
	title: string
	description: string
	returnMessage: string
	returnLink: string
}

export default function ErrorPage({
	title,
	description,
	returnMessage,
	returnLink,
}: ErrorPageProps) {
	return (
		<div
			className="container"
			style={{
				width: "100vw",
				height: "100vh",
				gap: 8,
				position: "absolute",
				top: 0,
				right: 0,
			}}
		>
			<h1 style={{ color: "var(--badAccent)", marginBottom: 0 }}>
				{title}
			</h1>
			<label style={{ fontSize: "1.5rem", marginBottom: 16 }}>
				{description}
			</label>
			<Link
				className="button"
				to={returnLink}
				style={{
					padding: 12,
					borderRadius: "var(--defaultBorderRadius)",
				}}
			>
				{returnMessage}
			</Link>
		</div>
	)
}

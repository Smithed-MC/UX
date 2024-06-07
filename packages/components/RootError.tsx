import { useRouteError, useNavigate } from "react-router-dom"
import Link from "./Link"

export function RootError() {
	const error: any = useRouteError()
	const navigate = useNavigate()

	console.log(error)
	// console.log(Object.keys(error))
	return (
		<div
			className="container"
			style={{
				gap: 32,
				padding: 32,
				height: "100vh",
				justifyContent: "start",
			}}
		>
			<h1 style={{ color: "var(--badAccent)", marginBottom: -32 }}>
				Error
			</h1>
			<p style={{ fontSize: "1.125rem", marginBottom: -16 }}>
				Sorry, we've encountered an error on our end!
				<br />
				Report it to the{" "}
				<Link to="https://github.com/Smithed-MC/UX">github</Link>.
			</p>
			<a
				className="buttonLike"
				onClick={() => {
					navigate(-1)
				}}
			>
				Go back
			</a>
			<label
				style={{
					backgroundColor: "var(--backgroundAccent)",
					padding: 8,
					borderRadius: "var(--defaultBorderRadius)",
				}}
			>
				{error.message}
			</label>
			<details
				style={{
					width: "100%",
					boxSizing: "border-box",
					justifySelf: "end",
				}}
			>
				<summary>Trace</summary>
				<br />
				{error.stack?.split("\n").map((l: string, i: number) => (
					<span
						key={i}
						style={{ paddingLeft: l.match(/(\s)+at/g) ? 32 : 0 }}
					>
						{l}
						<br />
					</span>
				))}
			</details>
		</div>
	)
}

import { IconInput } from "components"
import { Browse } from "components/svg"
import { FunctionComponent, useState } from "react"
import "./ContentSearch.css"
import { matchPath, useLocation, useMatch, useNavigate } from "react-router-dom"

const icons: Record<string, JSX.Element> = {
	packs: <Browse />,
	bundles: (
		<span
			className="container"
			style={{
				justifyContent: "center",
				fontFamily: "JetBrains Mono",
				fontWeight: 600,
				height: "1rem",
				width: "0.75rem",
			}}
		>
			#
		</span>
	),
	users: (
		<span
			className="container"
			style={{
				justifyContent: "center",
				fontFamily: "JetBrains Mono",
				fontWeight: 600,
				height: "1rem",
				width: "0.75rem",
			}}
		>
			@
		</span>
	),
}

export default function ContentSearch() {
	const [mode, setMode] = useState<"packs" | "bundles" | "users">("packs")
	const navigate = useNavigate()
	const location = useLocation()

	if (
		matchPath("/users", location.pathname) ||
		matchPath("/packs", location.pathname)
	)
		return <></>

	return (
		<div className="contentSearchBox navBarHide" style={{ flexGrow: 1 }}>
			<IconInput
				className=""
				style={{ flexGrow: 1, width: "100%" }}
				iconElement={icons[mode]}
				placeholder="Search..."
				onKeyDown={(e) => {
					switch (e.key) {
						case "Enter": {
							const search = e.currentTarget.value
							navigate(`/${mode}?search=${search}`)
							break
						}
						case "@": {
							setMode(mode === "users" ? "packs" : "users")
							e.preventDefault()
							break
						}
						case "#": {
							setMode(mode === "bundles" ? "packs" : "bundles")
							e.preventDefault()
							break
						}
						case "Escape": {
							setMode("packs")
							e.preventDefault()
							break
						}
					}
				}}
			/>
			<div className="suggestions">
				<span>
					Searchs for <b>packs</b> by default
				</span>
				<span>
					<span className="char">@</span> To search for <b>users</b>{" "}
					and <b>teams</b>
					<br />
				</span>
				<span>
					<span className="char">#</span> To search for <b>bundles</b>
				</span>
			</div>
		</div>
	)
}

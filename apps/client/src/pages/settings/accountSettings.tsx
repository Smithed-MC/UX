import { Plus } from "components/svg"
import { PAToken } from "data-types"
import { useState } from "react"
import "./accountSettings.css"
import AddTokenPopup from "./accountSettings/addTokenPopup"
import Token from "./accountSettings/token"

export default function AccountSettings({
	tokens: intitialTokens,
}: {
	tokens: { tokenDocId: string; tokenEntry: PAToken }[]
}) {
	const [showAddToken, setShowAddToken] = useState<
		| "hidden"
		| "show"
		| { tokenDocId: string; tokenEntry: PAToken; token: string }
	>("hidden")
	const [tokens, setTokens] = useState(intitialTokens)

	tokens.sort((a, b) => a.tokenEntry.createdAt - b.tokenEntry.createdAt)

	return (
		<div
			className="container"
			style={{ width: "100%", maxWidth: "48rem", gap: "2rem" }}
		>
			<div
				className="container"
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					width: "100%",
				}}
			>
				<h2>Tokens</h2>

				<button
					style={{ backgroundColor: "transparent" }}
					onClick={() => setShowAddToken("show")}
				>
					<Plus />
				</button>
			</div>
			{tokens.map((t, i) => (
				<Token
					key={"token_" + t.tokenEntry.tokenUid}
					docId={t.tokenDocId}
					entry={t.tokenEntry}
					onDelete={() => {
						tokens.splice(i, 1)
						console.log(tokens)
						setTokens([...tokens])
					}}
					onRefresh={(tokenEntry, token) => {
                        console.log(tokenEntry)
						t.tokenEntry = tokenEntry

                        setShowAddToken({
                            ...t,
                            token
                        })

						setTokens([...tokens])
					}}
				/>
			))}
			{(tokens === undefined || tokens.length) === 0 && (
				<span>No tokens created</span>
			)}

			{showAddToken !== "hidden" && (
				<AddTokenPopup
					onClose={() => setShowAddToken("hidden")}
					onAdd={(token) => setTokens([...tokens, token])}
					token={
						typeof showAddToken === "object"
							? showAddToken
							: undefined
					}
				/>
			)}
		</div>
	)
}

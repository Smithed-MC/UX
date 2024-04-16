import { Github, Plus } from "components/svg"
import { PAToken } from "data-types"
import { useState } from "react"
import "./accountSettings.css"
import AddTokenPopup from "./accountSettings/addTokenPopup"
import Token from "./accountSettings/token"
import {
	AuthError,
	AuthProvider,
	getAuth,
	GithubAuthProvider,
	linkWithPopup,
	unlink,
} from "firebase/auth"
import { IconTextButton } from "components"
import { useFirebaseUser } from "hooks"

export default function AccountSettings({
	tokens: intitialTokens,
}: {
	tokens: { tokenDocId: string; tokenEntry: PAToken }[]
}) {
	return (
		<div
			className="container"
			style={{
				width: "100%",
				maxWidth: "48rem",
				gap: "2rem",
				paddingBottom: "4rem",
				alignItems: "start",
			}}
		>
			<ConnectionsManagement />
			<div
				style={{
					width: "100%",
					borderBottom: "0.125rem solid var(--border)",
				}}
			></div>
			<TokenManagement tokens={intitialTokens} />
		</div>
	)
}

const githubProvider = new GithubAuthProvider()
function ConnectionButton({
	id,
	name,
	provider,
	icon,
}: {
	id: string
	name: string
	provider: AuthProvider
	icon: React.FunctionComponent<any>
}) {
	const firebaseUser = useFirebaseUser()
	const [linked, setLinked] = useState(
		firebaseUser?.providerData.find((p) => p.providerId === id) !==
			undefined
	)

	return (
		<>
			{!linked && (
				<IconTextButton
					icon={icon}
					text={`Link ${name} account`}
					onClick={async () => {
						if (!firebaseUser) return

						try {
							const cred = await linkWithPopup(
								firebaseUser,
								provider
							)

							setLinked(true)
						} catch (e) {
							const error = e as AuthError

							switch (error.code) {
								case "auth/credential-already-in-use":
									alert(
										`This ${name} account is already in use!`
									)
									break
								default:
									alert(error.message)
									break
							}
						}
					}}
				/>
			)}
			{linked && (
				<IconTextButton
					className="invalidButtonLike"
					icon={icon}
					text={`Unlink ${name} account`}
					onClick={async () => {
						if (!firebaseUser) return

						await unlink(firebaseUser, id)
						setLinked(false)
					}}
				/>
			)}
		</>
	)
}

function ConnectionsManagement() {
	return (
		<>
			<h2 style={{ margin: 0 }}>Connections</h2>
			<ConnectionButton
				id={"github.com"}
				icon={Github}
				name="Github"
				provider={githubProvider}
			/>
		</>
	)
}

function TokenManagement({
	tokens: intitialTokens,
}: {
	tokens: { tokenEntry: PAToken; tokenDocId: string }[]
}) {
	const [showAddToken, setShowAddToken] = useState<
		| "hidden"
		| "show"
		| { tokenEntry: PAToken; token: string; tokenDocId: string }
	>("hidden")

	const [tokens, setTokens] = useState(intitialTokens)
	tokens.sort((a, b) => a.tokenEntry.createdAt - b.tokenEntry.createdAt)
	return (
		<>
			<div
				className="container"
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					width: "100%",
				}}
			>
				<h2 style={{ margin: 0 }}>Tokens</h2>

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
							token,
						})

						setTokens([...tokens])
					}}
				/>
			))}
			{(tokens === undefined || tokens.length) === 0 && (
				<span
					style={{
						alignSelf: "center",
						backgroundColor: "var(--section)",
						padding: "1rem",
						borderRadius: "var(--defaultBorderRadius)",
					}}
				>
					No tokens created
				</span>
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
		</>
	)
}

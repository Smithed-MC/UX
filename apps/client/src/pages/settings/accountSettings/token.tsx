import { Modal, IconTextButton } from "components"
import { Refresh, Trash } from "components/svg"
import { PAToken, PermissionScope } from "data-types"
import { useFirebaseUser } from "hooks"

export default function Token({
	docId,
	entry,
	onDelete,
    onRefresh
}: {
	docId: string
	entry: PAToken
	onDelete: () => void
    onRefresh: (tokenEntry: PAToken, token: string) => void
}) {
	const firebaseUser = useFirebaseUser()
	const createdDate = new Date(entry.createdAt)
	const expiresDate = new Date(entry.createdAt)
	expiresDate.setSeconds(createdDate.getSeconds() + entry.expiration)

	return (
		<div style={{ width: "100%", position: "relative" }}>
			<div
				className="container"
				style={{
					padding: "1rem",
					borderRadius: "var(--defaultBorderRadius)",
					backgroundColor: "var(--section)",
					width: "100%",
					alignItems: "start",
					boxSizing: "border-box",
					flexDirection: "row",
					gap: "1rem",
					transition: "all 0.25s ease-in-out",
					top: 0,
					left: 0,
				}}
				id={"token_" + docId}
			>
				<div
					className="container"
					style={{
						gap: "0.5rem",
						flexGrow: 1,
						alignItems: "start",
						width: "100%",
						overflow: "hidden",
					}}
				>
					<div
						className="container"
						style={{
							gap: "0.5rem",
							flexDirection: "row",

							overflow: "hidden",
							width: "100%",
							justifyContent: "start",
						}}
					>
						<span style={{ opacity: 0.5 }}>Name:</span>
						<span
							style={{
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
								overflow: "hidden",
							}}
						>
							{entry.name}
						</span>
					</div>
					<div
						className="container"
						style={{
							gap: "0.5rem",
							flexDirection: "row",
							width: "100%",
						}}
					>
						<span style={{ opacity: 0.5 }}>Created on:</span>
						<span>{createdDate.toLocaleString()}</span>
						<div style={{ flexGrow: 1 }} />
					</div>

					<div
						className="container"
						style={{
							gap: "0.5rem",
							flexDirection: "row",
						}}
					>
						<span style={{ opacity: 0.5 }}>Expires on:</span>
						{expiresDate.getTime() >= Date.now() && (
							<span>{expiresDate.toLocaleString()}</span>
						)}
						{expiresDate.getTime() < Date.now() && (
							<span
								style={{
									color: "var(--disturbing)",
									fontWeight: 600,
								}}
							>
								Expired
							</span>
						)}
					</div>

					<div
						className="container"
						style={{
							flexDirection: "row",
							flexWrap: "wrap",
							gap: "0.5rem",
							justifyContent: "start",
						}}
					>
						<span style={{ opacity: 0.5 }}>Scopes:</span>
						{entry.scopes &&
							entry.scopes.length <
								Object.values(PermissionScope).length &&
							entry.scopes.map((scope) => (
								<span
									style={{
										padding: "0.25rem",
										backgroundColor: "var(--highlight)",
										borderRadius: "0.25rem",
									}}
									key={scope}
								>
									{PermissionScope[scope]}
								</span>
							))}
						{entry.scopes &&
							entry.scopes.length >=
								Object.values(PermissionScope).length && (
								<span>All</span>
							)}
						{(entry?.scopes === undefined ||
							entry.scopes.length === 0) && <span>None</span>}
					</div>
				</div>
				<div
					className="container"
					style={{ flexDirection: "row", gap: "0.5rem" }}
				>
					<RefreshTokenButton />
					<DeleteTokenButton />
				</div>
			</div>
		</div>
	)

	function RefreshTokenButton() {
		return (
			<Modal
				trigger={
					<button style={{ backgroundColor: "var(--highlight)" }} title="Refresh token">
						<Refresh />
					</button>
				}
				content={({ close }) => (
					<div
						className="container"
						style={{ padding: "0.5rem", gap: "0.5rem" }}
					>
						<span
							style={{ maxWidth: "20rem", textAlign: "center" }}
						>
							This action will generate a new token with the same
							tokens and lifetime.
							<br />
						</span>
                        Are you sure?
						<IconTextButton
							className="invalidButtonLike"
							icon={Refresh}
							text={"Refresh token"}
                            onClick={(e) => {
                                close(e)
                                refreshToken()
                            }}
						/>
					</div>
				)}
			/>
		)
	}

	function DeleteTokenButton() {
		return (
			<Modal
				trigger={
					<button
						className="invalidButtonLike"
						style={{ backgroundColor: "var(--highlight)" }}
					>
						<Trash />
					</button>
				}
				content={({ close }) => (
					<div
						className="container"
						style={{ padding: "0.5rem", gap: "0.5rem" }}
					>
						This action is irreversible. Are you sure?
						<IconTextButton
							className="invalidButtonLike"
							icon={Trash}
							text={"Delete token"}
							onClick={async (e) => {
								close(e)
								await deleteToken()
							}}
						/>
					</div>
				)}
			/>
		)
	}

    async function refreshToken() {
        const resp = await fetch(import.meta.env.VITE_API_SERVER + `/tokens/${docId}/refresh?token=${await firebaseUser?.getIdToken()}`, {method: 'POST'})
        if (!resp.ok) {
            const error = await resp.json()
            alert('Failed to refresh token\n' + error.message)
            return
        }

        const { tokenEntry, token } = await resp.json()
        console.log(tokenEntry, token)
        onRefresh(tokenEntry, token)
    }

	async function deleteToken() {
		const token = document.getElementById("token_" + docId)

		const bounds = token!.getBoundingClientRect()
		console.log(bounds)

		token!.style.setProperty("transform", "scale(0%)")

		token!.style.setProperty("position", "absolute")

		const parent = token!.parentElement!
		parent.style.setProperty("height", bounds.height + "px")
		parent.style.setProperty("transition", "all 0.25s ease-in-out")

		setTimeout(() => {
			parent.style.setProperty("height", "0px")
			parent.style.setProperty("margin-bottom", "-2rem")
		}, 0)

		const beforeRespTime = Date.now()

		const resp = await fetch(
			import.meta.env.VITE_API_SERVER +
				`/tokens/${docId}?token=${await firebaseUser?.getIdToken()}`,
			{ method: "DELETE" }
		)

		if (!resp.ok) {
			alert("Failed to delete token\n" + (await resp.json()).message)
			token?.style.setProperty("transform", null)
			token?.style.setProperty("position", null)
			parent.style.setProperty("height", null)
			parent.style.setProperty("margin-bottom", null)
			return
		}

		const totalElapsed = Date.now() - beforeRespTime
		console.log(totalElapsed)

		setTimeout(
			() => {
				onDelete()
			},
			Math.max(250 - totalElapsed, 0)
		)
	}
}

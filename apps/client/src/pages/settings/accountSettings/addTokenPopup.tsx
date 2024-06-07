import { IconTextButton, IconInput, ChooseBox } from "components"
import { Check, Cross, Edit } from "components/svg"
import { PAToken, PermissionScope } from "data-types"
import { expiresToSeconds } from "formatters"
import { useFirebaseUser } from "hooks"
import { useState } from "react"
import { createSearchParams, ParamKeyValuePair } from "react-router-dom"

export default function AddTokenPopup({
	onClose,
	onAdd,
    token: defaultToken
}: {
	onClose: () => void
	onAdd: (token: { tokenDocId: string; tokenEntry: PAToken }) => void
    token: {tokenDocId: string, tokenEntry: PAToken, token: string}|undefined
}) {
	const [expires, setExpires] = useState("1h")
	const [scopes, setScopes] = useState<string[]>([])
	const [customExpires, setCustomExpires] = useState("1h")
	const [receivedToken, setReceivedToken] = useState<{
		tokenDocId: string
		tokenEntry: PAToken
		token: string
	}|undefined>(defaultToken)
	const user = useFirebaseUser()

	const choices = Object.keys(PermissionScope)
		.filter((k, i, a) => i >= a.length / 2)
		.map((k) => {
			const value = PermissionScope[k as any] as string
			return { content: k, value: value }
		})

	return (
		<div
			className="container"
			style={{
				position: "absolute",
				left: 0,
				top: 0,
				backgroundColor: `rgba(0,0,0,0.5)`,
				width: "100%",
				height: "100%",
				zIndex: 1000,
			}}
		>
			<div
				className="container"
				style={{
					backgroundColor: "var(--background)",
					padding: "1rem",
					borderRadius: "calc(var(--defaultBorderRadius) * 1.5)",
					gap: "1rem",
					border: "0.125rem solid var(--border)",
				}}
			>
				{receivedToken && (
					<>
						<h2 style={{ margin: 0 }}>Click to copy</h2>
						<span>
							Once this page is closed, you can not get the token
							back.
						</span>
						<span></span>
						<div
							style={{
								position: "relative",
								overflow: "hidden",
							}}
						>
							<div
								style={{
									wordBreak: "break-all",
									resize: "none",
									width: 32 * 16,
									height:
										(receivedToken.token.length / 32) * 8,
									backgroundColor: "var(--section)",
									padding: "1rem",
									color: "var(--foreground)",
									overflowY: "scroll",
									overflowX: "hidden",
									border: "0.125rem solid var(--border)",
									borderRadius: "var(--defaultBorderRadius)",
								}}
								onClick={async () => {
									navigator.clipboard.writeText(
										receivedToken.token
									)

									const confirmationText =
										document.getElementById(
											"token_copied_text"
										)

									if (
										confirmationText?.style.animation ==
										"tokenCopiedAnimation 1s ease-in-out"
									)
										return

									confirmationText?.style.setProperty(
										"animation",
										"tokenCopiedAnimation 1.2s ease-in-out"
									)
									setTimeout(() => {
										confirmationText?.style.setProperty(
											"animation",
											null
										)
									}, 1200)
								}}
							>
								{receivedToken.token}
							</div>
							<div
								id="token_copied_text"
								className="container"
								style={{
									position: "absolute",
									bottom: "1rem",
									margin: "auto",
									width: "100%",
									opacity: 0,
								}}
							>
								<span
									style={{
										padding: "0.5rem",
										backgroundColor: "var(--success)",
										flexDirection: "row",
										gap: "1rem",
										pointerEvents: "none",
										transition: "all 0.2s ease-in-out",
										borderRadius:
											"var(--defaultBorderRadius)",
										border: "0.125rem solid var(--border)",
									}}
								>
									<Check />
									Copied to clipboard
								</span>
							</div>
						</div>
						<div>
							<IconTextButton
								icon={Cross}
								text={"Close"}
								onClick={() => {
									setReceivedToken(undefined)
									onClose()
								}}
							/>
						</div>
					</>
				)}
				{!receivedToken && (
					<>
						<IconInput
							icon={Edit}
							placeholder="Name"
							id="token_name"
							style={{ width: "100%" }}
						/>
						<ChooseBox
							placeholder="Scopes"
							defaultValue={scopes}
							choices={choices}
							onChange={(v) => {
								setScopes(v as string[])
							}}
							multiselect
							style={{ width: "100%" }}
						/>
						<ChooseBox
							placeholder="Expires"
							defaultValue={expires}
							choices={[
								{ content: "1 Hour", value: "1h" },
								{ content: "1 Day", value: "1d" },
								{ content: "1 Week", value: "7d" },
								{ content: "1 Month", value: "30d" },
								{ content: "1 Year", value: "1y" },
								{ content: "Custom", value: "custom" },
							]}
							onChange={(v) => setExpires(v as string)}
							style={{ width: "100%" }}
						/>
						{expires === "custom" && (
							<>
								<IconInput
									icon={Cross}
									placeholder="<number><s|m|d|y>"
									id="token_custom_expires"
									onChange={(e) => {
										const value = e.currentTarget.value
										setCustomExpires(value)
									}}
									style={{ width: "100%" }}
								/>
							</>
						)}
						<div
							className="container"
							style={{
								flexDirection: "row",
								gap: "0.5rem",
								justifyContent: "start",
								width: "100%",
							}}
						>
							<span style={{ opacity: 0.5 }}>Expires on: </span>
							<span id="token_expiration">
								{new Date(
									Date.now() +
										expiresToSeconds(
											expires === "custom"
												? customExpires
												: expires
										) *
											1000
								).toLocaleString()}
							</span>
						</div>
						<div
							className="container"
							style={{
								flexDirection: "row",
								width: "100%",
								gap: "0.5rem",
							}}
						>
							<IconTextButton
								className="invalidButtonLike"
								icon={Cross}
								text={"Close"}
								onClick={onClose}
							/>
							<IconTextButton
								className="successButtonLike"
								icon={Check}
								text={"Create"}
								onClick={async () => {
									const name = (
										document.getElementById(
											"token_name"
										)! as HTMLInputElement
									).value

                                    if (name === undefined || name.length === 0)
                                        return

									const params: ParamKeyValuePair[] = [
										[
											"expires",
											expires === "custom"
												? customExpires
												: expires,
										],
										["name", name],
										[
											"token",
											await user?.getIdToken(true)!,
										],
										...scopes.map(
											(s) =>
												["scopes", s] as [
													string,
													string,
												]
										),
									]

									const searchParams =
										createSearchParams(params)

									console.log(searchParams.toString())

									const resp = await fetch(
										import.meta.env.VITE_API_SERVER +
											`/tokens?${searchParams.toString()}`,
										{ method: "POST" }
									)

									if (!resp.ok) {
										const error = await resp.json()
										alert(
											"Failed to create token\n" +
												error.message
										)
										return
									}

									const tokenData = await resp.json()
									console.log(tokenData)

                                    onAdd({
                                        tokenDocId: tokenData.tokenDocId,
										tokenEntry: tokenData.tokenEntry,
									})
                                    setReceivedToken(tokenData)
								}}
							/>
						</div>
					</>
				)}
			</div>
		</div>
	)
}

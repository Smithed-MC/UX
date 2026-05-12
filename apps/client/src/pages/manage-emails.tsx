import React, { useCallback, useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { At, Logo, QuestionMark, Right, Cross } from "components/svg"
import { IconInput, IconTextButton } from "components"

const API_BASE = import.meta.env.VITE_API_SERVER

export default function ManageSubscription() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()

	const token = searchParams.get("token")
	const listId = searchParams.get("listId")

	const [status, setStatus] = useState<
		"loading" | "ready" | "success" | "error"
	>("loading")
	const [errorMessage, setErrorMessage] = useState("")
	const [successMessage, setSuccessMessage] = useState("")

	const [minecraftUsername, setMinecraftUsername] = useState("")
	const [isSubmitting, setIsSubmitting] = useState(false)

	useEffect(() => {
		if (!token || !listId) {
			setErrorMessage(
				"Invalid management link. Please request a new one."
			)
			setStatus("error")
			return
		}

		fetch(`${API_BASE}/email-lists/${listId}/manage?token=${token}`)
			.then(async (res) => {
				const data = await res.json()
				if (!res.ok)
					throw new Error(data.message || "Link expired or invalid.")

				setStatus("ready")
				setMinecraftUsername(data.minecraftUsername)
			})
			.catch((err) => {
				setErrorMessage(err.message)
				setStatus("error")
			})
	}, [token, listId])

	const handleUpdate = useCallback(async () => {
		setIsSubmitting(true)
		setErrorMessage("")

		try {
			const res = await fetch(
				`${API_BASE}/email-lists/${listId}/manage`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						token,
						action: "update",
						minecraftUsername:
							minecraftUsername.trim() || undefined,
					}),
				}
			)

			const data = await res.json()
			if (!res.ok)
				throw new Error(
					data.message || "Failed to update subscription."
				)

			setSuccessMessage(
				"Your Minecraft account has been updated successfully!"
			)
			setStatus("success")
		} catch (err: any) {
			setErrorMessage(err.message)
		} finally {
			setIsSubmitting(false)
		}
	}, [minecraftUsername])

	const handleUnsubscribe = useCallback(async () => {
		if (!window.confirm("Are you sure you want to unsubscribe?")) return

		setIsSubmitting(true)
		setErrorMessage("")

		try {
			const res = await fetch(
				`${API_BASE}/email-lists/${listId}/manage`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						token,
						action: "unsubscribe",
					}),
				}
			)

			const data = await res.json()
			if (!res.ok)
				throw new Error(data.message || "Failed to unsubscribe.")

			setSuccessMessage(
				"You have been successfully unsubscribed from this list."
			)
			setStatus("success")
		} catch (err: any) {
			setErrorMessage(err.message)
			setIsSubmitting(false)
		}
	}, [])

	return (
		<div
			className="container"
			style={{
				width: "100%",
				flexGrow: 1,
				height: "100%",
				boxSizing: "border-box",
				gap: "4rem",
			}}
		>
			<span style={{ fontSize: "2rem", fontWeight: 600 }}>
				Manage Subscription
			</span>
			<div
				className="container"
				style={{
					backgroundColor: "var(--backgroundAccent)",
					padding: "1rem",
					borderRadius: "var(--defaultBorderRadius)",
					gap: "4rem",
					justifyContent: "start",
					flexDirection: "row",
					width: "100%",
					maxWidth: "42rem",
				}}
			>
				<Logo
					style={{
						width: "12rem",
						height: "12rem",
						flexShrink: 0,
					}}
				/>
				<div
					className="container"
					style={{
						justifyContent: "center",
						alignItems: "start",
						height: "100%",
						width: "100%",
						gap: "1.5rem",
					}}
				>
					{status === "loading" && (
						<span style={{ color: "var(--subText)" }}>
							Loading your subscription data...
						</span>
					)}

					{status === "error" && (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "1rem",
							}}
						>
							<span
								style={{
									color: "var(--disturbing)",
									whiteSpace: "pre-wrap",
								}}
							>
								{errorMessage}
							</span>
							<IconTextButton
								className="highlightButtonLike"
								icon={Right}
								reverse
								text="Return to Home"
								onClick={() => navigate("/")}
							/>
						</div>
					)}

					{status === "success" && (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "1rem",
							}}
						>
							<span style={{ color: "var(--success)" }}>
								{successMessage}
							</span>
							<IconTextButton
								className="highlightButtonLike"
								icon={Right}
								reverse
								text="Return to Home"
								onClick={() => navigate("/")}
							/>
						</div>
					)}

					{status === "ready" && (
						<div
							className="container"
							style={{
								gap: "1rem",
								flexDirection: "column",
								width: "100%",
								flexWrap: "wrap",
								alignItems: "start",
							}}
						>
							<div
								style={{ position: "relative", width: "100%" }}
							>
								<div
									className="container"
									style={{
										flexDirection: "row",
										gap: "0.5rem",
										fontWeight: 500,
										fontSize: "0.75rem",
										position: "absolute",
										bottom: "100%",
										marginBottom: "0.5rem",
										left: 0,
									}}
								>
									MINECRAFT USERNAME
									<QuestionMark
										style={{
											width: "1rem",
											height: "1rem",
										}}
										title="Link your Minecraft account to receive in-game perks or identification."
									/>
								</div>
								<IconInput
									icon={At}
									placeholder="SmithedBot"
									value={minecraftUsername}
									onChange={(e) =>
										setMinecraftUsername(
											e.currentTarget.value
										)
									}
									style={{ width: "100%", maxWidth: "24rem" }}
								/>
							</div>

							{errorMessage !== "" && (
								<span
									style={{
										color: "var(--disturbing)",
										whiteSpace: "pre-wrap",
										fontSize: "0.85rem",
									}}
								>
									{errorMessage}
								</span>
							)}

							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "1rem",
									marginTop: "1rem",
									width: "100%",
									maxWidth: "24rem",
									justifyContent: "center",
									alignItems: "center"
								}}
							>
								<IconTextButton
									className="accentedButtonLike"
									icon={Right}
									reverse
									text={
										isSubmitting
											? "Updating..."
											: "Update Account"
									}
									disabled={isSubmitting}
									onClick={handleUpdate}
								/>

								<IconTextButton
									className="invalidButtonLike"
									icon={Cross}
									reverse
									text="Unsubscribe"
									disabled={isSubmitting}
									onClick={handleUnsubscribe}
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

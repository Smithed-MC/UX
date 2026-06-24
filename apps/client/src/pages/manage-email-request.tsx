import React, { useCallback, useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { At, Logo, Right, List } from "components/svg"
import { IconInput, IconTextButton } from "components"

const API_BASE = import.meta.env.VITE_API_SERVER

export default function ManageEmailRequest() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()

	const initialListId = searchParams.get("listId") || ""

	const [status, setStatus] = useState<"ready" | "success">("ready")
	const [errorMessage, setErrorMessage] = useState("")
	const [successMessage, setSuccessMessage] = useState("")

	const [email, setEmail] = useState("")
	const [listId, setListId] = useState(initialListId)
	const [isSubmitting, setIsSubmitting] = useState(false)

	useEffect(() => {
		if (initialListId) {
			setListId(initialListId)
		}
	}, [initialListId])

	const handleRequest = useCallback(async () => {
		if (!email.trim()) {
			setErrorMessage("Please fill out your email address.")
			return
		}
		if (!listId.trim()) {
			setErrorMessage("Please fill out the email list identifier.")
			return
		}

		setIsSubmitting(true)
		setErrorMessage("")
		setSuccessMessage("")

		try {
			const res = await fetch(
				`${API_BASE}/email-lists/${encodeURIComponent(listId.trim())}/request-management`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: email.trim(),
						redirectUrl: window.location.origin + "/manage-emails",
					}),
				}
			)

			const data = await res.json()
			if (!res.ok)
				throw new Error(data.message || "Failed to request management link.")

			setSuccessMessage(
				"A management link has been requested. Please check your email!"
			)
			setStatus("success")
		} catch (err: any) {
			setErrorMessage(err.message || "Something went wrong.")
		} finally {
			setIsSubmitting(false)
		}
	}, [email, listId])

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
				Request Management Link
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
					{status === "success" ? (
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
					) : (
						<div
							className="container"
							style={{
								gap: "2rem",
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
									EMAIL
								</div>
								<IconInput
									icon={At}
									placeholder="example@smithed.net"
									value={email}
									onChange={(e) =>
										setEmail(e.currentTarget.value)
									}
									style={{ width: "100%", maxWidth: "24rem" }}
								/>
							</div>

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
									EMAIL LIST IDENTIFIER
								</div>
								<IconInput
									icon={List}
									placeholder="summit-26"
									value={listId}
									onChange={(e) =>
										setListId(e.currentTarget.value)
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
											? "Requesting..."
											: "Request Management Link"
									}
									disabled={isSubmitting}
									onClick={handleRequest}
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

import { IconTextButton, Spinner } from "components"
import { Cross, Check } from "components/svg"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

export type SavingState =
	| {
			mode: "off" | "saving" | "saved"
	  }
	| {
			mode: "error"
			error: {
				error: string
				statusCode: number
				message: string
			}
	  }
      
export default function SaveWidget({
	onSave,
}: {
	onSave: (setSavingState: (state: SavingState) => void) => Promise<void>
}) {
	const [savingState, setSavingState] = useState<SavingState>({ mode: "off" })
	const navigate = useNavigate()

	useEffect(() => {
		if (savingState.mode == "saved")
			setTimeout(() => setSavingState({ mode: "off" }), 1000)
	}, [savingState])

	return (
		<div
			className="container"
			style={{
				flexDirection: "row",
				width: "100%",
				justifyContent: "end",
				position: "sticky",
				bottom: "1rem",
				right: "1rem",
			}}
		>
			<div
				className="container"
				style={{
					flexDirection: "row",
					gap: "1rem",
					backgroundColor: "var(--background)",
					borderRadius: "calc(1.5 * var(--defaultBorderRadius))",
					padding: "0.5rem",
				}}
			>
				{savingState.mode == "off" && (
					<>
						<IconTextButton
							className="buttonLike invalidButtonLike"
							text="Cancel"
							icon={Cross}
							onClick={() => {
								navigate(-1)
							}}
						/>
						<IconTextButton
							className="buttonLike successButtonLike"
							text="Save"
							icon={Check}
							onClick={() => onSave(setSavingState)}
						/>
					</>
				)}
				{savingState.mode == "saving" && (
					<div
						className="container"
						style={{
							backgroundColor: "var(--success)",
							padding: "0.5rem 1rem",
							flexDirection: "row",
							borderRadius: "var(--defaultBorderRadius)",
							gap: "1rem",
						}}
					>
						<Spinner
							style={{
								width: "1rem",
								height: "1rem",
								border: "2px solid var(--foreground)",
								borderTop: "2px solid var(--border)",
							}}
						/>
						<div
							style={{
								height: "1.25rem",
								width: "0.125rem",
								opacity: 0.15,
								backgroundColor: "var(--foreground)",
							}}
						/>
						Saving...
					</div>
				)}
				{savingState.mode == "saved" && (
					<>
						<div
							className="container"
							style={{
								backgroundColor: "var(--success)",
								padding: "0.5rem 1rem",
								flexDirection: "row",
								borderRadius: "var(--defaultBorderRadius)",
								gap: "1rem",
							}}
						>
							<Check />
							<div
								style={{
									height: "1.25rem",
									width: "0.125rem",
									opacity: 0.15,
									backgroundColor: "var(--foreground)",
								}}
							/>
							Saved!
						</div>
					</>
				)}
				{savingState.mode == "error" && (
					<>
						<div
							className="container"
							style={{
								backgroundColor: "var(--disturbing)",
								padding: "0.5rem 1rem",
								borderRadius: "var(--defaultBorderRadius)",
							}}
						>
							{savingState.error.statusCode >= 500 && (
								<span>
									A problem occured on our end! Please report
									to <a href="/discord">discord</a>
								</span>
							)}
							<div>{savingState.error.message}</div>
						</div>
						<IconTextButton
							text={"Close"}
							icon={Cross}
							onClick={() => setSavingState({ mode: "off" })}
						/>
					</>
				)}
			</div>
		</div>
	)
}

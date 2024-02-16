import React, {
	CSSProperties,
	MouseEventHandler,
	createContext,
	useState,
} from "react"

interface ModalContext {
	close: MouseEventHandler
}

const ModalContext = createContext<ModalContext>({ close: () => {} })

export default function Modal({
	trigger,
	content,
	onClose,
	style,
	offset,
}: {
	trigger: React.ReactElement
	style?: CSSProperties
	offset?: string | number
	content?: (ctx: ModalContext) => React.ReactElement
	onClose?: () => void
}) {
	const [open, setOpen] = useState(false)

	trigger = React.createElement(trigger.type, {
		...trigger.props,
		onClick: (e: MouseEvent) => {
			e.preventDefault()
			setOpen(!open)
			if (!open && onClose) onClose()
		},
	})

	return (
		<div
			className="container"
			style={{ position: "relative", ...style }}
			onMouseLeave={() => setOpen(false)}
		>
			{trigger}
			<div
				className="container"
				style={{
					position: "absolute",
					top: `calc(100% - ${offset ?? "0.5rem"})`,
					padding: "1rem 1rem 1rem 1rem",
					zIndex: open ? 10 : -100,
					opacity: open ? 1 : 0,
					transition: "opacity 0.25s ease-in-out",
				}}
			>
				<div style={{ marginBottom: "-0.5rem" }}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="34"
						height="30"
						viewBox="0 0 34 30"
						fill="none"
						style={{
							position: "absolute",
							zIndex: -1,
							marginTop: -2,
						}}
					>
						<path
							d="M17 0L33.8875 29.25H0.112505L17 0Z"
							fill="var(--border)"
							stroke="var(--border)"
							strokeWidth="0.125rem"
							strokeLinecap="inherit"
						/>
					</svg>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="34"
						height="30"
						viewBox="0 0 34 30"
						fill="none"
						style={{ zIndex: 2 }}
					>
						<path
							d="M17 0L33.8875 29.25H0.112505L17 0Z"
							fill="var(--bold)"
						/>
					</svg>
				</div>
				<div
					style={{
						padding: "0.5rem",
						background: "var(--bold)",
						borderRadius: "var(--defaultBorderRadius)",
						boxSizing: "border-box",
						minWidth: "4rem",
						width: "max-content",
						border: "0.125rem solid var(--border)",
						zIndex: -1,
					}}
				>
					{content &&
						content({
							close: (e) => {
								e?.preventDefault()
								setOpen(false)
								if (onClose) onClose()
							},
						})}
				</div>
			</div>
		</div>
	)
}

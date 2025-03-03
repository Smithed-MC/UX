import React, {
	CSSProperties,
	MouseEventHandler,
	createContext,
	useEffect,
	useRef,
	useState,
} from "react"

interface ModalContext {
	close: MouseEventHandler
	openState: boolean
}

const ModalContext = createContext<ModalContext>({
	close: () => {},
	openState: false,
})

export default function Modal({
	trigger,
	content,
	onClose,
	onOpen,
	style,
	offset,
	fragment,
	className,
}: {
	trigger: React.ReactElement
	fragment?: boolean
	className?: string
	style?: CSSProperties
	offset?: string | number
	content?: (ctx: ModalContext) => React.ReactElement
	onClose?: () => void
	onOpen?: () => void
}) {

	const [open, setOpen] = useState(false)
	const modalContentRef = useRef<HTMLDivElement>(null)

	trigger = React.createElement(trigger.type, {
		...trigger.props,
		onClick: (e: MouseEvent) => {
			e.preventDefault()
			if (open && onClose) onClose()
			if (!open && onOpen) onOpen()
			setOpen(!open)
		},
	})

	function recalculateContentHeight() {

		const bottom = [...document.getElementById("outlet")!.children].map(c => c.getBoundingClientRect().bottom).sort().at(-1)!
		const rect = modalContentRef.current!.getBoundingClientRect()

		if (rect.bottom > bottom) {
			modalContentRef.current?.style.setProperty("max-height", `${rect.height - (rect.bottom - bottom)}px`)
		}

	}

	useEffect(() => {
		recalculateContentHeight()
	}, [])

	const frag = (
		<>
			{trigger}
			<div
				className="container"
				style={{
					position: "absolute",
					top: `calc(100% - ${offset ?? "0.5rem"})`,
					padding: "1rem 1rem 1rem 1rem",
					zIndex: 1000,
					opacity: open ? 1 : 0,
					pointerEvents: open ? "all" : "none",
					transition: "opacity 0.25s ease-in-out",
					overflow: "auto"
				}}

				ref={modalContentRef}
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
					className="modalContent"
					style={{
						padding: "0.5rem",
						background: "var(--bold)",
						borderRadius: "var(--defaultBorderRadius)",
						boxSizing: "border-box",
						minWidth: "4rem",
						width: "max-content",
						border: "0.125rem solid var(--border)",
						right: "auto",
						zIndex: -1,
						overflowY: "auto" 
					}}
				>
					{content &&
						content({
							close: (e) => {
								e?.preventDefault()
								setOpen(false)
								if (onClose) onClose()
							},
							openState: open,
						})}
				</div>
			</div>
		</>
	)

	if (fragment) return frag

	return (
		<div
			className={["container", className].join(" ")}
			style={{ position: "relative", ...style }}
			onMouseLeave={() => setOpen(false)}
		>
			{frag}
		</div>
	)
}

import React, {
	MouseEventHandler,
	createContext,
	useEffect,
	useRef,
	useState,
} from "react"

interface FullscreenModalContext {
	close: MouseEventHandler
	openState: boolean
}

const FullscreenModalContext = createContext<FullscreenModalContext>({
	close: () => {},
	openState: false,
})

interface FullscreenModalProps {
	trigger: React.ReactElement
	onClose?: () => void
	onOpen?: () => void
	title: string
	children?: React.ReactNode
}

export default function FullscreenModal({
	trigger,
	onClose,
	onOpen,
	title,
	children
}: FullscreenModalProps) {
	const [open, setOpen] = useState(false)
	const modalRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (open && onOpen) onOpen()
	}, [open])

	trigger = React.createElement(trigger.type, {
		...trigger.props,
		onClick: (e: MouseEvent) => {
			e.preventDefault()
			if (open && onClose) onClose()
			if (!open && onOpen) onOpen()
			setOpen(!open)
		},
	})

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setOpen(false)
				if (onClose) onClose()
			}
		}

		if (open) {
			document.addEventListener("keydown", handleEscape)
			document.body.style.overflow = "hidden"
		} else {
			document.body.style.overflow = "auto"
		}

		return () => {
			document.removeEventListener("keydown", handleEscape)
			document.body.style.overflow = "auto"
		}
	}, [open])

	const handleBackdropClick = (e: React.MouseEvent) => {
		if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
			setOpen(false)
			if (onClose) onClose()
		}
	}

	return (
		<FullscreenModalContext.Provider
			value={{ close: () => setOpen(false), openState: open }}
		>
			{trigger}
			{open && (
				<div
					style={styles.backdrop}
					onClick={handleBackdropClick}
				>
					<div
						ref={modalRef}
						style={styles.modalContainer}
					>
						<div style={styles.modalHeader}>
							<h2 style={styles.modalTitle}>{title}</h2>
							<button
								onClick={(e) => {
									e.stopPropagation()
									setOpen(false)
									if (onClose) onClose()
								}}
								style={styles.closeButton}
								aria-label="Close modal"
							>
								×
							</button>
						</div>
						<div style={styles.modalContent}>
							{children}
						</div>
					</div>
				</div>
			)}
		</FullscreenModalContext.Provider>
	)
}

const styles = {
	backdrop: {
		position: "fixed" as const,
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0, 0, 0, 0.25)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		zIndex: 1000,
		opacity: 1,
		transition: "opacity 0.25s ease-in-out",
	},
	modalContainer: {
		backgroundColor: "var(--section)",
		borderRadius: "calc(var(--defaultBorderRadius) * 1.5)",
		border: "0.125rem solid var(--border)",
		overflow: "hidden",
		display: "flex",
		flexDirection: "column" as const,
		position: "relative" as const,
	},
	modalHeader: {
		padding: "1rem 1.5rem",
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		minHeight: "48px",
	},
	modalTitle: {
		color: "var(--version-selector-text)",
		fontSize: "1.25rem",
		fontWeight: "bold",
		margin: 0,
		fontFamily: "inherit",
	},
	closeButton: {
		backgroundColor: "transparent",
		border: "none",
		color: "var(--version-selector-muted)",
		fontSize: "2rem",
		cursor: "pointer",
		padding: "0.5rem",
		lineHeight: 1,
		transition: "color 0.15s ease-in-out",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: "40px",
		height: "40px",
		borderRadius: "var(--defaultBorderRadius)",
	},
	modalContent: {
		flexGrow: 1,
		overflowY: "auto" as const,
		position: "relative" as const,
		borderTop: "0.0625rem solid var(--border)",
	},
}

import React, { CSSProperties } from "react"
import { AddToBundle, Edit, RemoveFromBundle } from "./svg"
import Link from "./Link"

interface AddButtonProps {
	add: boolean
	onClick?: () => void
	link?: string
	[key: string]: any
}

export default function AddRemovePackButton({
	add,
	link,
	onClick,
	...props
}: AddButtonProps) {
	const ButtonIcon = () =>
		add ? (
			<AddToBundle style={{ stroke: "var(--buttonText)" }} />
		) : (
			<RemoveFromBundle style={{ stroke: "var(--buttonText)" }} />
		)

	const sharedStyle: CSSProperties = {
		width: 48,
		height: 48,
		borderRadius: 24,
		padding: 8,
		boxSizing: "border-box",
		backgroundColor: `var(--${add ? "accent" : "badAccent"})`,
	}

	return (
		<div
			style={{ width: 48, height: 48, flexShrink: 0, ...props.style }}
			{...props}
		>
			{link === undefined && (
				<button
					className="button wobbleHover container"
					style={sharedStyle}
					onClick={onClick}
					disabled={props.disabled}
				>
					<ButtonIcon />
				</button>
			)}
			{link !== undefined && (
				<Link
					className="button wobbleHover container"
					style={sharedStyle}
					onClick={onClick}
					to={link}
				>
					<ButtonIcon />
				</Link>
			)}
		</div>
	)
}

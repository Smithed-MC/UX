import React from "react"
import { Edit } from "./svg"

interface EditButtonProps {
	link?: string
	onClick?: () => void
	[key: string]: any
}

export default function EditButton({
	link,
	onClick,
	...props
}: EditButtonProps) {
	return (
		<div
			style={{ width: 48, height: 48, flexShrink: 0, ...props.style }}
			{...props}
		>
			<a
				className="button wobbleHover container"
				style={{
					maxWidth: 48,
					maxHeight: 48,
					borderRadius: 24,
					padding: 12,
				}}
				href={link}
				onClick={onClick}
			>
				<Edit style={{ fill: "var(--buttonText)" }} />
			</a>
		</div>
	)
}

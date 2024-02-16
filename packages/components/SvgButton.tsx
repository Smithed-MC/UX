import React from "react"

interface EditButtonProps {
	link?: string
	onClick?: () => void
	[key: string]: any
	svg: any
	svgStyle?: React.CSSProperties
	buttonStyle?: React.CSSProperties
}

export default function SvgButton({
	link,
	svg: SVG,
	svgStyle,
	buttonStyle,
	onClick,
	...props
}: EditButtonProps) {
	return (
		<div
			style={{
				width: 48,
				height: 48,
				flexShrink: 0,
				boxSizing: "border-box",
				...props.style,
			}}
			{...props}
		>
			<a
				className="button wobbleHover container"
				style={{
					width: 48,
					height: 48,
					borderRadius: 24,
					padding: 12,
					justifyContent: "center",
					overflow: "hidden",
					boxSizing: "border-box",
					...buttonStyle,
				}}
				href={link}
				target="_blank"
				onClick={onClick}
			>
				<SVG
					style={{
						...svgStyle,
						width: 32,
						height: 32,
						position: "absolute",
						top: 8,
						left: 8,
					}}
				/>
			</a>
		</div>
	)
}

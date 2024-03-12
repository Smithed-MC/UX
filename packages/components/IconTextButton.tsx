import {
	ButtonHTMLAttributes,
	CSSProperties,
	FunctionComponent,
	SVGProps,
} from "react"
import { Link } from "react-router-dom"

export type IconTextButtonProps  = {
	text: string | JSX.Element
	icon?: FunctionComponent<SVGProps<SVGSVGElement>> | string
	iconElement?: JSX.Element
	reverse?: boolean
} & React.HTMLProps<HTMLAnchorElement>

export function IconTextButton({
	text,
	icon: IconSvg,
	iconElement,
	reverse,
	href,
	style,
	target,
	className,
	onClick,
	onMouseEnter,
	onMouseLeave,
	rel,
	disabled,
}: IconTextButtonProps) {
	return (
		<a
			className={`buttonLike${disabled ? " disabled" : ""} ` + className}
			style={{ flexDirection: reverse ? "row-reverse" : "row", ...style }}
			href={href}
			target={target}
			onClick={onClick}
			rel={rel}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<div
				className="container"
				style={{ flexShrink: 0, height: "100%" }}
			>
				{IconSvg !== undefined &&
					typeof IconSvg === "string" &&
					IconSvg}
				{IconSvg !== undefined && typeof IconSvg !== "string" && (
					<IconSvg />
				)}
				{iconElement !== undefined && iconElement}
			</div>

			{!(IconSvg === undefined && iconElement === undefined) && (
				<div
					style={{
						width: 2,
						height: 20,
						opacity: 0.15,
						backgroundColor: "white",
					}}
				/>
			)}

			<span
				style={{
					flexGrow: 1,
					whiteSpace: "nowrap",
					textOverflow: "ellipsis",
					overflow: "hidden",
				}}
			>
				{text}
			</span>
		</a>
	)
}

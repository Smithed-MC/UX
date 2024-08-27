import {
	ButtonHTMLAttributes,
	CSSProperties,
	FunctionComponent,
	SVGProps,
} from "react"
import Link from "./Link"

export type IconTextButtonProps = {
	text: string | JSX.Element
	icon?: FunctionComponent<SVGProps<SVGSVGElement>> | string
	iconElement?: JSX.Element
	reverse?: boolean
	to?: string
	centered?: boolean
} & React.HTMLProps<HTMLAnchorElement>

export default function IconTextButton({
	text,
	icon: IconSvg,
	iconElement,
	reverse,
	href,
	to,
	style,
	target,
	className,
	onClick,
	onMouseEnter,
	onMouseLeave,
	rel,
	disabled,
	centered,
}: IconTextButtonProps) {
	const Element = href || to ? Link : (props: any) => <a {...props}/>

	return (
		<Element
			className={`buttonLike${disabled ? " disabled" : ""} ` + className}
			style={{
				flexDirection: reverse ? "row-reverse" : "row",
				justifyContent: centered ? "center" : undefined,
				...style,
			}}
			to={href ?? to ?? ""}
			target={target}
			onClick={onClick}
			rel={rel}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<div
				className="container"
				style={{ flexShrink: 0, height: "100%", width: "1rem" }}
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
						backgroundColor: style?.color ?? "var(--foreground)",
					}}
				/>
			)}

			<span
				style={{
					whiteSpace: "nowrap",
					textOverflow: "ellipsis",
					overflow: "hidden",
					flexGrow: centered ? undefined : 1
				}}
			>
				{text}
			</span>
		</Element>
	)
}

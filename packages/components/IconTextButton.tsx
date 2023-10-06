import {
	ButtonHTMLAttributes,
	CSSProperties,
	FunctionComponent,
	SVGProps,
} from "react";

interface IconTextButtonProps {
	text: string | JSX.Element;
	icon?: FunctionComponent<SVGProps<SVGSVGElement>> | string;
	iconElement?: JSX.Element;
	reverse?: boolean;
}

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
	disabled
}: IconTextButtonProps & any) {
	return (
		<a
			className={
				`buttonLike${disabled ? " disabled" : ""} ` + className
			}
			style={{ flexDirection: reverse ? "row-reverse" : "row", ...style }}
			href={href}
			target={target}
			onClick={onClick}
			rel={rel}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			{IconSvg !== undefined && typeof IconSvg === "string" && IconSvg}
			{IconSvg !== undefined && typeof IconSvg !== "string" && <IconSvg />}
			{iconElement !== undefined && iconElement}
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
			<label>{text}</label>
		</a>
	);
}

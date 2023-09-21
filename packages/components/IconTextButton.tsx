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
	...props
}: IconTextButtonProps & any) {
	return (
		<a
			className={
				`buttonLike${props.disabled ? " disabled" : ""} ` + props.className
			}
			style={{ flexDirection: reverse ? "row-reverse" : "row", ...style }}
			href={href}
			target={target}
			onClick={props.onClick}
			rel={props.rel}
            onMouseOver={props.onMouseOver}
            onMouseLeave={props.onMouseLeave}
		>
			{IconSvg !== undefined && typeof IconSvg === "string" && IconSvg}
			{IconSvg !== undefined && typeof IconSvg !== "string" && <IconSvg />}
			{iconElement !== undefined && iconElement}
			<div
				style={{
					width: 2,
					height: 20,
					opacity: 0.15,
					backgroundColor: "white",
				}}
			/>
			<label>{text}</label>
		</a>
	);
}

import { To } from "react-router-dom"
import IconTextButton, { IconTextButtonProps } from "./IconTextButton.js"
import { AnchorHTMLAttributes, HTMLProps } from "react"
import Link from "./Link.js"


interface NavButtonProps {
	to: To,
	children?: any,
	className?: string
}

export default function NavButton({
	to,
	...props
}: NavButtonProps) {

	return (
		<Link
			className={`navBarOption ${props.className ?? ''}`}
		 	to={to}
			{...props}
		>
			{props.children}
		</Link>
	)
}

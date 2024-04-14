import { useMatch } from "react-router-dom"
import { IconTextButton, IconTextButtonProps } from "./IconTextButton.js"

interface NavButtonProps extends IconTextButtonProps {
	selectedClass?: string
}

export default function NavButton({
	selectedClass,
	className,
	...props
}: NavButtonProps) {
	const match = useMatch(props.href ?? props.to ?? "")

	return (
		<IconTextButton
			className={`${match != null ? selectedClass + " " : ""}${className ?? ""}`}
			{...props}
		/>
	)
}

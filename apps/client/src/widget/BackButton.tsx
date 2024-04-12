import { IconTextButton } from "components/IconTextButton"
import { Right } from "components/svg"
import "./BackButton.css"
import { useNavigate } from "react-router-dom"

function BackButton() {
	const nav = useNavigate()
	return (
			<IconTextButton
				text="Back"
				onClick={() => {
					nav(-1)
				}}
				iconElement={<Right style={{transform: 'rotate(180deg)'}}/>}
			/>
	)
}

export default BackButton

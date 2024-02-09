import { IconTextButton } from "components/IconTextButton"
import { Right } from "components/svg"
import "./BackButton.css"
import { useNavigate } from "react-router-dom"

function BackButton() {
	const nav = useNavigate()
	return (
		<div className="backButton">
			<IconTextButton
				text="Back"
				onClick={() => {
					nav(-1)
				}}
				icon={Right}
			/>
		</div>
	)
}

export default BackButton

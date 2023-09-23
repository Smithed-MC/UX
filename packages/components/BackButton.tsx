import { IconTextButton } from "./IconTextButton";
import { Left, Right } from "./svg";
import "./BackButton.css";

function BackButton() {
	return (
		<div className="backButton">
			<IconTextButton
				text="Back"
				href="javascript:window.history.back();"
				icon={Right}
			/>
		</div>
	);
}

export default BackButton;

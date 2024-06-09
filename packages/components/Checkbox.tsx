import "./Checkbox.css"

export default function Checkbox({
	defaultValue,
	onChange,
}: {
	defaultValue?: boolean
	onChange: (v: boolean) => void
}) {
	return (
		<div className={`checkbox ${defaultValue ? "selected" : ""}`}
        onClick={(e) => {
            const element = e.currentTarget

            if (element.classList.contains("selected")) {
                onChange(false)
                element.classList.remove("selected")
            } else {
                onChange(true)
                element.classList.add("selected")
            }
        }}>
			<div
				className="check"
			></div>
		</div>
	)
}

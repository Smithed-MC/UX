import { CSSProperties, ReactElement, useEffect, useRef, useState } from "react"
import "./ChooseBox.css"
import { Check, Right } from "./svg"

interface ChooseBoxProps {
	placeholder?: string
	defaultValue?: string | string[]
	multiselect?: boolean
	choices: { value: string; content: string }[]
	onChange?: (value: string | string[]) => void
	style?: CSSProperties
	triggerStyle?: CSSProperties
	className?: string
	flip?: boolean
	beforeOpen?: () => void
	title?: string
}

export default function ChooseBox({
	placeholder,
	defaultValue,
	multiselect,
	choices,
	onChange,
	style,
	className,
	flip,
	beforeOpen,
	title,
	triggerStyle
}: ChooseBoxProps) {
	const [value, setValue] = useState<string | string[]>(
		defaultValue ?? (multiselect ? [] : "")
	)
	const [open, setOpen] = useState(false)

	const triggerRef = useRef<HTMLDivElement>(null)
	const optionsRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		function listener(this: Document, e: MouseEvent) {
			setOpen(false)
		}
		document.addEventListener("mousedown", listener)

		return () => {
			document.removeEventListener("mousedown", listener)
		}
	}, [])

	useEffect(() => {
		setValue(defaultValue ?? "")
	}, [defaultValue])

	const clickTrigger = (e: React.MouseEvent | React.KeyboardEvent) => {
		e.stopPropagation()
		beforeOpen && beforeOpen()
		setOpen(!open)
	}

	const clickOption = (
		e: React.MouseEvent | React.KeyboardEvent,
		newValue: string
	) => {
		e.stopPropagation()

		if (multiselect && value instanceof Array) {
			if (value.includes(newValue) && value.indexOf(newValue) != -1) {
				value.splice(value.indexOf(newValue), 1)
			} else {
				value.push(newValue)
			}
			if (onChange) onChange(value)
			setValue([...value])
		} else if (value !== newValue) {
			setOpen(false)
			if (onChange) onChange(newValue)
			setValue(newValue)
		}
	}

	const calculateWorstCase = () => {
		if (multiselect) {
			const longestChoice = choices
				.sort((a, b) => a.content.length - b.content.length)
				.at(-2)
			return `${longestChoice?.content} & 1 more`
		} else {
			const longestChoice = choices
				.sort((a, b) => a.content.length - b.content.length)
				.at(-1)
			return longestChoice?.content
		}
	}

	const getContent = () => {
		if (multiselect) {
			const firstChoice = choices.find((c) => value.includes(c.value))
			return `${firstChoice?.content} ${value.length > 1 ? `& ${value.length - 1} more` : ""}`
		} else {
			return choices.find((c) => c.value === value)?.content
		}
	}

	let options = (
		<div
			className={`chooseBoxOptionsWrapper ${open ? "open" : ""} ${flip ? "flip" : "noflip"}`}
		>
			<div
				className={`chooseBoxOptions ${open ? "open" : ""} ${flip ? "flip" : "noflip"}`}
				ref={optionsRef}
			>
				{choices.map((c, i) => (
					<div
						key={c.value}
						onMouseDown={(e) => clickOption(e, c.value)}
						className="chooseBoxOption"
						tabIndex={i}
						onKeyDown={(e) => {
							const direction =
								e.key === "ArrowDown"
									? 1
									: e.key === "ArrowUp"
										? -1
										: 0
							if (direction !== 0) {
								e.preventDefault()

								const children = [
									...e.currentTarget.parentElement!.children,
								] as HTMLElement[]

								if (i + direction < 0) i = children.length
								children[
									(i + direction) % children.length
								].focus()
							}

							if (e.key === " " || e.key === "Enter") {
								e.preventDefault()
								clickOption(e, c.value)
							}

							if (e.key === "Tab") e.preventDefault()

							if (e.key === "Escape") {
								e.preventDefault()
								clickTrigger(e)
								triggerRef.current!.focus()
							}
						}}
					>
						{c.content}
						{(multiselect
							? value.includes(c.value)
							: value === c.value) &&
							(multiselect ? (
								<Check />
							) : (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="9"
									height="8"
									viewBox="0 0 9 8"
									fill="none"
								>
									<circle
										cx="4.5"
										cy="4"
										r="4"
										fill="#FFF8F0"
									/>
								</svg>
							))}
					</div>
				))}
			</div>
		</div>
	)

	return (
		<div
			className={"chooseBoxWrapper " + className}
			style={{
				flexDirection: flip ? "column-reverse" : "column",
				...style,
				zIndex: open ? 100 : style?.zIndex,
			}}
			title={title}
			onMouseLeave={() => setOpen(false)}
		>
			{options}
			<div
				className={`chooseBoxTrigger ${open ? "open" : ""} ${flip ? "flip" : "noflip"}`}
				style={triggerStyle}
				onMouseDown={clickTrigger}
				ref={triggerRef}
				tabIndex={0}
				onKeyDown={(e) => {
					if (
						e.key === "ArrowDown" ||
						e.key === "ArrowUp" ||
						e.key === " "
					) {
						e.preventDefault()
						if (!open) {
							clickTrigger(e)
							return
						}

						const children = [
							...optionsRef.current!.children,
						] as HTMLElement[]
						children.at(e.key === "ArrowDown" ? 0 : -1)!.focus()
					}
				}}
			>
				<span
					style={{
						lineHeight: "20px",
						WebkitLineClamp: 1,
						margin: 0,
						textOverflow: "ellipsis",
						display: "-webkit-box",
						WebkitBoxOrient: "vertical",
						overflow: "hidden",
						flexGrow: 1,
						width: "100%",
						wordBreak: "break-all",
					}}
				>
					<span
						style={{ opacity: 0.5, cursor: "pointer" }}
						className="chooseBoxPlaceholder"
					>
						{`${placeholder ?? "Choice"}: `}
					</span>
					{value.length !== 0 ? (
						getContent()
					) : (
						<span>
							<label className="chooseBoxPlaceholder">
								None Selected
							</label>
							<label className="chooseBoxSecondaryPlaceHolder">
								{placeholder}
							</label>
						</span>
					)}
				</span>
				<div
					style={{
						height: "1rem",
						width: 2,
						opacity: 0.2,
						flexShrink: 0,
						backgroundColor: "white",
					}}
				/>
				<Right
					style={{
						transform: `rotate(${open ? (flip ? "-90" : "90") : flip ? "90" : "-90"}deg)`,
						transition: "all 0.25s ease-in-out",
						flexShrink: 0,
					}}
				/>
			</div>
		</div>
	)
}

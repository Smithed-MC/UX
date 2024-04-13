import React, { PropsWithChildren, useEffect, useId } from "react"
import { useRef, useState } from "react"
import "./CategoryBar.css"

interface CategoryBarProps {
	children:
		| React.ReactElement<CategoryChoiceProps>[]
		| React.ReactElement<CategoryChoiceProps>
	onChange?: (v: string) => void
	defaultValue?: string
}

export default function CategoryBar({
	children,
	defaultValue,
	onChange,
}: CategoryBarProps) {
	if (!(children instanceof Array)) children = [children]

	const [value, setValue] = useState<string>("")

	useEffect(() => {
		if (!(children instanceof Array)) children = [children]

		const setDefaultValue = () => {
			if (!(children instanceof Array)) children = [children]

			defaultValue =
				children.filter((c) => !c.props.disabled)[0].props.value ??
				undefined
		}

		if (defaultValue) {
			let child = children.find((c) => c.props.value === defaultValue)

			if (child === undefined || child.props.disabled) {
				setDefaultValue()
			}
		} else {
			setDefaultValue()
		}

		setValue(defaultValue ?? "")
	}, [])

	const selectedChoice = useRef<HTMLButtonElement>(null)
	const backgroundElement = useRef<HTMLDivElement>(null)

	if (new Set(children.map((c) => c.props.value)).size < children.length)
		throw Error("Category bar has duplicate values")

	function updateBackgroundSlide(
		selected: HTMLElement,
		shouldTransition: boolean = true
	) {
		if (selected == null) return
		const selectedRect = selected.getBoundingClientRect()

		const backgroundStyle = backgroundElement.current!.style
		const parentRect =
			backgroundElement.current!.parentElement!.getBoundingClientRect()

		let transition = backgroundStyle.transition
		if (!shouldTransition) backgroundStyle.setProperty("transition", "none")
		else backgroundStyle.removeProperty("transition")

		backgroundStyle.setProperty("width", `${selectedRect.width}px`)
		backgroundStyle.setProperty("height", `${selectedRect.height}px`)

		backgroundStyle.setProperty(
			"left",
			selectedRect.left - parentRect.left + "px"
		)
		backgroundStyle.setProperty(
			"top",
			selectedRect.top - parentRect.top + "px"
		)

		if (!shouldTransition)
			setTimeout(
				() => backgroundStyle.setProperty("transition", transition),
				1
			)
	}

	useEffect(() => {
		const onResize = () =>
			updateBackgroundSlide(selectedChoice.current!, false)

		window.addEventListener("resize", onResize)
		return () => window.removeEventListener("resize", onResize)
	}, [])

	useEffect(() => {
		setValue(defaultValue ?? "")
		updateBackgroundSlide(selectedChoice.current!, false)
	}, [defaultValue])

	function wrapOnClick(
		c: React.ReactElement<
			CategoryChoiceProps & React.HTMLProps<HTMLElement>
		>
	) {
		let props = c.props
		const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
			if (value != props.value) {
				if (onChange) onChange(props.value)
				setValue(props.value)
				updateBackgroundSlide(e.currentTarget)
			}

			if (props.onClick) props.onClick(e)
		}

		return (
			<CategoryChoice
				{...props}
				key={props.key ?? props.value}
				onClick={onClick}
				selected={value === props.value}
				ref={value === props.value ? selectedChoice : undefined}
			/>
		)
	}

	return (
		<div className="container categoryBar">
			<div className="psuedoBackground" ref={backgroundElement} />
			{children.filter((c) => !c.props.hidden).map(wrapOnClick)}
		</div>
	)
}

interface CategoryChoiceProps {
	value: string
	text: string
	icon: JSX.Element
	selected?: boolean
	disabled?: boolean
	hidden?: boolean
	children?: any
	id?: string
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export const CategoryChoice = React.forwardRef(function (
	{ selected, onClick, children, icon, text, disabled, id}: CategoryChoiceProps,
	forwardRef?: React.ForwardedRef<HTMLButtonElement>
) {
	const [hasError, setHasError] = useState(false)
	const name = useId()

	function setError(this: HTMLButtonElement, e: Event) {
		setHasError((e as CustomEvent).detail)
	}

	useEffect(() => {
		const button = document.getElementsByName(name)[0]

		button?.addEventListener('setError', setError)
		return () => button?.removeEventListener('setError', setError)
	}, [])


	return (
		<button
			className={`exclude container categoryChoice ${selected ? "selected" : ""} ${hasError ? "hasError" : ""}`}
			onClick={onClick}
			ref={forwardRef}
			disabled={disabled}
			id={id}
			name={name}
		>
			<div
				className="container content"
				style={{ gap: "1rem", flexDirection: "row" }}
			>
				{icon}
				<div
					style={{
						width: "0.125rem",
						height: "1.25rem",
						backgroundColor: "var(--foreground)",
						opacity: 0.2,
					}}
				/>
				<span>{text}</span>
			</div>
			{selected && children}
		</button>
	)
})

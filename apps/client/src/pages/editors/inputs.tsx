import { ValueError, ValueErrorType } from "@sinclair/typebox/errors"
import { IconInput } from "components"
import { useEffect, useReducer, useRef, useState } from "react"

export const validUrlRegex = /^http(s?)\:\/\/[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*(:(0-9)*)*(\/?)([a-zA-Z0-9\-\.\?\,\'\/\\\+&amp;%\$#=_]*)?$/gi

export function getPropertyByPath(obj: any, path: string) {
	const properties = path.split("/") // Split the path string into an array of property names

	let currentObj = obj
	for (let prop of properties) {
		if (currentObj && currentObj.hasOwnProperty(prop)) {
			currentObj = currentObj[prop] // Access the property in the object
		} else {
			return undefined // Property not found
		}
	}
	return currentObj // Return the final property value
}

export function setPropertyByPath(obj: any, path: string, data: any) {
	const properties = path.split("/") // Split the path string into an array of property names
	const target = properties.pop()

	if (!target) return

	let currentObj = obj
	for (let prop of properties) {
		if (currentObj && currentObj.hasOwnProperty(prop)) {
			currentObj = currentObj[prop] // Access the property in the object
		} else if (!currentObj.hasOwnProperty(prop)) {
			currentObj[prop] = {}
			currentObj = currentObj[prop]
		}
	}

	if (typeof currentObj === "object") currentObj[target] = data
}

function InputError({ error, inset }: { error?: string; inset?: boolean }) {
	return (
		<div
			className="container"
			style={{
				position: "absolute",
				right: error ? 0 : undefined,
				left: error
					? inset
						? undefined
						: `calc(100% - var(--defaultBorderRadius)`
					: inset
                        ? "1rem"
                        : 0,
				width: "max-content",
				height: "max-content",
                minHeight: "1.125rem",
                boxSizing: 'border-box',
				backgroundColor: "var(--disturbing)",
				paddingLeft: inset
					? "1rem"
					: "calc(var(--defaultBorderRadius) + 1rem)",
				paddingRight: "1rem",
				borderRadius:
					"0 var(--defaultBorderRadius) var(--defaultBorderRadius) 0",
				zIndex: error ? (inset ? 3 : 1) : -1,
				transition: ["right", "left", "opacity"]
					.map((v) => `${v} 0.3s ease-in-out`)
					.join(", "),
				transitionDelay: error ? undefined : "0.1s",
				overflow: "hidden",
				opacity: error ? 1 : 0,
			}}
		>
			<span
				style={{ zIndex: 2, padding: "0.5rem 0rem" }}
			>
				{error}
			</span>
		</div>
	)
}

function dispatchErrorCleared(element: HTMLElement) {
	element.dispatchEvent(
		new Event("errorCleared", {
			bubbles: true,
		})
	)
}

function dispatchError(element: HTMLElement) {
	element.dispatchEvent(
		new Event("error", {
			bubbles: true,
		})
	)
}

export function TextInput({
	area,
	pathPrefix,
	path,
	icon,
	placeholder,
	onChange,
	dataRef,
	validate,
	insetError: inset,
}: {
	area: string
	pathPrefix?: string
	path: string
	insetError?: boolean
	icon: any
	placeholder: string
	dataRef: any
	validate?: (v: string) => string | undefined
	onChange?: (e: React.FormEvent<HTMLInputElement>) => void
}) {
	const [error, setError] = useState<string>()

	const ref = useRef<HTMLInputElement>(null)

	function onError(this: HTMLInputElement, e: ErrorEvent) {
		const error = e.error as ValueError
        if (e.error === undefined)
            return
		setError(error.message)
	}

	useEffect(() => {
		if (!ref.current) return
		ref.current.addEventListener("error", onError)

		return () => ref.current?.removeEventListener("error", onError)
	}, [ref])

	return (
		<div
			className="inputField"
			style={{
				gridArea: area,
				position: "relative",
			}}
		>
			<IconInput
				className={error ? "invalidInput hasError" : ""}
				style={{
					width: "100%",
					zIndex: error ? 2 : undefined,
				}}
				id={(pathPrefix ?? "") + path}
				icon={icon}
				inputRef={ref}
				placeholder={placeholder}
				defaultValue={getPropertyByPath(dataRef, path)}
				onChange={(e) => {
					const value = e.currentTarget.value

					const error =
						validate && value !== "" && value !== undefined
							? validate(value)
							: undefined
					if (error !== undefined) {
						dispatchError(e.currentTarget)
						setError(error)
						return
					} else {
                        e.currentTarget.parentElement?.classList.remove('hasError')
						dispatchErrorCleared(e.currentTarget)
						setError(undefined)
					}

					setPropertyByPath(dataRef, path, value)
					if (onChange) onChange(e)
				}}
			/>
			<InputError error={error} inset={inset} />
		</div>
	)
}

export const LargeTextInput = ({
	area,
	path,
	placeholder,
	dataRef,
}: {
	area: string
	path: string
	placeholder: string
	dataRef: any
}) => {
	const [error, setError] = useState<string>()
	const ref = useRef<HTMLTextAreaElement>(null)

	function onError(this: HTMLTextAreaElement, e: ErrorEvent) {
		const error = e.error as ValueError
		setError(error.message)
	}

	useEffect(() => {
		if (!ref.current) return
		ref.current.addEventListener("error", onError)

		return () => ref.current?.removeEventListener("error", onError)
	}, [ref])

	return (
		<div
			className="inputField"
			style={{
				gridArea: area,
				height: "100%",
				position: "relative",
			}}
		>
			<textarea
				id={path}
				ref={ref}
				placeholder={placeholder}
				className={`input ${error ? "invalidInput" : ""} inputField`}
				style={{
					gridArea: area,
					height: "100%",
					resize: "none",
					zIndex: error ? 2 : undefined,
				}}
				defaultValue={getPropertyByPath(dataRef, path)}
				onChange={(e) => {
					setError(undefined)
					e.currentTarget.value = e.currentTarget.value.replace(
						"\n",
						""
					)
					setPropertyByPath(dataRef, path, e.currentTarget.value)
				}}
			/>
			<InputError error={error} inset={false} />
		</div>
	)
}

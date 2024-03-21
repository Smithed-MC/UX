import { IconInput } from "components"
import { useState } from "react"

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

export function TextInput({
    area,
    path,
    icon,
    placeholder,
    onChange,
    dataRef,
    validate,
}: {
    area: string
    path: string
    icon: any
    placeholder: string
    dataRef: any
    validate?: (v: string) => string | undefined
    onChange?: (e: React.FormEvent<HTMLInputElement>) => void
}) {
    const [error, setError] = useState<string>()

    return (
        <div
            className="inputField"
            style={{
                gridArea: area,
                position: "relative",
            }}
        >
            <IconInput
                className={error ? "invalidInput" : ""}
                style={{ width: "100%", zIndex: error ? 2 : undefined }}
                id={path}
                icon={icon}
                placeholder={placeholder}
                defaultValue={getPropertyByPath(dataRef, path)}
                onChange={(e) => {
                    const value = e.currentTarget.value

                    const error =
                        validate && value !== "" && value !== undefined
                            ? validate(value)
                            : undefined
                    if (error !== undefined) {
                        setError(error)
                        return
                    } else {
                        setError(undefined)
                    }

                    setPropertyByPath(dataRef, path, value)
                    if (onChange) onChange(e)
                }}
            />

            <div
                className="container"
                style={{
                    position: "absolute",
                    right: error ? 0 : undefined,
                    left: error
                        ? "calc(100% - var(--defaultBorderRadius)"
                        : 0,
                    width: "max-content",
                    height: "100%",
                    backgroundColor: "var(--disturbing)",
                    paddingLeft: "calc(var(--defaultBorderRadius) + 1rem)",
                    paddingRight: "1rem",
                    borderRadius:
                        "0 var(--defaultBorderRadius) var(--defaultBorderRadius) 0",
                    zIndex: error ? 1 : -1,
                    transition: ["right", "left", "opacity"]
                        .map((v) => `${v} 0.3s ease-in-out`)
                        .join(", "),
                    transitionDelay: error ? undefined : "0.1s",
                    overflow: "hidden",
                    opacity: error ? 1 : 0,
                }}
            >
                <span style={{ zIndex: 2 }}>{error}</span>
            </div>
        </div>
    )
}

export const LargeTextInput = ({
    area,
    path,
    placeholder,
    dataRef
}: {
    area: string
    path: string
    placeholder: string
    dataRef: any
}) => (
    <textarea
        id={path}
        placeholder={placeholder}
        className="input inputField"
        style={{
            gridArea: area,
            height: "100%",
            resize: "none",
        }}
        defaultValue={getPropertyByPath(dataRef, path)}
        onChange={(e) => {
            e.currentTarget.value = e.currentTarget.value.replace("\n", "")
            setPropertyByPath(dataRef, path, e.currentTarget.value)
        }}
    />
)
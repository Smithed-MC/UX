import React, { RefObject } from "react"
import { ValueError } from "@sinclair/typebox/errors"
import { useEffect } from "react"

function instanceOfRef(
	object: any
): object is
	| React.RefObject<HTMLElement | null>
	| React.MutableRefObject<HTMLElement | undefined> {
	return object == null ? false : "current" in object
}

export function useErrorEventHandlers(
	ref:
		| React.RefObject<HTMLElement | null>
		| React.MutableRefObject<HTMLElement | undefined>
		| HTMLElement
		| null,
	callback: (hasError: boolean) => void
) {
	function onError() {
		callback(true)
	}

	function onErrorCleared() {
		const refElement = instanceOfRef(ref) ? ref?.current : ref
		if (refElement?.querySelector(".hasError")) return
		callback(false)
	}

	useEffect(() => {
		const refElement = instanceOfRef(ref) ? ref?.current : ref
		refElement?.addEventListener("error", onError)
		refElement?.addEventListener("errorCleared", onErrorCleared)

		return () => {
			refElement?.removeEventListener("error", onError)
			refElement?.removeEventListener("errorCleared", onErrorCleared)
		}
	}, [])

	return [onError, onErrorCleared]
}
export function sendErrorEvent(path: string, e: ValueError) {
	console.log(path)
	const elem = document.getElementById(path)

	elem?.dispatchEvent(
		new ErrorEvent("error", {
			error: e,
			bubbles: true,
		})
	)
}

import { useState, useEffect } from "react"
import { getAuth, User } from "firebase/auth"
import { useLocation, useRouteLoaderData } from "react-router-dom"
import * as queryString from "query-string"
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import { UserData } from "data-types"

import { AppDispatch, RootState, selectUserData } from "store"
import Cookies from "js-cookie"

export function useFirebaseUser() {
	const [user, setUser] = useState<User | null>(getAuth().currentUser)

	useEffect(() => {
		const unsubscribe = getAuth().onAuthStateChanged((user) =>
			setUser(user)
		)

		return () => {
			unsubscribe()
		}
	}, [])

	return user
}

export function useSmithedUser(): UserData | undefined {
	const user = (import.meta as any).env.SSR
		? (useRouteLoaderData("root") as any).user
		: useAppSelector(selectUserData)

	return user && Object.keys(user).length > 0 ? user : undefined
}

interface SiteTheme {
	type: "custom" | "light" | "dark"
	variables: Record<string, string>
}

export const DARK_THEME: SiteTheme = {
	type: "dark",
	variables: {
		bold: "#000000",
		background: "#121213",
		section: "#1d1f21",
		highlight: "#2e2e31",
		border: "#4b4b4b",
		foreground: "#fff8f0",
		accent: "#1b48c4",
		accent2: "#23a3ff",
		warning: "#e8aa03",
		disturbing: "#c41b48",
		success: "#1bc443",
		secondary: "#c41b9c",
		bundle: "#971bc4",
	},
}

export const LIGHT_THEME: SiteTheme = {
	type: "light",
	variables: {
		...DARK_THEME.variables,
		foreground: "#1f1f37",
		section: "#d7d9e5",
		background: "#fafafa",
		bold: "#c4c5cf",
		highlight: "#dfe0e7",
		border: "#a8a9b8",
		disturbing: "#e60f48",
		warning: "#ff7b00",
		accent: "#5176db"
	},
}

export interface SiteSettings {
	theme: SiteTheme
}

const defaultSettings: SiteSettings = {
	theme: DARK_THEME
}

function applySettings(settings: SiteSettings) {
	Cookies.set("smithedSiteSettings", JSON.stringify(settings))

	for (const variable in settings.theme.variables) {
		document.body.style.setProperty(
			"--" + variable,
			settings.theme.variables[variable],
			"important"
		)
	}
}

export function useSiteSettings(): [
	SiteSettings,
	(settings: SiteSettings) => void,
] {
	if ((import.meta as any).env.SSR)
		return [
			(useRouteLoaderData("root") as any).siteSettings ?? defaultSettings,
			applySettings,
		]

	const settings = Cookies.get("smithedSiteSettings")

	return [
		settings !== undefined ? JSON.parse(settings) : defaultSettings,
		applySettings,
	]
}

export function useQueryParams() {
	const location = useLocation()
	return queryString.parse(location.search)
}

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

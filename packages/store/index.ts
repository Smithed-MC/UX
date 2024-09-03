import * as toolkitRaw from "@reduxjs/toolkit"
const { createSlice, configureStore } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw
import { MinecraftVersion, PackBundle, PackDependency, UserData } from "data-types"
import Cookies from "js-cookie"

function getDefault<T>(key: string, defaultValue: T) {
	if ((import.meta as any).env.SSR) return defaultValue

	const stored = localStorage.getItem("smithed.dev:" + key)

	if (stored != null)
		return typeof defaultValue !== "string"
			? (JSON.parse(stored) as T)
			: (stored as T)

	return defaultValue
}

function getCookieDefault<T>(key: string, defaultValue: T) {
	if ((import.meta as any).env.SSR) return defaultValue

	const stored = Cookies.get(key)

	if (stored != null)
		return typeof defaultValue !== "string"
			? (JSON.parse(stored) as T)
			: (stored as T)

	return defaultValue
}

function setStorage(key: string, value: any, child: () => void) {
	child()
	localStorage.setItem(
		"smithed.dev:" + key,
		typeof value !== "string" ? JSON.stringify(value) : value
	)
}

export type CurrentBundle = {
	packs: (PackDependency & {name: string})[],
	gameVersion: MinecraftVersion
}

const initialState = {
	userData: getDefault<UserData | {}>("userData", {}),
	currentBundle: getCookieDefault<CurrentBundle | null>("currentBundle", null)
}

const userSlice = createSlice({
	name: "user",
	initialState,
	reducers: {
		setUserData: (state, action) => {
			if (Object.keys(action.payload).length > 1) {
				Cookies.set(
					"smithedUser",
					JSON.stringify({
						uid: action.payload.uid,
						displayName: action.payload.displayName,
						role: action.payload.role ?? "member",
					})
				)
			} else Cookies.remove("smithedUser")

			setStorage(
				"userData",
				action.payload,
				() => (state.userData = action.payload)
			)
		},
		setCurrentBundle: (state, action) => {
			if (action.payload == null)
				Cookies.remove("currentBundle")
			else
				Cookies.set("currentBundle", JSON.stringify(action.payload))

			state.currentBundle = action.payload
		}
	},
})

export const store = configureStore({
	reducer: userSlice.reducer,
})

export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

export const { setUserData, setCurrentBundle } =
	userSlice.actions

export const selectUserData = (state: RootState) => state.userData
export const selectCurrentBundle = (state: RootState) => state.currentBundle
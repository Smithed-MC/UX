import { Link, NavBar, RootError } from "components"
import { useContext, useEffect, useState } from "react"
import {
	createBrowserRouter,
	Outlet,
	redirect,
	RouteObject,
	RouterProvider,
	ScrollRestoration,
	useLocation,
} from "react-router-dom"
import { initializeApp } from "firebase/app"
import { connectAuthEmulator, User as FirebaseUser } from "firebase/auth"

import "./style.css"

import { getAuth } from "firebase/auth"

import { Provider } from "react-redux"


import {
	selectSelectedBundle,
	setSelectedBundle,
	setUserData,
	setUsersBundles,
	store,
} from "store"
import { useAppDispatch, useAppSelector, useSiteSettings } from "hooks"
import { PackBundle, UserData } from "data-types"
import { Helmet } from "react-helmet"
import { ClientContext, defaultContext, IClientContext } from "./context.js"

import { Cross, Logo } from "components/svg.js"

import Cookies from "js-cookie"


import EditorError from "./pages/editors/error.js"
import React from "react"

initializeApp({
	databaseURL: "https://mc-smithed-default-rtdb.firebaseio.com",
	apiKey: "AIzaSyDX-vLCBhO8StKAxnpvQ2EW8lz3kzYn4Qk",
	authDomain: "mc-smithed.firebaseapp.com",
	projectId: "mc-smithed",
	storageBucket: "mc-smithed.appspot.com",
	messagingSenderId: "574184244682",
	appId: "1:574184244682:web:498d168c09b39e4f0d7b33",
	measurementId: "G-40SRKC35Z0",
})

if (import.meta.env.VITE_FIREBASE_EMULATOR) {
	connectAuthEmulator(getAuth(), "http://127.0.0.1:9099", { disableWarnings: false })	
}

export function ClientApplet() {
	const dispatch = useAppDispatch()
	const selectedBundle = useAppSelector(selectSelectedBundle)
	const [hideWarning, setHideWarning] = useState(false)
	const location = useLocation()
	const context = useContext(ClientContext)
	const [siteSettings, applySettings] = useSiteSettings()

	if (!import.meta.env.SSR)
		applySettings(siteSettings)

	function resetBundleData() {
		dispatch(setUsersBundles([]))
		dispatch(setSelectedBundle(""))
	}

	function resetUserData() {
		dispatch(setUserData({}))
	}

	async function loadBundles(user: FirebaseUser | null) {
		if (user == null) {
			return resetBundleData()
		}

		const resp = await fetch(
			import.meta.env.VITE_API_SERVER + `/users/${user.uid}/bundles`
		)
		if (!resp.ok) return resetBundleData()

		const bundleIds: string[] = await resp.json()

		if (bundleIds.find((b) => b === selectedBundle) === undefined)
			dispatch(setSelectedBundle(""))

		const getData = async (id: string) => {
			const resp = await fetch(
				import.meta.env.VITE_API_SERVER + `/bundles/${id}?token=` + await user.getIdToken()
			)

			if (!resp.ok) return undefined

			return (await resp.json()) as PackBundle
		}
		const bundles = (
			await Promise.all(bundleIds.map((id) => getData(id)))
		).filter((b) => b !== undefined)
		dispatch(setUsersBundles(bundles))
	}

	async function loadUserData(user: FirebaseUser | null) {
		if (user == null) return resetUserData()

		const resp = await fetch(
			import.meta.env.VITE_API_SERVER + `/users/${user.uid}`
		)
		if (!resp.ok) return resetUserData()

		const userData: UserData = await resp.json()

		const cookieUser = {
			uid: userData.uid,
			displayName: userData.displayName,
			role: userData.role,
		}

		dispatch(setUserData(userData))
	}

	useEffect(() => {
		if (import.meta.env.SSR) return

		setHideWarning(!!sessionStorage.getItem("hereBeDragons"))

		const unsub = getAuth().onAuthStateChanged(async (user) => {
			if (user) {
				Cookies.set("smithedToken", await user?.getIdToken(true), {
					sameSite: "strict",
				})
				loadBundles(user)
				loadUserData(user)
			} else {
				Cookies.remove("smithedToken")
				resetBundleData()
				resetUserData()
			}
		})

		return () => {
			unsub()
		}
	}, [])

	return (
		<div
			className="container"
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				height: "100%",
				boxSizing: "border-box",
				justifyContent: "safe start",
				alignItems: "center",
				width: "100%",
				overflowY: "auto",
				overflowX: "hidden",
				scrollbarGutter: "stable",
			}}
		>
			<ScrollRestoration />
			<Helmet>
				<title>Smithed</title>
				<meta
					name="description"
					content="Datapacks: the community, the tooling; all bundled into the perfect package."
				/>
				<meta name="og:image" content="/icon.png" />
			</Helmet>
			{import.meta.env.VITE_NIGHTLY && !hideWarning && (
				<div
					id="nightlyWarningBar"
					style={{
						width: "100%",
						borderBottom: "0.125rem solid var(--warning)",
						backgroundColor:
							"color-mix(in srgb, transparent 80%, var(--warning) 20%)",
						padding: "0.5rem 1rem",
						boxSizing: "border-box",
						display: "flex",
						flexDirection: "row",
						position: "relative",
					}}
				>
					<span>
						{"You are currently on the unstable branch. "}
						<Link
							to={
								"https://smithed.net" +
								location.pathname +
								location.search
							}
						>
							Click here
						</Link>
						{" to go to safety."}
					</span>
					<Cross
						style={{
							alignSelf: "center",
							position: "absolute",
							right: "1rem",
						}}
						onClick={() => {
							sessionStorage.setItem("hereBeDragons", "true")
							const warningBar =
								document.getElementById("nightlyWarningBar")
							if (warningBar == null) return setHideWarning(true)

							warningBar.animate(
								[
									{ marginTop: "0" },
									{
										marginTop: `-${warningBar.clientHeight}px`,
									},
								],
								{ easing: "ease-in-out", duration: 200 }
							)

							setTimeout(() => setHideWarning(true), 199)
						}}
					/>
				</div>
			)}
			<div
				className="container outlet"
				style={{
					width: "min(70rem, 100%)",
					gap: "4rem",
					boxSizing: "border-box",
					flexGrow: 1,
					justifyContent: "start",
					paddingBottom: "1rem",
				}}
			>
				<NavBar tabs={context.navbarTabs} logoUrl={context.logoUrl} onSignout={() => resetUserData()} />
				<Outlet />
			</div>
			{context.enableFooter ? <Footer /> : <br />}
		</div>
	)
}

function Footer() {
	return (
		<div
			className="container"
			style={{
				width: "100.5vw",
				backgroundColor: "var(--bold)",
				borderTop: "0.125rem solid var(--border)",
			}}
		>
			<div
				className="footerContainer"
				style={{ width: "min(70rem, 100vw)", paddingLeft: 16 }}
			>
				<div className="container footerLargeGroup">
					<div
						className="container"
						style={{
							flexDirection: "row",
							fontWeight: 600,
							fontSize: "3rem",
							justifyContent: "center",
							gap: 10,
						}}
					>
						<Logo style={{ height: "4rem", width: "4rem" }} />
						Smithed
					</div>

					<p style={{ color: "var(--border)" }}>
						<b>Copyright © 2024 Smithed</b>
						<br />
						Not an official Minecraft product. Not approved by or
						associated with Mojang Studios
					</p>
				</div>
				<div className="container footerSmallGroup">
					<b style={{ fontSize: "1.5rem" }}>SOCIAL</b>
					<Link
						className="compactButton"
						to="https://smithed.dev/discord"
					>
						Discord
					</Link>
					<Link
						className="compactButton"
						to="https://github.com/Smithed-MC"
					>
						Github
					</Link>
				</div>
				<div className="container footerSmallGroup">
					<b style={{ fontSize: "1.5rem" }}>POLICIES</b>
					<a className="compactButton">Terms of service</a>
					<a className="compactButton">Privacy policy</a>
					<a className="compactButton">Guidelines</a>
				</div>
			</div>
		</div>
	)
}

import Home from "./pages/home.js"

import Settings from "./pages/settings.js"
import loadSettingsData from "./pages/settings.loader"

import Account from "./pages/account.js"

import PackEditor from "./pages/packs/id/edit.js"
import { loadPackEdit } from "./pages/packs/id/edit.loader.js"

import User from "./pages/users/id/index.js"

import PackPage from "./pages/packs/id/index.js"
import loadPackData from "./pages/packs/id/index.loader.js"

import PackBrowsePage from "./pages/packs/index.js"
import BundlePage from "./pages/bundles/id/index.js"

import BundleEditor from "./pages/bundles/id/edit.js"
import { loadBundleEdit } from "./pages/bundles/id/edit.loader.js"

import ArticlePage from "./pages/article.js"
import UserBrowsePage from "./pages/users/index.js"
import loadUserBrowseData from "./pages/users/index.loader.js"

import {
	loadArticleData,
	loadPackBrowseData,
	loadHomePageData,
	loadRootData,
	loadUserPageData,
} from "./loaders.js"
import SummitPage from "./pages/summit"

// Don't reorder these please
export const subRoutes: RouteObject[] = [
	{
		path: "",
		element: <Home />,
		loader: loadHomePageData,
	},
	{
		path: "settings",
		element: <Settings />,
		loader: loadSettingsData
	},
	{
		path: "browse",
		element: <div></div>,
		loader: async () => {
			return redirect("/packs")
		},
	},
	{
		path: "account",
		element: <Account />,
	},
	{
		path: "packs/:id/edit",
		element: <PackEditor />,
		loader: loadPackEdit,
		errorElement: <EditorError />,
	},
	{
		path: ":owner",
		element: <User />,
		loader: loadUserPageData,
	},
	{
		path: "packs/:id",
		element: <PackPage />,
		loader: loadPackData,
	},
	{
		path: "bundles/:bundleId",
		element: <BundlePage />,
	},
	{
		path: "bundles/:id/edit",
		element: <BundleEditor />,
		errorElement: <EditorError />,
		loader: loadBundleEdit,
	},
	{
		path: "articles/:article",
		element: <ArticlePage />,
		loader: loadArticleData,
	},
	{
		path: "articles",
		element: <ArticlePage />,
		loader: loadArticleData,
	},
	{
		path: "packs",
		element: <PackBrowsePage />,
		loader: loadPackBrowseData,
	},
	{
		path: "users",
		element: <UserBrowsePage />,
		loader: loadUserBrowseData
	},
	{
		path: "summit",
		element: <SummitPage />
	},
	{
		path: "summit/apply",
		element: <></>,
		loader: () => redirect("https://forms.gle/sCKjYxUWKngkXxpE9")
	}
]

export const routes = [
	{
		path: "/",
		children: subRoutes,
		loader: loadRootData,
		id: "root",
		element: (
			<Provider store={store}>
				<ClientApplet />
			</Provider>
		),
		errorElement: <RootError />,
	},
]

export default function ClientParent({ context }: { context: IClientContext }) {
	const router = createBrowserRouter(routes)
	return (
		<ClientContext.Provider value={context ?? defaultContext}>
			<RouterProvider router={router} />
		</ClientContext.Provider>
	)
}

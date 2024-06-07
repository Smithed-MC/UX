import {
	browserLocalPersistence,
	browserSessionPersistence,
	getAuth,
	getRedirectResult,
	GithubAuthProvider,
	indexedDBLocalPersistence,
	setPersistence,
	signInWithEmailAndPassword,
	signInWithPopup,
	signInWithRedirect,
	UserCredential,
} from "firebase/auth"
import React, { useEffect, useState } from "react"
import "./login.css"
import { FirebaseError } from "firebase/app"
import { IconInput, IconTextButton, Link, Spinner } from "components"
import { Right, Key, At, Github, Account, Cross, Check } from "components/svg"
import { useNavigate, useNavigation } from "react-router-dom"
import Cookies from "js-cookie"
import { HTTPResponses, UserData } from "data-types"
import { setUserData } from "store"
import { useDispatch } from "react-redux"
import { useAppDispatch } from "hooks"

const githubProvider = new GithubAuthProvider()
githubProvider.setCustomParameters({
	allow_signup: "false",
})

function DisplayNamePopup({
	onClose,
}: {
	onClose: (success: boolean) => void
}) {
	const [displayNameError, setDisplayNameError] = useState<string>()

	return (
		<div
			className="container"
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				backgroundColor: "rgba(0,0,0,0.5)",
				width: "100%",
				height: "100%",
				zIndex: 1000,
			}}
		>
			<div
				className="container"
				style={{
					padding: "1rem",
					borderRadius: "calc(var(--defaultBorderRadius))",
					border: "0.125rem solid var(--border)",
					backgroundColor: "var(--background)",
					gap: "1rem",
				}}
			>
				This account has not been registered.
				<br />
				Please choose a display name
				<IconInput
					id="display_name_input"
					icon={Account}
					placeholder="Display Name"
					onChange={() => setDisplayNameError(undefined)}
				/>
				{displayNameError && (
					<span
						style={{
							color: "var(--disturbing)",
							marginTop: "-0.5rem",
						}}
					>
						{displayNameError}
					</span>
				)}
				<div
					className="container"
					style={{ flexDirection: "row", gap: "0.5rem" }}
				>
					<IconTextButton
						className="invalidButtonLike"
						icon={Cross}
						text="Cancel"
						onClick={() => {
							getAuth().signOut()
							onClose(false)
						}}
					/>
					<IconTextButton
						className="successButtonLike"
						icon={Check}
						text="Save"
						onClick={async () => {
							const displayName = (
								document.getElementById(
									"display_name_input"
								)! as HTMLInputElement
							).value
							if (displayName.length < 3) return

							const user = getAuth().currentUser
							if (user == null) return

							const resp = await fetch(
								import.meta.env.VITE_API_SERVER +
									`/users/${user.uid}/setup?displayName=${displayName}&token=${await user.getIdToken()}`
							)

							if (resp.ok) return onClose(true)

							if (resp.status === HTTPResponses.CONFLICT)
								return setDisplayNameError(
									"Display name is taken!"
								)
						}}
					/>
				</div>
			</div>
		</div>
	)
}

export default function Login({
	clickSignUp,
	clickHelp,
}: {
	clickSignUp: () => void
	clickHelp: () => void
}) {
	const [email, setEmail] = useState("")
	const [emailError, setEmailError] = useState("")
	const [passwordError, setPasswordError] = useState("")
	const [password, setPassword] = useState("")
	const [staySignedIn, setStaySignedIn] = useState(false)

	const [loggingIn, setLoggingIn] = useState(false)

	const [showDisplayNamePrompt, setShowDisplayNamePrompt] = useState(false)

	const navigate = useNavigate()
	const dispatch = useAppDispatch()

	useEffect(() => {
		function safeSignOut() {
			if (showDisplayNamePrompt) getAuth().signOut()
		}

		window.addEventListener("beforeunload", safeSignOut)
		return () => window.removeEventListener("beforeunload", safeSignOut)
	}, [])

	async function doneLoggingIn(uid: string) {
		const resp = await fetch(
			import.meta.env.VITE_API_SERVER + `/users/${uid}`
		)
		if (!resp.ok) return navigate("/" + uid)

		const userData: UserData = await resp.json()

		dispatch(setUserData(userData))

		if (window.history.length > 1) window.history.back()
		else navigate("/" + uid)
	}

	// console.log(getAuth().currentUser)
	const login = async () => {
		if (email === "" || password === "") return
		setLoggingIn(true)
		try {
			await setPersistence(
				getAuth(),
				staySignedIn
					? browserLocalPersistence
					: browserSessionPersistence
			)
			const cred = await signInWithEmailAndPassword(
				getAuth(),
				email,
				password
			)

			doneLoggingIn(cred.user.uid)
		} catch (e: any) {
			setLoggingIn(false)
			const error = e as FirebaseError
			// console.log(error.code)

			switch (error.code) {
				case "auth/invalid-email": {
					setEmailError("Invalid Email")
					break
				}
				case "auth/user-not-found": {
					setEmailError("No user with that email")
					break
				}
				case "auth/wrong-password": {
					setPasswordError("Invalid Password")
					break
				}
			}
		}
	}

	return (
		<div className="container" style={{ gap: "1rem" }}>
			<IconInput
				type="email"
				className={emailError != "" ? "invalidInput" : ""}
				placeholder="Email"
				icon={At}
				onChange={(e) => {
					setEmail(e.currentTarget.value)
					setEmailError("")
				}}
				value={email}
				title={emailError}
			/>
			<IconInput
				type="password"
				className={passwordError != "" ? "invalidInput" : ""}
				placeholder="Password"
				icon={Key}
				onChange={(e) => {
					setPassword(e.currentTarget.value)
					setPasswordError("")
				}}
				value={password}
				onKeyDown={(e) => {
					if (e.key === "Enter") login()
				}}
				title={passwordError}
			/>
			<div
				className="container"
				style={{
					flexDirection: "row",
					gap: "0.5rem",
					width: "100%",
					justifyContent: "start",
				}}
			>
				<input
					type="checkbox"
					style={{
						width: "1rem",
						height: "1rem",
						borderRadius: "var(--defaultBorderRadius)",
					}}
					onChange={(e) => {
						setStaySignedIn(e.currentTarget.checked)
					}}
				/>
				<span style={{ opacity: 0.3 }}>Stay signed in?</span>
			</div>
			<div
				className="container"
				style={{ flexDirection: "row", gap: "1.25rem" }}
			>
				<Link
					to="/discord"
					className="compactButton"
					style={{ opacity: 0.3 }}
					onClick={clickHelp}
				>
					Need help?
				</Link>
				<div
					style={{
						width: "0.25rem",
						height: "0.25rem",
						backgroundColor: "var(--border)",
						borderRadius: "50%",
						margin: "0rem -0.75rem",
					}}
				/>
				<a
					className="compactButton"
					style={{ opacity: 0.3 }}
					onClick={clickSignUp}
				>
					Sign up
				</a>
				<IconTextButton
					className="accentedButtonLike"
					text="Login"
					iconElement={
						loggingIn ? (
							<Spinner
								style={{
									width: "1rem",
									height: "1rem",
									border: "2px solid var(--foreground)",
									borderTop: "2px solid var(--accent)",
								}}
							/>
						) : (
							<Right />
						)
					}
					reverse={true}
					onClick={login}
					disabled={email === "" || password === ""}
				/>
			</div>
			<IconTextButton
				icon={Github}
				text="Github Sign In"
				onClick={async () => {
					try {
						const cred = await signInWithPopup(
							getAuth(),
							githubProvider
						)
						if (!cred) {
							alert("Failed to get credientials")
							return
						}

						const userResp = await fetch(
							import.meta.env.VITE_API_SERVER +
								`/users/${cred.user.uid}`
						)

						if (
							!userResp.ok &&
							userResp.status !== HTTPResponses.NOT_FOUND
						) {
							alert(
								"Failed to fetch user data!\n" +
									(await userResp.json()).message
							)
							return
						}

						if (
							!userResp.ok &&
							userResp.status === HTTPResponses.NOT_FOUND
						) {
							setShowDisplayNamePrompt(true)
							return
						}

						doneLoggingIn(cred.user.uid)
					} catch (e) {
						alert(e)
					}
				}}
			/>
			{showDisplayNamePrompt && (
				<DisplayNamePopup
					onClose={(success) => {
						setShowDisplayNamePrompt(false)
						if (success) doneLoggingIn(getAuth().currentUser!.uid)
					}}
				/>
			)}
		</div>
	)
}

import {
	createUserWithEmailAndPassword,
	getAuth,
	GithubAuthProvider,
	signInWithEmailAndPassword,
	signInWithPopup,
} from "firebase/auth"
import React, { useState } from "react"
import "./login.css"
import { FirebaseError } from "firebase/app"
import { IconInput, IconTextButton, Link } from "components"
import { Account, At, Github, Key, Right } from "components/svg"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { useAppDispatch } from "hooks"
import { setUserData } from "store"
import { HTTPResponses, UserData } from "data-types"
import { DisplayNamePopup } from "./login"

const githubProvider = new GithubAuthProvider()
githubProvider.setCustomParameters({
	allow_signup: "false",
})

export default function SignUp({ clickLogin }: { clickLogin: () => void }) {
	const [email, setEmail] = useState("")
	const [displayName, setDisplayName] = useState("")

	const [displayNameError, setDisplayNameError] = useState("")
	const [emailError, setEmailError] = useState("")
	const [passwordError, setPasswordError] = useState("")
	const [confirmPasswordError, setConfirmPasswordError] = useState("")

	const [password, setPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")

	const [showDisplayNamePrompt, setShowDisplayNamePrompt] = useState(false)

	const dispatch = useAppDispatch()

	const navigate = useNavigate()
	// console.log(getAuth().currentUser)

	const signup = async () => {
		if (email === "" || password === "" || displayName === "") return

		if (password !== confirmPassword)
			return setConfirmPasswordError("Passwords do not match!")

		try {
			const userDataResp = await fetch(
				import.meta.env.VITE_API_SERVER + `/users/${displayName}`
			)
			console.log(userDataResp)
			if (userDataResp.ok) return setDisplayNameError("Username taken!")

			const cred = await createUserWithEmailAndPassword(
				getAuth(),
				email,
				password
			)
			const token = await cred.user.getIdToken()
			const uid = cred.user.uid

			const resp = await fetch(
				import.meta.env.VITE_API_SERVER +
					`/users/${uid}/setup?token=${token}&displayName=${displayName}`
			)

			if (!resp.ok) {
				const error = await resp.json()
				return alert(error.message)
			}

			dispatch(
				setUserData({
					displayName: displayName,
				})
			)
			navigate("/" + uid)
		} catch (e: any) {
			const error = e as FirebaseError
			// console.log(error.code)

			switch (error.code) {
				case "auth/invalid-email": {
					setEmailError("Invalid Email")
					break
				}
				case "auth/weak-password": {
					setPasswordError("Weak Password")
					break
				}
				case "auth/email-already-in-use": {
					setEmailError("Email already in use!")
					break
				}
			}
		}
	}

	const signInToGithub = async () => {
		try {
			const cred = await signInWithPopup(getAuth(), githubProvider)
			if (!cred) {
				alert("Failed to get credientials")
				return
			}

			const userResp = await fetch(
				import.meta.env.VITE_API_SERVER + `/users/${cred.user.uid}`
			)

			if (!userResp.ok && userResp.status !== HTTPResponses.NOT_FOUND) {
				alert(
					"Failed to fetch user data!\n" +
						(await userResp.json()).message
				)
				return
			}

			if (!userResp.ok && userResp.status === HTTPResponses.NOT_FOUND) {
				setShowDisplayNamePrompt(true)
				return
			}

			doneLoggingIn(cred.user.uid)
		} catch (e) {
			alert(e)
		}
	}
	
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
	
	return (
		<div className="container" style={{ gap: "1rem", width: "100%" }}>
			<IconInput
				icon={Account}
				title={displayNameError}
				className={displayNameError != "" ? "invalidInput" : ""}
				style={{ width: "100%" }}
				type="text"
				id=""
				placeholder="Username"
				maxLength={16}
				onChange={(e) => {
					setDisplayName(e.currentTarget.value)
					setDisplayNameError("")
				}}
				value={displayName}
			/>
			<IconInput
				icon={At}
				title={emailError}
				className={emailError != "" ? "invalidInput" : ""}
				style={{ width: "100%" }}
				type="email"
				id=""
				placeholder="Email"
				onChange={(e) => {
					setEmail(e.currentTarget.value)
					setEmailError("")
				}}
				value={email}
			/>
			<IconInput
				icon={Key}
				title={passwordError}
				className={passwordError != "" ? "invalidInput" : ""}
				style={{ width: "100%" }}
				type="password"
				placeholder="Password"
				onChange={(e) => {
					setPassword(e.currentTarget.value)
					setPasswordError("")
				}}
				value={password}
			/>
			<IconInput
				icon={Key}
				title={confirmPasswordError}
				className={confirmPasswordError != "" ? "invalidInput" : ""}
				style={{ width: "100%" }}
				type="password"
				placeholder="Confirm Password"
				onChange={(e) => {
					setConfirmPassword(e.currentTarget.value)
					setConfirmPasswordError("")
				}}
				value={confirmPassword}
				onKeyDown={(e) => {
					if (e.key === "Enter") signup()
				}}
			/>
			<div
				className="container"
				style={{ gap: "1rem", flexDirection: "row", width: "100%" }}
			>
				<IconTextButton
					style={{ width: "50%" }}
					text="Github"
					icon={Github}
					onClick={signInToGithub}
				/>
				<IconTextButton
					className="accentedButtonLike"
					style={{ width: "50%" }}
					text="Sign Up"
					icon={Right}
					reverse={true}
					onClick={signup}
					disabled={
						email === "" ||
						password === "" ||
						displayName === "" ||
						confirmPassword === ""
					}
				/>
			</div>
			<div
				className="container"
				style={{ flexDirection: "row", gap: "1.25rem" }}
			>
				<Link
					className="compactButton"
					style={{ opacity: 0.5 }}
					to="/discord"
				>
					Need help
				</Link>
				<div
					style={{
						width: "0.25rem",
						height: "0.25rem",
						backgroundColor: "var(--foreground)",
						borderRadius: "50%",
						margin: "0rem -0.75rem",
						opacity: 0.5,
					}}
				/>
				<a
					className="compactButton"
					style={{ opacity: 0.5 }}
					onClick={clickLogin}
				>
					Login
				</a>
			</div>
			{showDisplayNamePrompt && (
				<DisplayNamePopup
					onClose={(success) => {
						setShowDisplayNamePrompt(false)
						if (success) doneLoggingIn(getAuth().currentUser!.uid)
					}}
				/>
			)}{" "}
		</div>
	)
}

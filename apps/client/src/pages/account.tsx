import React, { useEffect, useState } from "react"
import { getAuth, User } from "firebase/auth"
import Login from "../widget/login"
import { useNavigate } from "react-router-dom"
import { useFirebaseUser } from "hooks"
import SignUp from "../widget/signup"

import logo from "../assets/logo.png"
import ResetPassword from "../widget/resetPassword"
import { ColoredLogo, Logo } from "components/svg"

export default function Account() {
	const user = useFirebaseUser()
	const navigate = useNavigate()
	const [tab, setTab] = useState<"login" | "signup" | "reset">("login")

	// useEffect(() => {
	//     if(user != null) {
	//         navigate('/' + user.uid)
	//     }
	// }, [user])

	return (
		<div
			className="container"
			style={{
				width: "100%",
				flexGrow: 1,
				height: "100%",
				boxSizing: "border-box",
				gap: "4rem"
			}}
		>
			<span style={{fontSize: "2rem", fontWeight: 600}}>
				Welcome back!
			</span>
			<div
				className="container"
				style={{
					backgroundColor: "var(--backgroundAccent)",
					padding: "1rem",
					borderRadius: "var(--defaultBorderRadius)",
					gap: "4rem",
					justifyContent: "start",
					flexDirection: "row",
					width: "100%",
					maxWidth: "42rem"
				}}
			>
				<Logo
					style={{
						width: "12rem",
						height: "12rem",
						flexShrink: 0,
					}}
				/>
				<div
					className="container"
					style={{ justifyContent: "center", height: "100%", width: "100%" }}
				>
					{tab === "login" && (
						<Login
							clickSignUp={() => setTab("signup")}
							clickHelp={() => setTab("reset")}
						/>
					)}
					{tab === "signup" && (
						<SignUp clickLogin={() => setTab("login")} />
					)}
					{tab === "reset" && (
						<ResetPassword clickBack={() => setTab("login")} />
					)}
				</div>
			</div>
		</div>
	)

	return <div></div>
}

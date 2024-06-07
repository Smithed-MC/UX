import React, { useEffect, useRef, useState } from "react"
import "./Smithie.css"

import normalImage from "./../assets/smithie/normal.png"
import awwwImage from "./../assets/smithie/awww.png"
import angryImage from "./../assets/smithie/angry.webp"
import surprisedImage from "./../assets/smithie/surprised.webp"
import sadImage from "./../assets/smithie/sad.webp"
import nerdImage from "./../assets/smithie/nerd.png"
import Cookies from "js-cookie"

type Message = {
	text: string
	expression?: string
	choices?: {
		text: string
		nextMessage: Message | null
	}[]
	autoChange?: {
		delay: number
		nextMessage: Message | null
	}
}

const startingMessage: Message = {
	text: "Hi! I'm Smithie! Your new best friend",
	autoChange: {
		delay: 1000,
		nextMessage: {
			text: "How are you doing?",
			choices: [
				{
					text: "Good :)",
					nextMessage: {
						text: "That's great! I'll be sitting here if you need me!",
						expression: awwwImage,
						autoChange: {
							nextMessage: null,
							delay: 3000,
						},
					},
				},
				{
					text: "Bad :(",
					nextMessage: {
						text: "Aww, well I hope I can make it better!",
						expression: sadImage,
						autoChange: {
							nextMessage: null,
							delay: 3000,
						},
					},
				},
			],
		},
	},
}
function sayRandomPackRelatedMessage(): Message | null {
	const rand = Math.random()

	if (rand >= 0.9) {
		return {
			text: "I bet that pack is pretty cool",
			autoChange: { delay: 1500, nextMessage: null },
		}
	} else if (rand >= 0.85) {
		return {
			text: "Hmmm, I haven't tried that one yet",
			expression: awwwImage,
			autoChange: { delay: 1500, nextMessage: null },
		}
	} else if (rand >= 0.8) {
		return {
			text: "I use this one all the time!",
			expression: awwwImage,
			autoChange: { delay: 1500, nextMessage: null },
		}
	} else if (rand >= 0.75) {
		return {
			text: "WOAH, this one must be new",
			expression: surprisedImage,
			autoChange: { delay: 1500, nextMessage: null },
		}
	} else {
		return null
	}
}
function sayRandomTouchMessage(): Message | null {
	const rand = Math.random()

	if (rand >= 0.75) {
		return {
			text: "Getting awfully close there",
			expression: angryImage,
			autoChange: { delay: 1500, nextMessage: null },
		}
	} else if (rand >= 0.5) {
		return {
			text: "AH, didn't see you",
			expression: surprisedImage,
			autoChange: { delay: 1500, nextMessage: null },
		}
	} else {
		return null
	}
}

function randomEffect(
	smithieRef: React.RefObject<HTMLImageElement>,
	setMessage: (m: Message | null) => void
) {
	if (Math.random() > 0.5) return

	const rand = Math.random()
	console.log(rand)
	const smithie = smithieRef.current!

	if (rand >= 0.9) {
		smithie.style.setProperty(
			"animation",
			"smithieZoomies 1s ease-in-out 5"
		)
		setTimeout(() => {
			smithie.style.setProperty("animation", null)
			setMessage({
				text: "Sorry! I had to get some energy out",
				autoChange: { nextMessage: null, delay: 1500 },
			})
		}, 5000)
	} else if (rand >= 0.8) {
		smithie.style.setProperty("position", "fixed")
		smithie.style.setProperty("right", `${Math.random() * 100}vw`)
		smithie.style.setProperty("bottom", `${Math.random() * 100}vh`)
		setTimeout(() => {
			smithie.style.setProperty("position", "")
			smithie.style.setProperty("right", ``)
			smithie.style.setProperty("bottom", ``)
			setMessage({
				text: "That was pretty cool",
				autoChange: { nextMessage: null, delay: 1500 },
                expression: surprisedImage
			})
		}, 1000)
	} else if (rand >= 0.7) {
		setMessage({
			text: "I yearn for a corporeal form!",
			autoChange: { nextMessage: null, delay: 1500 },
            expression: awwwImage
		})
	} else if (rand >= 0.6) {
		setMessage({
			text: "Existence is ultimately meaningless",
			autoChange: {
				nextMessage: {
					text: "But smithed is alright i guess",
					autoChange: { nextMessage: null, delay: 1500 },
				},
				delay: 1500,
			},
		})
	} else if (rand >= 0.5) {
		setMessage({
			text: "Did you know Smithed is FOSS? Including me",
			expression: nerdImage,
			autoChange: { nextMessage: null, delay: 1500 },
		})
	} else if (rand >= 0.4) {
		setMessage({
			text: "I was created by Monkeyhue and Ragno, blame them",
			expression: angryImage,
			autoChange: { nextMessage: null, delay: 1500 },
		})
	} else {
	}
}

export default function Smithie() {
	const [message, setMessage] = useState<Message | null>(null)
	const smithieRef = useRef<HTMLImageElement>(null)

	useEffect(() => {
		if (message?.autoChange)
			setTimeout(
				() => setMessage(message.autoChange!.nextMessage),
				message.autoChange.delay
			)
	}, [message])

	useEffect(() => {
        if (!Cookies.get('smithieFirstTime')) {
            setMessage(startingMessage)
            Cookies.set('smithieFirstTime', 'true')
        }
        
		const interval = setInterval(() => {
			console.log("Try random")
			if (!document.getElementById("smithieMessage"))
				randomEffect(smithieRef, setMessage)
		}, 5000)

		return () => clearInterval(interval)
	}, [])
	if (!import.meta.env.SSR) {
		const links = document.querySelectorAll("a")
		links.forEach((e) => {
			e.addEventListener("mouseenter", (e) => {
				const target = e.target as HTMLAnchorElement
				if (!message) setMessage(sayRandomPackRelatedMessage())
			})
		})
	}

	return (
		<div
			className="container"
			style={{
				position: "fixed",
				right: "1rem",
				bottom: "1rem",
				alignItems: "end",
				pointerEvents: "none",
			}}
		>
			{message && (
				<div
					id="smithieMessage"
					style={{
						backgroundColor: "white",
						color: "var(--bold)",
						fontSize: "1.25rem",
						padding: "0.5rem",
						borderRadius: "var(--defaultBorderRadius)",
						textAlign: "center",
						margin: "auto",
					}}
				>
					{message.text}
				</div>
			)}
			<div
				className="container"
				style={{ flexDirection: "row", gap: "1rem" }}
			>
				{" "}
				{message && message.choices && (
					<div
						className="container"
						style={{
							gap: "1rem",
							pointerEvents: "all",
							backgroundColor: "var(--bold)",
							padding: "0.5rem",
							borderRadius: "var(--defaultBorderRadius)",
						}}
					>
						{message.choices?.map((c) => (
							<button
								style={{ backgroundColor: "var(--accent)" }}
								onClick={() => setMessage(c.nextMessage)}
							>
								{c.text}
							</button>
						))}
					</div>
				)}
				<div
					className="container"
					style={{ gap: "1rem", pointerEvents: "all" }}
					onMouseEnter={() => {
						if (!message) setMessage(sayRandomTouchMessage())
					}}
				>
					{message && (
						<div
							style={{
								width: "1rem",
								height: "1rem",
								backgroundColor: "white",
								transform: "rotate(45deg)",
								marginTop: "-0.5rem",
							}}
						></div>
					)}
					<img
						ref={smithieRef}
						src={message?.expression ?? normalImage}
						style={{
							width: "6rem",
							height: "6rem",
							animation:
								message != null
									? "smithieBounce 0.3s ease-in-out infinite"
									: undefined,
						}}
					></img>
				</div>
			</div>
		</div>
	)
}

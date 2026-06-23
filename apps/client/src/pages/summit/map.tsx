import { useState, useEffect, useCallback } from "react"
import { Right } from "components/svg"
import "./map.css"

function getYouTubeEmbedUrl(url: string) {
	if (!url) return null
	try {
		const originParam = typeof window !== "undefined" ? `&origin=${encodeURIComponent(window.location.origin)}` : ""
		if (url.includes("youtu.be/")) {
			const videoId = url.split("youtu.be/")[1]?.split(/[?#]/)[0]
			return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1${originParam}` : null
		}
		if (url.includes("youtube.com/watch")) {
			const urlObj = new URL(url)
			const videoId = urlObj.searchParams.get("v")
			return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1${originParam}` : null
		}
		if (url.includes("youtube.com/embed/")) {
			const videoId = url.split("youtube.com/embed/")[1]?.split(/[?#]/)[0]
			return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1${originParam}` : null
		}
	} catch (e) {}
	return null
}

function getYouTubeThumbnailUrl(url: string) {
	if (!url) return null
	try {
		let videoId = ""
		if (url.includes("youtu.be/")) {
			videoId = url.split("youtu.be/")[1]?.split(/[?#]/)[0] || ""
		} else if (url.includes("youtube.com/watch")) {
			const urlObj = new URL(url)
			videoId = urlObj.searchParams.get("v") || ""
		} else if (url.includes("youtube.com/embed/")) {
			videoId = url.split("youtube.com/embed/")[1]?.split(/[?#]/)[0] || ""
		}
		return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
	} catch (e) {}
	return null
}

export function MapGallery({ images }: { images: string[] }) {
	const [index, setIndex] = useState(0)
	const [isVideoPlaying, setIsVideoPlaying] = useState(false)

	const mod = (n: number, m: number) => ((n % m) + m) % m

	const cycleImage = useCallback(
		(direction: number) => {
			setIndex((i) => mod(i + direction, images.length))
		},
		[images.length]
	)

	// Listen to player state updates from the YouTube Iframe API
	useEffect(() => {
		const handleMessage = (e: MessageEvent) => {
			if (!e.origin.includes("youtube.com") && !e.origin.includes("youtube-nocookie.com")) {
				return
			}

			try {
				const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data
				if (data) {
					// Handshake: YouTube player sends 'initialDelivery' when it loads.
					// We must reply with 'listening' so it keeps sending state changes.
					if (data.event === "initialDelivery") {
						;(e.source as any)?.postMessage(
							JSON.stringify({
								event: "listening",
								id: 1,
								channel: "widget",
							}),
							"*"
						)
					}

					let state: number | null = null
					if (data.event === "onStateChange") {
						state = data.info
					} else if (
						data.event === "infoDelivery" &&
						data.info &&
						typeof data.info.playerState !== "undefined"
					) {
						state = data.info.playerState
					}

					if (state === 1 || state === 3) {
						setIsVideoPlaying(true)
					} else if (state === 2 || state === 0) {
						setIsVideoPlaying(false)
					}
				}
			} catch (err) {}
		}
		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [])

	// Control auto-play interval based on isVideoPlaying state and active slide
	useEffect(() => {
		if (isVideoPlaying) return

		const interval = setInterval(() => {
			setIndex((i) => mod(i + 1, images.length))
		}, 5000)

		return () => clearInterval(interval)
	}, [index, isVideoPlaying, images.length])

	// Automatically stop video state when changing slides
	useEffect(() => {
		setIsVideoPlaying(false)
	}, [index])

	// Prepend the last 2 slides, and append the first 2 slides for seamless previewing
	const displayImages = [
		...images.slice(-2),
		...images,
		...images.slice(0, 2),
	]

	return (
		<div className="mapGallery">
			<div className="imageHolder">
				<div
					className="carouselTrack"
					style={{
						"--index": index,
					} as React.CSSProperties}
				>
					{displayImages.map((imgSrc, i) => {
						const isActive = i === index + 2
						const embedUrl = getYouTubeEmbedUrl(imgSrc)
						const thumbnailUrl = getYouTubeThumbnailUrl(imgSrc)
						return (
							<div
								className={`carouselSlide ${isActive ? "active" : ""}`}
								key={`${imgSrc}-${i}`}
								onClick={() => {
									if (i === index + 1) {
										cycleImage(-1)
									} else if (i === index + 3) {
										cycleImage(1)
									}
								}}
							>
								{embedUrl ? (
									isActive ? (
										<iframe
											src={embedUrl}
											title={`YouTube video player ${i}`}
											allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
											allowFullScreen
										/>
									) : (
										<img
											src={thumbnailUrl || ""}
											alt={`Summit Gallery Video Thumbnail ${i}`}
										/>
									)
								) : (
									<img src={imgSrc} alt={`Summit Gallery ${i}`} />
								)}
							</div>
						)
					})}
				</div>
			</div>
			<div className="buttonHolder">
				<button onClick={() => cycleImage(-1)}>
					<Right style={{ transform: "rotate(180deg)" }} />
				</button>
				{images.map((_, i) => (
					<div
						key={i}
						className={`indicatorDot ${i === index ? "active" : ""}`}
						onClick={() => {
							setIndex(i)
						}}
					/>
				))}
				<button onClick={() => cycleImage(1)}>
					<Right />
				</button>
			</div>
		</div>
	)
}

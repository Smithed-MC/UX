import { useState, useEffect, useRef, useCallback } from "react"
import { Right } from "components/svg"
import "./map.css"

export function MapGallery({ images }: { images: string[] }) {
	const [index, setIndex] = useState(0)
	const timeoutRef = useRef<any>()
	const intervalRef = useRef<any>()

	const mod = (n: number, m: number) => ((n % m) + m) % m

	const cycleImage = useCallback(
		(direction: number) => {
			setIndex((i) => mod(i + direction, images.length))
			clearInterval(intervalRef.current!)
			clearTimeout(timeoutRef.current)
			timeoutRef.current = setTimeout(startInterval, 1000)
		},
		[images.length]
	)

	const startInterval = useCallback(() => {
		intervalRef.current = setInterval(() => {
			setIndex((i) => mod(i + 1, images.length))
		}, 5000)
	}, [images.length])

	useEffect(() => {
		startInterval()

		return () => {
			clearInterval(intervalRef.current!)
			clearTimeout(timeoutRef.current)
		}
	}, [startInterval])

	return (
		<div className="mapGallery">
			<div className="imageHolder">
				{images.map((imgSrc, i) => (
					<img
						key={imgSrc}
						src={imgSrc}
						className={i === index ? "active" : ""}
						alt={`Summit Gallery ${i + 1}`}
					/>
				))}
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
							clearInterval(intervalRef.current!)
							clearTimeout(timeoutRef.current)
							timeoutRef.current = setTimeout(startInterval, 1000)
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

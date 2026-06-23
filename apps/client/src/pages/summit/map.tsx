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
								<img src={imgSrc} alt={`Summit Gallery ${i}`} />
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

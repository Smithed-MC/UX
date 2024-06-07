import { Trash, Plus } from "components/svg"
import { PackGalleryImage } from "data-types"
import { useState, useEffect, useRef } from "react"

export default function GalleryManager({
	packId,
	display,
}: {
	packId: string
	display: { gallery?: PackGalleryImage[] }
}) {
	const [selectedImage, setSelectedImage] = useState(0)
	const [images, setImages] = useState<PackGalleryImage[]>([])

	
	useEffect(() => {
		display.gallery ??= []
		display.gallery.forEach((g, i) => {
			if (typeof g === "string") return
			g.content = import.meta.env.VITE_API_SERVER + `/packs/${packId}/gallery/${i}`
		})

		setImages(display.gallery ?? [])
	}, [...(display.gallery ?? [])])

	const fileUploadRef = useRef<HTMLInputElement>(null)

	async function OnFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.currentTarget.files?.item(0)

		// console.log(file);
		if (file === undefined || file == null) return

		if (file.size > 1024 * 1024) return alert("Selected image exceeds 1MB")

		const result = await new Promise<string>((resolve) => {
			const fileReader = new FileReader()
			fileReader.readAsDataURL(file)
			fileReader.onloadend = () => {
				resolve(fileReader.result as string)
			}
		})

		if (display.gallery === undefined) display.gallery = []

		display.gallery.push(result)
		setImages([...display.gallery])
		setSelectedImage(display.gallery.length - 1)
	}

	return (
		<>
			<input
				ref={fileUploadRef}
				type="file"
				accept="image/png, image/jpeg, image/gif, image/webp"
				hidden
				onChange={OnFileUpload}
			/>
			{images && images.length >= 1 && (
				<div style={{ width: "100%", position: "relative" }}>
					<img
						style={{
							width: "100%",
							borderRadius: "var(--defaultBorderRadius)",
						}}
						src={
							typeof images[selectedImage] === "string"
								? images[selectedImage]
								: images[selectedImage].content
						}
					/>
					<button
						className="buttonLike"
						style={{
							position: "absolute",
							top: "0.5rem",
							right: "0.5rem",
							padding: "0.5rem",
						}}
						onClick={() => {
							display.gallery?.splice(selectedImage, 1)
							setImages([...(display.gallery ?? [])])
							setSelectedImage(
								selectedImage > 0 ? selectedImage - 1 : 0
							)
						}}
					>
						<Trash
							style={{
								width: "1rem",
								height: "1rem",
								fill: "var(--foreground)",
							}}
						/>
					</button>
				</div>
			)}
			<div
				className="uploaded"
				style={{ gridColumn: images.length == 0 ? "1/3" : undefined }}
			>
				{images.map((g, idx) => (
					<img
						key={`gImg${idx}`}
						src={typeof g === "string" ? g : g.content}
						className="galleryImageButton"
						onClick={() => setSelectedImage(idx)}
					/>
				))}
				<span
					className="buttonLike galleryUploadImage"
					style={{
						background: images.length > 0 ? "none" : undefined,
						width: images.length == 0 ? "100%" : undefined,
					}}
					onClick={() => {
						fileUploadRef.current?.click()
					}}
				>
					<Plus />
					{images.length === 0 ? "Upload gallery image" : ""}
				</span>
			</div>
		</>
	)
}

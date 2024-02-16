import { useFirebaseUser, useQueryParams, useSmithedUser } from "hooks"
import React, { useEffect, useState } from "react"
import { useLoaderData, useNavigate, useParams } from "react-router-dom"
import { ArticleLoaderData } from "../loaders"
import {
	CategoryBar,
	CategoryChoice,
	ChooseBox,
	IconInput,
	IconTextButton,
	MarkdownRenderer,
} from "components"
import { At, Check, Cross, Edit, Picture, Save, Upload } from "components/svg"

import "./article.css"

export default function Article() {
	const { new: isNew } = useQueryParams()
	let articleSlug = useParams().article ?? ""
	const loaderData = useLoaderData() as ArticleLoaderData | null
	const navigate = useNavigate()

	const userData = useSmithedUser()
	const firebaseUser = useFirebaseUser()

	const [isEditing, setIsEditing] = useState<boolean>(isNew != null)

	const [article, setArticle] = useState(loaderData?.article)
	const [content, setContent] = useState(article?.content ?? "")
	const [title, setTitle] = useState(article?.title)
	const [category, setCategory] = useState(article?.category)

	useEffect(() => {
		setContent(article?.content ?? "")
	}, [article?.content])
	useEffect(() => {
		setTitle(article?.title ?? "")
	}, [article?.title])
	useEffect(() => {
		setCategory(article?.category)
	}, [article?.category])

	async function loadPrivateArticle() {
		if (firebaseUser == null) return

		if (article?.state === "unpublished" && article.title === "") {
			const token = await firebaseUser.getIdToken()

			const resp = await fetch(
				import.meta.env.VITE_API_SERVER +
					`/articles/${articleSlug}?token=${token}`
			)
			if (!resp.ok) return setArticle(undefined)

			const data = await resp.json()
			console.log(data)
			setArticle(data)
		}
	}

	useEffect(() => {
		console.log("try to load")
		loadPrivateArticle()
	}, [article, firebaseUser])

	if (
		loaderData == null ||
		!article ||
		(article.state === "unpublished" &&
			article.content === "" &&
			article.title === "")
	) {
		return (
			<div className="container" style={{ height: "100%" }}>
				<h1>Specified article does not exist!</h1>
			</div>
		)
	}

	const { publisher } = loaderData

	return (
		<div
			className="container"
			style={{
				width: "100%",
				boxSizing: "border-box",
				gap: "1rem",
			}}
		>
			{userData?.role === "admin" && (
				<CategoryBar
					defaultValue={isNew ? "edit" : "preview"}
					onChange={(v) => setIsEditing(v === "edit")}
				>
					<CategoryChoice
						value="preview"
						text="Preview"
						icon={<Picture />}
					/>
					<CategoryChoice value="edit" text="Edit" icon={<Edit />} />
				</CategoryBar>
			)}
			<div
				className="container"
				style={{
					width: "100%",
					backgroundColor: "var(--accent)",
					position: "relative",
					minHeight: "4rem",
				}}
			>
				<div
					className="container"
					style={{
						width: "100%",
						maxHeight: "32rem",
						overflow: "hidden",
						justifyContent: "center",
					}}
				>
					<img
						id="bannerDisplay"
						src={article.banner}
						style={{ width: "100%" }}
					/>
				</div>

				{!isEditing && category && (
					<div
						style={{
							position: "absolute",
							bottom: 0,
							boxSizing: "border-box",
						}}
					>
						<div
							style={{
								backgroundColor: "var(--highlight)",
								padding: "1rem",
								borderRadius: "var(--defaultBorderRadius)",
								fontWeight: 700,
								boxSizing: "border-box",
								transform: "translateY(50%)",
							}}
						>
							{category.toUpperCase()}
						</div>
					</div>
				)}
				{isEditing && (
					<>
						<input
							id="bannerUpload"
							type="file"
							accept="application/png"
							style={{ display: "none" }}
							onChange={async (e) => {
								const file = e.currentTarget.files?.item(0)

								const dataUrl = await new Promise<string>(
									(resolve) => {
										const fileReader = new FileReader()
										fileReader.readAsDataURL(file!)
										fileReader.onloadend = () => {
											resolve(fileReader.result as string)
										}
									}
								)

								article.banner = dataUrl
								;(
									document.getElementById(
										"bannerDisplay"
									)! as HTMLImageElement
								).src = dataUrl
							}}
						/>
						<button
							style={{ position: "absolute" }}
							onClick={() =>
								document.getElementById("bannerUpload")?.click()
							}
						>
							<Upload />
						</button>
					</>
				)}
			</div>
			<div className="articleMainContent">
				<div
					className="container"
					style={{
						justifyContent: "start",
						alignItems: "start",
						gap: "1rem",
						gridArea: "publisher",
						opacity: isEditing ? 0 : 1,
					}}
				>
					<img
						src={publisher?.pfp}
						style={{
							width: "6rem",
							height: "6rem",
							backgroundColor: "var(--section)",
							border: "none",
							borderRadius: "var(--defaultBorderRadius)",
						}}
					/>
					<span>
						<span style={{ fontWeight: 700 }}>Written By:</span>{" "}
						<br />
						{publisher?.displayName}
					</span>
					<span>
						<span style={{ fontWeight: 700 }}>Date Published:</span>{" "}
						<br />
						{new Date(article?.datePublished).toDateString()}
					</span>
				</div>
				{!isEditing && (
					<div className="container" style={{ gridArea: "content" }}>
						<h1>{title}</h1>
						<div style={{ width: "100%", lineHeight: "1.75rem" }}>
							<MarkdownRenderer>{content}</MarkdownRenderer>
						</div>
					</div>
				)}
				{isEditing && (
					<div
						className="container"
						style={{
							width: "100%",
							gap: "1rem",
							boxSizing: "border-box",
							gridArea: "content",
						}}
					>
						<ChooseBox
							placeholder="Category"
							defaultValue={article.category}
							choices={[
								{
									value: "general",
									content: "General",
								},
								{
									value: "council",
									content: "Council",
								},
								{
									value: "showcase",
									content: "Showcase",
								},
							]}
							onChange={(v) =>
								(article.category = v as
									| "general"
									| "council"
									| "showcase")
							}
						/>
						<IconInput
							id="articleSlug"
							placeholder="Article slug"
							icon={At}
							defaultValue={articleSlug}
							disabled={!isNew}
							style={{ width: "100%" }}
							onInput={(e) => {
								articleSlug = e.currentTarget.value
							}}
						/>
						<h1
							contentEditable
							onInput={(e) =>
								(article.title = e.currentTarget.innerText)
							}
						>
							{article.title}
						</h1>
						<textarea
							style={{
								width: "100%",
								backgroundColor: "var(--section)",
								color: "var(--foreground)",
								resize: "none",
								padding: "1rem",
								borderRadius: "var(--defaultBorderRadius)",
								boxSizing: "border-box",
								height: `${article.content.split("\n").length + 3}rem`,
							}}
							onInput={(e) => {
								article.content = e.currentTarget.value ?? ""

								e.currentTarget.style.height = `1px`
								e.currentTarget.style.height =
									e.currentTarget.scrollHeight + "px"
							}}
							onKeyDown={(e) => {
								if (e.key === "Tab") {
									e.preventDefault()
									const start = e.currentTarget.selectionStart
									const end = e.currentTarget.selectionEnd

									const value = e.currentTarget.value
									e.currentTarget.value =
										value.substring(0, start) +
										"\t" +
										value.substring(start)

									e.currentTarget.selectionStart = start + 1
									e.currentTarget.selectionEnd = end + 1
								}
							}}
							defaultValue={article.content}
						/>
						<div
							className="container"
							style={{ flexDirection: "row", gap: "1rem" }}
						>
							{article.state !== "not-created" && (
								<IconTextButton
									text={"Delete"}
									icon={Cross}
									className="invalidButtonLike"
									onClick={async () => {
										if (!firebaseUser) return

										const token =
											await firebaseUser.getIdToken()

										await fetch(
											import.meta.env.VITE_API_SERVER +
												`/articles/${articleSlug}?token=${token}`,
											{ method: "DELETE" }
										)

										alert("Article deleted")
										navigate("/")
									}}
								/>
							)}
							<IconTextButton
								text={"Save Article"}
								icon={Check}
								className="successButtonLike"
								onClick={async () => {
									if (!firebaseUser) return

									const token =
										await firebaseUser.getIdToken()

									const resp = await postArticleData(token)

									if (resp.ok && isNew) {
										navigate(`/articles/${articleSlug}`)
									}
								}}
							/>
							{article.state === "unpublished" && (
								<IconTextButton
									text={"Publish Article"}
									icon={Upload}
									onClick={async () => {
										if (!firebaseUser) return

										const token =
											await firebaseUser.getIdToken()

										article.publisher = firebaseUser.uid
										article.datePublished = Date.now()
										article.state = "published"

										await postArticleData(token)

										alert("Article has been published")
										navigate(`/articles/${articleSlug}`)
									}}
								/>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	)

	async function postArticleData(token: string) {
		if (article?.state === "not-created") article.state = "unpublished"

		const slug = (
			document.getElementById("articleSlug")! as HTMLInputElement
		).value

		return await fetch(
			import.meta.env.VITE_API_SERVER +
				`/articles/${slug}?token=${token}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					data: article,
				}),
			}
		)
	}
}

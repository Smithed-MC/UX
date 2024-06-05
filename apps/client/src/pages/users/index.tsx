import { useQueryParams } from "hooks"
import { useLoaderData, useNavigate } from "react-router-dom"
import { UserBrowserData } from "./index.loader"
import { IconInput, IconTextButton, PageSelector } from "components"
import { Browse, Right } from "components/svg"
import { sanitize } from "formatters"
import { useEffect, useRef, useState } from "react"

export default function UsersBrowser() {
	const params = useQueryParams()
	const navigate = useNavigate()
	const { search, page } = params

	const { count: totalUsers, users } = useLoaderData() as UserBrowserData

	function setContentOpacity(opacity: number) {
		document
			.getElementById("userCardContainer")!
			.style.setProperty("opacity", opacity.toString())
	}

	useEffect(() => {
		setContentOpacity(1)
	}, [search, page])

	return (
		<div
			className="container"
			style={{ width: "100%", gap: "1rem", maxWidth: "32rem" }}
		>
			<IconInput
				icon={Browse}
				defaultValue={search?.toString() ?? ""}
				placeholder="Search..."
				style={{ width: "100%" }}
				onChange={(e) => {
					const search = e.currentTarget.value

					setContentOpacity(0.2)
					navigate(`?page=${page ?? 1}&search=${search}`)
				}}
			/>
			<PageSelector
				totalItems={totalUsers}
				currentPage={page != null ? Number.parseInt(page as string) : 1}
				params={
					new URLSearchParams({ search: search?.toString() ?? "" })
				}
				itemsPerPage={20}
				onChange={() => {
					setContentOpacity(0.2)
				}}
			/>
			<div
				id="userCardContainer"
				className="container"
				style={{
					gap: "1rem",
					transition: "opacity 0.3s ease-in-out",
					width: "100%",
				}}
			>
				{users?.map((u) => <User user={u} key={u.id} />)}
			</div>
		</div>
	)
}

function User({ user }: { user: { id: string; displayName: string } }) {
	const [imageError, setImageError] = useState(false)
	const imgRef = useRef<HTMLImageElement | null>(null)

	useEffect(() => {
		if (!imgRef.current) return
		imgRef.current.style.opacity = "0"
		imgRef.current.src =
			import.meta.env.VITE_API_SERVER + `/users/${user.id}/pfp`
	}, [imgRef])

	return (
		<div
			className="container"
			style={{
				backgroundColor: "var(--section)",
				border: "0.125rem solid var(--border)",
				borderRadius: "calc(var(--defaultBorderRadius) * 1.5)",
				padding: "1rem",
				flexDirection: "row",
				gap: "1rem",
				width: "100%",
				justifyContent: "start",
			}}
		>
			<div
				style={{
					width: "4rem",
					height: "4rem",
					borderRadius: "var(--defaultBorderRadius)",
					overflow: "hidden",
					backgroundColor: "var(--bold)",
					border: "0.125rem solid var(--border)",
				}}
			>
				<img
					style={{
						width: "100%",
						height: "100%",
						opacity: 0,
						transition: "opacity 0.1s ease-out"
					}}
					ref={imgRef}
					onLoad={(e) =>
						e.currentTarget.style.setProperty("opacity", "1")
					}
				/>
			</div>
			<div
				className="container"
				style={{
					height: "100%",
					justifyContent: "start",
					alignItems: "start",
					flexGrow: 1,
				}}
			>
				<div style={{ flexGrow: 1, fontWeight: 600 }}>
					{user.displayName}
				</div>
				<IconTextButton
					icon={Right}
					text={"Profile"}
					reverse
					style={{
						backgroundColor: "var(--accent)",
						alignSelf: "end",
						justifySelf: "end",
					}}
					href={"/" + sanitize(user.displayName)}
				/>
			</div>
		</div>
	)
}

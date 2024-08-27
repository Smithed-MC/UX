import { useQueryParams } from "hooks"
import { useLoaderData, useNavigate } from "react-router-dom"
import { UserBrowserData } from "./index.loader"
import { IconInput, IconTextButton, PageSelector } from "components"
import { Account, Browse, Flag, FlagCrossed, Right } from "components/svg"
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

function User({
	user,
}: {
	user: { id: string; displayName: string; biography: string }
}) {
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
				flexDirection: "column",
				gap: "1rem",
				width: "100%",
				justifyContent: "start",
			}}
		>
			<div
				className="container"
				style={{ gap: "1rem", flexDirection: "row", width: "100%" }}
			>
				<div
					style={{
						width: "6rem",
						height: "6rem",
						borderRadius: "var(--defaultBorderRadius)",
						overflow: "hidden",
						backgroundColor: "var(--bold)",
						flexShrink: 0,
						position: "relative",
					}}
				>
					<Account
						id="accountIcon"
						style={{
							width: "100%",
							height: "100%",
							opacity: 1,
							padding: "1rem",
							position: "absolute",
							boxSizing: "border-box",
						}}
					/>
					<img
						style={{
							width: "100%",
							height: "100%",
							opacity: 0,
							transition: "opacity 0.1s ease-out",
						}}
						ref={imgRef}
						onLoad={(e) => {
							e.currentTarget.style.setProperty("opacity", "1")
							const icon =
								e.currentTarget.parentElement!.querySelector(
									"#accountIcon"
								) as HTMLElement
							icon.style.setProperty("opacity", "0")
						}}
					/>
				</div>
				<div
					className="container"
					style={{
						height: "100%",
						justifyContent: "center",
						alignItems: "start",
						flexGrow: 1,
					}}
				>
					<div
						style={{
							fontWeight: 600,
							fontSize: "1.25rem",
							height: "min-content",
						}}
					>
						{user.displayName}
					</div>
					<div
						style={{
							lineHeight: "1.25rem",
							lineClamp: 2,
							textOverflow: "ellipsis",
							height: "2.5rem",
							overflow: "hidden",
							opacity: "0.5",
						}}
					>
						{user.biography}
					</div>
				</div>
			</div>
			<div
				className="container"
				style={{ gap: "1rem", flexDirection: "row", width: "100%" }}
			>
				<IconTextButton icon={Flag} text={"Report"} style={{backgroundColor: "var(--highlight)"}} />
				<IconTextButton
					icon={Right}
					text={"Open"}
					reverse
					style={{
						backgroundColor: "var(--accent)",
						alignSelf: "end",
						justifySelf: "end",
						width: "100%",
					}}
					centered
					href={"/" + sanitize(user.displayName)}
				/>
			</div>
		</div>
	)
}

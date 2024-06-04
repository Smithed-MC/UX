import { useQueryParams } from "hooks"
import { useLoaderData } from "react-router-dom"
import { UserBrowserData } from "./index.loader"
import { IconInput, PageSelector } from "components"
import { Browse } from "components/svg"

export default function UsersBrowser() {
	const params = useQueryParams()
	const { search, page } = params

	const { count: totalUsers, users } = useLoaderData() as UserBrowserData
	console.log(totalUsers)

	return (
		<div className="container" style={{ width: "100%", gap: "1rem" }}>
			<IconInput
				icon={Browse}
				defaultValue={search?.toString() ?? ""}
				placeholder="Search..."
				style={{ width: "100%", maxWidth: "32rem" }}
			/>
			<PageSelector
				totalItems={totalUsers}
				currentPage={page != null ? Number.parseInt(page as string) : 1}
				params={
					new URLSearchParams({ search: search?.toString() ?? "" })
				}
				itemsPerPage={20}
			/>
			{users.map((u) => (
				<User user={u} />
			))}
		</div>
	)
}

function User({ user }: { user: { id: string; displayName: string } }) {
	return (
		<div key={user.id}>
			<div style={{ width: "2rem", height: "2rem" }}>
				<img
					style={{ width: "100%", height: "100%" }}
					src={
						import.meta.env.VITE_API_SERVER +
						`/users/${user.id}/pfp`
					}
				/>
			</div>
		</div>
	)
}

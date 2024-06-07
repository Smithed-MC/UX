import { CategoryBar, CategoryChoice, ChooseBox } from "components"
import { Account, Globe, Refresh } from "components/svg"
import {
	DARK_THEME,
	LIGHT_THEME,
	useFirebaseUser,
	useQueryParams,
	useSiteSettings,
	useSmithedUser,
} from "hooks"
import Cookies from "js-cookie"
import { useEffect, useState } from "react"
import { useNavigate, useLoaderData, useFetcher, useRevalidator } from "react-router-dom"
import SiteSettings from "./settings/siteSettings"
import AccountSettings from "./settings/accountSettings"
import { PAToken, UserData } from "data-types"

export default function Settings() {
	const loaderData = useLoaderData() as {
		user: UserData
		tokens: { tokenDocId: string; tokenEntry: PAToken }[]
	} | null

	const isSignedOut = loaderData == null

	const firebaseUser = useFirebaseUser()
	const queryParams = useQueryParams()
	const navigate = useNavigate()
	const { revalidate } = useRevalidator()

	useEffect(() => {
		revalidate()
	}, [firebaseUser])

	
	const tab = (!isSignedOut ? (queryParams.tab as string | null) : 'site') ?? "site"

	return (
		<div className="container" style={{ width: "100%", gap: "4rem" }}>
			<CategoryBar
				defaultValue={tab}
				onChange={(v) => navigate("?tab=" + v)}
			>
				<CategoryChoice value={"site"} text={"Site"} icon={<Globe />} />
				<CategoryChoice
					value={"account"}
					text={"Account"}
					icon={<Account />}
					hidden={isSignedOut}
				/>
			</CategoryBar>
			{tab === "site" && <SiteSettings />}
			{loaderData != null && tab === "account" && (
				<AccountSettings tokens={loaderData.tokens} />
			)}
		</div>
	)
}

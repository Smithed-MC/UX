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
import { useState } from "react"
import { useNavigate, useLoaderData } from "react-router-dom"
import SiteSettings from "./settings/siteSettings"
import AccountSettings from "./settings/accountSettings"
import { PAToken, UserData } from "data-types"



export default function Settings() {
	const tab = (useQueryParams().tab as string | null) ?? "site"
	const loaderData = useLoaderData() as {user: UserData, tokens: {tokenDocId: string, tokenEntry: PAToken}[]}|null
	const navigate = useNavigate()

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
					hidden={loaderData == null}
				/>
			</CategoryBar>
			{tab === "site" && <SiteSettings />}
			{loaderData != null && tab === "account" && <AccountSettings tokens={loaderData.tokens}/>}
		</div>
	)
}

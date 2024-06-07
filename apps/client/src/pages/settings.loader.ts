import Cookies from 'js-cookie'
import Cookie from 'cookie'
import querystring from 'query-string'
import { UserData } from 'data-types'

export default async function loadSettingsData({request}: {request: Request}) {
    const { tab } = querystring.parse(
		request.url.split("?")[1]
	)

    const cookie = import.meta.env.SSR 
        ? Cookie.parse(request.headers.get("cookie") ?? "")
        : Cookie.parse(document.cookie)

    if (!('smithedUser' in cookie && 'smithedToken' in cookie))
        return null

    const user: UserData = JSON.parse(cookie['smithedUser'])
    const token = cookie['smithedToken']
    
    const tokensResp = await fetch(import.meta.env.VITE_API_SERVER + '/tokens?token=' + token)

    if (!tokensResp.ok)
        return {user: user, tokens: []}

    const tokens = await tokensResp.json()

    return {user, tokens}
}
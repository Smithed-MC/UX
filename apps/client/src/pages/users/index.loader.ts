
export interface UserBrowserData {
    count: number,
    users: {id: string, displayName: string}[]
}

export default async function loader({request}: {request: Request}): Promise<UserBrowserData> {
    const params = new URL(request.url).searchParams

    const users: {id: string, displayName: string}[] = await (await fetch(import.meta.env.VITE_API_SERVER + "/users?" + params.toString())).json()

    const count: number = await (await fetch(import.meta.env.VITE_API_SERVER + "/users/count?" + params.toString())).json()
    
    return {count, users}
}
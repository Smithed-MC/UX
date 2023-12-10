import { useState, useEffect } from "react"
import { getAuth, User } from 'firebase/auth'
import { useLocation, useRouteLoaderData } from "react-router-dom"
import * as queryString from "query-string"
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { UserData } from 'data-types'

import {AppDispatch, RootState, selectUserData} from 'store'

export function useFirebaseUser() {
    const [user, setUser] = useState<User | null>(getAuth().currentUser)

    useEffect(() => {
        const unsubscribe = getAuth().onAuthStateChanged((user) => setUser(user))

        return () => {
            unsubscribe()
        }
    }, [])

    return user
}

export function useSmithedUser() {
    const user = import.meta.env.SSR ? (useRouteLoaderData("root") as any).user : useAppSelector(selectUserData)

    return user && Object.keys(user).length > 0 ? user : undefined;
}

export function useQueryParams() {
    const location = useLocation();
    return queryString.parse(location.search)
}

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

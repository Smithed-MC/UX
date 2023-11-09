import { useState, useEffect } from "react"
import { getAuth, User } from 'firebase/auth'
import { useLocation } from "react-router-dom"
import * as queryString from "query-string"
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { UserData } from 'data-types'

import {AppDispatch, RootState} from 'store'

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
    const firebaseUser = useFirebaseUser()
    const [user, setUser] = useState<UserData | undefined>()

    useEffect(() => { (async () => {
        if(firebaseUser == null)
            return

        const resp = await fetch(import.meta.env.VITE_API_SERVER + `/users/${firebaseUser.uid}`)
        const data: UserData = await resp.json();
        
        setUser(data)
    })()}, [firebaseUser])

    return user
}

export function useQueryParams() {
    const location = useLocation();
    return queryString.parse(location.search)
}

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

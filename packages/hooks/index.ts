import { useState, useEffect } from "react"
import { getAuth, User } from 'firebase/auth'
import { useLocation } from "react-router-dom"
import * as queryString from "query-string"
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

export function useQueryParams() {
    const location = useLocation();
    return queryString.parse(location.search)
}
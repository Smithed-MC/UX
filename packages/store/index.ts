import * as toolkitRaw from '@reduxjs/toolkit';
const { createSlice, configureStore } = ((toolkitRaw as any).default ?? toolkitRaw) as typeof toolkitRaw;
import {PackBundle, UserData} from 'data-types'
import Cookies from 'js-cookie';

function getDefault<T>(key: string, defaultValue: T) {
    if (import.meta.env.SSR)
        return defaultValue
    

    const stored = localStorage.getItem('smithed.dev:' + key)

    if(stored != null)
        return typeof defaultValue !== 'string' ? JSON.parse(stored) as T : stored as T

    return defaultValue
}

function setStorage(key: string, value: any, child: () => void) {
    child()
    localStorage.setItem('smithed.dev:' + key, typeof value !== 'string' ? JSON.stringify(value) : value)
}

const initialState = {
    selectedBundle: getDefault<string>('selectedBundle', ''),
    usersBundles: getDefault<PackBundle[]>('usersBundles', []),
    userData: getDefault<UserData|{}>('userData', {})
}

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setSelectedBundle: (state, action) => setStorage('selectedBundle', action.payload, () => state.selectedBundle = action.payload),
        setUsersBundles: (state, action) => setStorage('usersBundles', action.payload, () => state.usersBundles = action.payload),
        setUserData: (state, action) => {
            if (Object.keys(action.payload).length > 1)
                Cookies.set('smithedUser', JSON.stringify(action.payload))
            else
                Cookies.remove('smithedUser')
            
            setStorage('userData', action.payload, () => state.userData = action.payload)
        },
    }
})

export const store = configureStore({
    reducer: userSlice.reducer
})

export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch


export const { setSelectedBundle, setUsersBundles, setUserData } = userSlice.actions

export const selectSelectedBundle = (state: RootState) => state.selectedBundle
export const selectUsersBundles = (state: RootState) => state.usersBundles
export const selectUserData = (state: RootState) => state.userData
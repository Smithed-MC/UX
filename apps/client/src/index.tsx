import { NavBar, RootError } from 'components'
import { useEffect } from 'react'
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration } from 'react-router-dom'
import { initializeApp } from 'firebase/app'
import { User as FirebaseUser } from 'firebase/auth'

import Browse from './pages/browse.js'
import Home from './pages/home.js'
import Packs, { loadPackData } from './pages/pack.js'
import './style.css'

import Account from './pages/account.js'
import { getAuth } from 'firebase/auth'
import Edit from './pages/edit.js'
import Bundles from './pages/bundle.js'
import Settings from './pages/settings.js'

import { Provider } from 'react-redux'

import logo_small from './assets/logo_small.png'
import { loadBrowseData, loadHomePageData, loadUserPageData } from './loaders.js'
import User from './pages/user.js'
import { selectSelectedBundle, selectUsersBundles, setSelectedBundle, setUsersBundles, store } from 'store'
import { useAppDispatch, useAppSelector } from 'hooks'
import { PackBundle } from 'data-types'
import { Helmet } from 'react-helmet'
import { ClientInject, getDefaultInject } from './inject.js'

export type { ClientInject } from './inject.js'

interface ClientProps {
    platform: 'desktop' | 'website',
    inject: ClientInject,
}

initializeApp({
    databaseURL: "https://mc-smithed-default-rtdb.firebaseio.com",
    apiKey: "AIzaSyDX-vLCBhO8StKAxnpvQ2EW8lz3kzYn4Qk",
    authDomain: "mc-smithed.firebaseapp.com",
    projectId: "mc-smithed",
    storageBucket: "mc-smithed.appspot.com",
    messagingSenderId: "574184244682",
    appId: "1:574184244682:web:498d168c09b39e4f0d7b33",
    measurementId: "G-40SRKC35Z0"
})



export function ClientApplet(props: ClientProps) {
    const dispatch = useAppDispatch()
    const selectedBundle = useAppSelector(selectSelectedBundle)

    function resetBundleData() {
        dispatch(setUsersBundles([]))
        dispatch(setSelectedBundle(''))
    }

    async function loadBundles(user: FirebaseUser | null) {
        if (user == null) {
            return resetBundleData()
        }

        const resp = await fetch(`https://api.smithed.dev/v2/users/${user.uid}/bundles`)
        if (!resp.ok)
            return resetBundleData()

        const bundleIds: string[] = await resp.json()

        if(bundleIds.find(b => b === selectedBundle) === undefined)
            dispatch(setSelectedBundle(''))

        const getData = async (id: string) => {
            const resp = await fetch(`https://api.smithed.dev/v2/bundles/${id}`)

            if (!resp.ok)
                return undefined

            return await resp.json() as PackBundle
        }
        const bundles = (await Promise.all(bundleIds.map(id => getData(id)))).filter(b => b !== undefined)
        dispatch(setUsersBundles(bundles))
    }

    useEffect(() => {
        if (import.meta.env.SSR)
            return

        const unsub = getAuth().onAuthStateChanged(async user => {
            await loadBundles(user)
        })

        return () => {
            unsub()
        }
    }, [])

    return <div className="container" style={{ position: 'absolute', top: 0, left: 0, height: '100%', paddingTop: '16px', boxSizing: 'border-box', gap: 32, justifyContent: 'safe start', alignItems: 'center', width: '100%', overflowY: 'auto', overflowX: 'hidden', scrollbarGutter: 'stable' }}>
        <ScrollRestoration />
        <Helmet>
            <title>Smithed</title>
            <meta name="description" content="Datapacks: the community, the tooling; all bundled into the perfect package." />
            <meta name="og:image" content="/icon.png" />
        </Helmet>
        <div className='container outlet' style={{ width: 'min(70rem, 100%)', gap: 32, boxSizing: 'border-box', flexGrow: 1, justifyContent: 'start' }}>
            <NavBar getTabs={props.inject.getNavbarTabs} logoUrl={props.inject.logoUrl} />
            <Outlet />
        </div>
        {props.inject.enableFooter ? <Footer /> : <br />}
    </div>
}

function Footer() {
    return <div className='container' style={{ width: '100%', backgroundColor: 'var(--bold)', borderTop: '2px solid var(--border)' }}>
        <div className="footerContainer" style={{ width: 'min(70rem, 100vw)', paddingLeft: 16 }}>
            <div className='container footerLargeGroup'>
                <div className="container" style={{ flexDirection: 'row', fontWeight: 600, fontSize: '3rem', justifyContent: 'center', gap: 16 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <path d="M18.85 10.3625C14.8125 12.4 11.475 14.1 11.4375 14.15C11.3375 14.25 35.7625 26.5 36.05 26.5C36.3375 26.5 50.9875 18.95 50.9625 18.8125C50.9375 18.65 26.65 6.625 26.3875 6.6375C26.275 6.65 22.8875 8.325 18.85 10.3625Z" fill="#FFF8F0" stroke="#121213" strokeWidth="2" />
                        <path d="M10.875 20.175V25.6125L23.4625 31.8625C30.375 35.3125 36.1125 38.125 36.1875 38.125C36.275 38.125 39.7625 36.3875 43.95 34.2625L51.5625 30.3875L51.6 24.875C51.6125 21.8375 51.5875 19.375 51.525 19.4C51.1375 19.5625 36.5375 27.0625 36.45 27.1375C36.375 27.2 36.25 27.25 36.1625 27.25C36.075 27.25 30.375 24.4375 23.5 21C16.625 17.5625 10.975 14.75 10.9375 14.75C10.9 14.75 10.875 17.2 10.875 20.175Z" fill="#FFF8F0" stroke="#121213" strokeWidth="2" />
                        <path d="M22.125 35.2375V38.4875L28.2125 41.55C31.5625 43.2375 34.375 44.625 34.4625 44.625C34.55 44.625 35.925 43.975 37.5 43.1875L40.375 41.75V39.3125C40.375 37.975 40.3375 36.875 40.3 36.875C40.2625 36.875 39.35 37.325 38.2625 37.875C37.175 38.425 36.25 38.875 36.2 38.875C36.15 38.875 32.9875 37.325 29.1625 35.4375C25.3375 33.55 22.1875 32 22.175 32C22.15 32 22.125 33.4625 22.125 35.2375Z" fill="#FFF8F0" stroke="#121213" strokeWidth="2" />
                        <path d="M41.475 36.2624L41 36.4999V39.3124V42.1249L37.85 43.7124C36.1125 44.5999 34.575 45.3124 34.4375 45.3124C34.3 45.3124 31.4625 43.9374 28.125 42.2499C24.8 40.5624 21.9375 39.1374 21.7875 39.0874C21.525 38.9874 21.5 38.8999 21.475 37.5749L21.4375 36.1624L17.2875 38.1749C15 39.2749 13.125 40.1999 13.125 40.2374C13.1375 40.3374 30.825 49.0499 31.1 49.0999C31.4 49.1499 49.55 40.1249 49.425 39.9999C49.325 39.9124 42 35.9874 41.95 35.9999C41.95 36.0124 41.725 36.1249 41.475 36.2624Z" fill="#FFF8F0" stroke="#121213" strokeWidth="2" />
                        <path d="M40.575 45.2625C35.4875 47.8 31.275 49.875 31.225 49.875C31.0875 49.875 28.8625 48.8 20.075 44.45C15.9625 42.4125 12.575 40.75 12.55 40.75C12.5125 40.75 12.5125 42.3 12.525 44.2L12.5625 47.6375L21.8 52.2C26.875 54.7 31.1 56.75 31.1875 56.75C31.275 56.75 35.5375 54.7 40.65 52.2L49.9375 47.65L49.975 44.1375C49.9875 42.2 49.9625 40.625 49.9125 40.6375C49.85 40.6375 45.65 42.725 40.575 45.2625Z" fill="#FFF8F0" stroke="#121213" strokeWidth="2" />
                    </svg> 
                    Smithed
                </div>

                <p style={{ color: 'var(--border)' }}>
                    <b>Copyright © 2023 Smithed</b><br />
                    Not an official Minecraft product. Not approved by or associated with Mojang Studios
                </p>
            </div>
            <div className='container footerSmallGroup'>
                <b style={{ fontSize: '1.5rem' }}>SOCIAL</b>
                <a className='compactButton' href="https://smithed.dev/discord">Discord</a>
                <a className='compactButton' href="https://github.com/Smithed-MC">Github</a>
            </div>
            <div className='container footerSmallGroup'>
                <b style={{ fontSize: '1.5rem' }}>POLICIES</b>
                <a className='compactButton'>Terms of service</a>
                <a className='compactButton'>Privacy policy</a>
                <a className='compactButton'>Guidelines</a>

            </div>
        </div>
    </div>;
}

// Don't reorder these please
export const subRoutes = [
    {
        path: "",
        element: <Home />,
        loader: loadHomePageData
    },
    {
        path: "settings",
        element: <Settings />
    },
    {
        path: "browse",
        element: <Browse />,
        loader: loadBrowseData
    },
    {
        path: "account",
        element: <Account />
    },
    {
        path: "edit",
        element: <Edit />,
    },
    {
        path: ":owner",
        element: <User />,
        loader: loadUserPageData
    },
    {
        path: "packs/:id",
        element: <Packs packDownloadButton={getDefaultInject().packDownloadButton} />,
        loader: loadPackData
    },
    {
        path: 'bundles/:bundleId',
        element: <Bundles />
    }
]

export const routes = [
    {
        path: '/',
        children: subRoutes,
        element: <Provider store={store}>
            <ClientApplet platform='website' inject={getDefaultInject()}/>
        </Provider>,
        errorElement: <RootError />
    }
]

// Set the default client applet to one with different props
export function populateRouteProps(props: ClientProps) {
    console.log("Populate");
    routes[0].element = <Provider store={store}>
        <ClientApplet {...props}/>
    </Provider>;
    subRoutes[6].element = <Packs packDownloadButton={props.inject.packDownloadButton} />;
}

export default function Client({ platform }: ClientProps) {
    const router = createBrowserRouter(routes)
    return <RouterProvider router={router} />
}

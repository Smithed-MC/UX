import { IconTextButton, NavBar, RootError } from 'components'
import React from 'react'
import { BrowserRouter, createBrowserRouter, HashRouter, Outlet, Route, RouterProvider, Search } from 'react-router-dom'
import { initializeApp } from 'firebase/app'

import Browse from './pages/browse.js'
import Home from './pages/home.js'
import Packs from './pages/pack.js'
import User from './pages/user.js'
require('./style.css')

import { Discord as DiscordSvg, Home as HomeSvg, Browse as BrowseSvg, Account as AccountSvg } from 'components/svg.js'
import Account from './pages/account.js'
import { getAuth, browserLocalPersistence } from 'firebase/auth'
import Edit from './pages/edit.js'
import Bundles from './pages/bundle.js'
import Settings from './pages/settings.js'

const logo_small = require('./assets/logo_small.png')

interface ClientProps {
    platform: 'desktop' | 'website'
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

const router = createBrowserRouter([
    {
        path: "/",
        errorElement: <RootError />,
        element: <div className="container" style={{ position: 'absolute', top: 0, left: 0, height: '100%', paddingTop: '16px', boxSizing: 'border-box', gap: 112, justifyContent: 'safe start', alignItems: 'center', width: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
            <div className='container main' style={{ width: 'min(70rem, 100%)', gap: 32, boxSizing: 'border-box' }}>
                <NavBar>
                    <IconTextButton text='Home' href="/" icon={HomeSvg} />
                    <IconTextButton text='Browse' href="/browse" icon={BrowseSvg} />
                    <IconTextButton text='Discord' href="https://smithed.dev/discord" icon={DiscordSvg} />
                    <div style={{ flexGrow: 1 }} />
                    <IconTextButton text='Login' href="/account" icon={AccountSvg} reverse={true} />
                </NavBar>
                <Outlet />
            </div>
            <div className='container' style={{ width: '100%', backgroundColor: 'var(--bold)', borderTop: '2px solid var(--border)' }}>
                <div className="footerContainer" style={{ width: 'min(70rem, 100vw)' }}>
                    <div className='container footerLargeGroup'>
                        <div className="container" style={{ flexDirection: 'row', fontWeight: 700, fontSize: '3rem', justifyContent: 'center', gap: 16 }}>
                            <img src={logo_small} /> Smithed
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
            </div>
        </div>,
        children: [
            {
                path: "",
                element: <Home />
            },
            {
                path: "settings",
                element: <Settings />
            },
            {
                path: "browse",
                element: <Browse />
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
                element: <User />
            },
            {
                path: "packs/:id",
                element: <Packs />
            },
            {
                path: 'bundles/:bundleId',
                element: <Bundles />
            }
        ]
    }
]);

export default function Client({ platform }: ClientProps) {
    return <RouterProvider router={router} />
}
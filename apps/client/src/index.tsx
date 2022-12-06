import { NavBar } from 'components'
import React from 'react'
import { BrowserRouter, createBrowserRouter, HashRouter, Outlet, Route, RouterProvider, Search } from 'react-router-dom'
import { initializeApp } from 'firebase/app'

import Browse from './pages/browse'
import Home from './pages/home'
import Packs from './pages/pack'
import User from './pages/user'
import './style.css'
import { NavOption } from 'components/NavBar'
import { Search as SearchSvg, Home as HomeSvg, Settings as SettingsSvg, Account as AccountSvg } from 'components/svg'
import Account from './pages/account'
import { getAuth, browserLocalPersistence } from 'firebase/auth'
import Edit from './pages/edit'

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
        element: <div style={{ height: '100%' }}>
            <NavBar>
                <NavOption SVGComponent={HomeSvg} path='/' title='Home' />
                <NavOption SVGComponent={SearchSvg} path='/browse' title='Browse' />
                <NavOption SVGComponent={AccountSvg} path='/account' title='Account' />
                <NavOption SVGComponent={SettingsSvg} path='/settings' title='Settings' />
            </NavBar>
            <Outlet />
        </div>,
        children: [
            {
                path: "",
                element: <Home />
            },
            {
                path: "settings",
                element: <div>Settings</div>
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
                element: <Edit/>,
            },
            {
                path: ":owner/",
                element: <User />
            },
            {
                path: ":owner/:id",
                element: <Packs />
            }
        ]
    }
]);

export default function Client({ platform }: ClientProps) {
    return <div>
        <RouterProvider router={router} />
    </div>
}
import React, { useEffect, useState } from "react";
import { getAuth, User } from 'firebase/auth'
import Login from "../widget/login";
import { useNavigate } from "react-router-dom";
import { useFirebaseUser } from "hooks";
import SignUp from "../widget/signup";


export default function Account() {
    const user = useFirebaseUser()
    const navigate = useNavigate()
    const [tab, setTab] = useState<'login'|'signup'>('login')

    if (user == null) {

        return <div className="container" style={{ width: '100vw', height: '100vh', top: 0, position: 'absolute', right: 0, animation: 'fadeIn 1s', boxSizing: 'border-box' }}>
            <div className='container' style={{backgroundColor: 'var(--backgroundAccent)', padding: 12, borderRadius: 'var(--defaultBorderRadius)', gap: 32, maxWidth: 384, width: '100%', maxHeight: 384, height: '100%', justifyContent: 'start'}}>
                <div className="container" style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'start' }}>
                    <label className="clickable" onClick={() => setTab('login')} style={
                        {fontSize: 24, width: '100%', textAlign: 'center', borderBottom: tab === 'login' ? '4px solid var(--accent)' : '' }
                    }>Login</label>
                    <label className="clickable" onClick={() => setTab('signup')} style={
                        {fontSize: 24, width: '100%', textAlign: 'center', borderBottom: tab === 'signup' ? '4px solid var(--accent)' : '' }
                    }>Sign up</label>
                </div>
                <div className="container" style={{justifyContent: 'center', height: '100%'}}>
                    {tab === 'login' && <Login />}
                    {tab === 'signup' && <SignUp />}
                </div>
            </div>
        </div>
    }



    (async () => {
        const userData = await (await fetch('https://api.smithed.dev/v2/users/' + user.uid)).json()
        navigate(`../${userData.displayName}?uid=${user.uid}`)
    })()

    return <div></div>
}
import React, { useEffect, useState } from "react";
import { getAuth, User } from 'firebase/auth'
import Login from "../widget/login";
import { useNavigate } from "react-router-dom";
import { useFirebaseUser } from "hooks";
import SignUp from "../widget/signup";

import logo from '../assets/logo.png'
import ResetPassword from "../widget/resetPassword";
import { ColoredLogo } from "components/svg";

export default function Account() {
    const user = useFirebaseUser()
    const navigate = useNavigate()
    const [tab, setTab] = useState<'login'|'signup'|'reset'>('login')

    

    useEffect(() => {
        if(user != null) {
            navigate('../' + user.uid)
        }
    }, [user])

    if (user == null) {

        return <div className="container" style={{ width: '100%', flexGrow: 1, height: '100%', animation: 'fadeIn 1s', boxSizing: 'border-box' }}>
            <div className='container' style={{backgroundColor: 'var(--backgroundAccent)', padding: 12, borderRadius: 'var(--defaultBorderRadius)', gap: 32, justifyContent: 'start'}}>
                <ColoredLogo style={{width: '12rem', height: '12rem', color: 'var(--accent)', flexShrink: 0}}/>
                <div className="container" style={{justifyContent: 'center', height: '100%'}}>
                    {tab === 'login' && <Login clickSignUp={() => setTab('signup')} clickHelp={() => setTab('reset')}/>}
                    {tab === 'signup' && <SignUp clickLogin={() => setTab('login')} />}
                    {tab === 'reset' && <ResetPassword clickBack={() => setTab('login')}/>}
                </div>
            </div>
        </div>
    }


    return <div></div>
}
import { browserLocalPersistence, browserSessionPersistence, getAuth, setPersistence, signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import './login.css'
import { FirebaseError } from "firebase/app";
import { IconInput, IconTextButton } from "components";
import { Right, Key, At } from "components/svg";

export default function Login({clickSignUp, clickHelp}: {clickSignUp: () => void, clickHelp: () => void}) {
    const [email, setEmail] = useState('')
    const [emailError, setEmailError] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [password, setPassword] = useState('')
    const [staySignedIn, setStaySignedIn] = useState(false)

    // console.log(getAuth().currentUser)
    const login = async () => {
        if(email === '' || password === '') return;
        try {
            setPersistence(getAuth(), staySignedIn ? browserLocalPersistence : browserSessionPersistence)
       
            const cred = await signInWithEmailAndPassword(getAuth(), email, password)
        } catch (e: any) {
            const error = e as FirebaseError
            // console.log(error.code)

            switch(error.code) {
                case 'auth/invalid-email': {
                    setEmailError("Invalid Email")
                    break;
                }
                case 'auth/user-not-found': {
                    setEmailError("No user with that email")
                    break;
                }
                case 'auth/wrong-password': {
                    setPasswordError("Invalid Password")
                    break;
                }
            }
        }
        
    }

    return <div className="container" style={{gap: '1rem'}}>
        <IconInput type="email" className={emailError != '' ? 'invalidInput' : ''} placeholder="Email" icon={At} onChange={e => {
            setEmail(e.currentTarget.value)
            setEmailError('')    
        }} value={email} title={emailError}/>
        <IconInput type="password" className={passwordError != '' ? 'invalidInput' : ''} placeholder="Password" icon={Key} onChange={e => {
            setPassword(e.currentTarget.value)
            setPasswordError('')
        }} value={password} onKeyDown={(e) => {if(e.key === 'Enter') login()}} title={passwordError}/>
        <div className="container" style={{flexDirection: 'row', gap: '0.5rem', width: '100%', justifyContent: 'start'}}>
            <input type="checkbox" style={{width: '1rem', height: '1rem', borderRadius: 'var(--defaultBorderRadius)'}} onChange={(e) => {
                setStaySignedIn(e.currentTarget.checked)
            }}/>
            <span style={{opacity: 0.3}}>Stay signed in?</span>
        </div>
        <div className="container" style={{flexDirection: 'row', gap: '1.25rem'}}>
            <a className="compactButton" style={{opacity: 0.3}} onClick={clickHelp}>
                Need help?
            </a>
            <div style={{width: '0.25rem', height: '0.25rem', backgroundColor: 'var(--border)', borderRadius: '50%', margin: '0rem -0.75rem'}}/>
            <a className="compactButton" style={{opacity: 0.3}} onClick={clickSignUp}>
                Sign up
            </a>
            <IconTextButton className="accentedButtonLike" text="Login" icon={Right} reverse={true} onClick={login} disabled={email === '' || password === ''}/>
        </div>

    </div>
}
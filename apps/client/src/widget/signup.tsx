import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import './login.css'
import { FirebaseError } from "firebase/app";
import { IconInput, IconTextButton } from "components";
import { Account, At, Key, Right } from "components/svg";

export default function SignUp({clickLogin}: {clickLogin: ()=>void}) {
    const [email, setEmail] = useState('')
    const [displayName, setDisplayName] = useState('')

    const [displayNameError, setDisplayNameError] = useState('')
    const [emailError, setEmailError] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [confirmPasswordError, setConfirmPasswordError] = useState('')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    // console.log(getAuth().currentUser)



    const signup = async () => {
        if (email === '' || password === '' || displayName === '') return;

        if (password !== confirmPassword)
            return setConfirmPasswordError('Passwords do not match!')

        try {
            try {
                const userDataResp = await fetch(`https://api.smithed.dev/v2/users/${displayName}`)
                if (userDataResp.ok)
                    return setDisplayNameError('Username taken!')
            } catch {

            }


            const cred = await createUserWithEmailAndPassword(getAuth(), email, password)
            const token = await cred.user.getIdToken()
            const uid = cred.user.uid;


            const resp = await fetch(`https://api.smithed.dev/v2/users/${uid}/setup?token=${token}&displayName=${displayName}`)

            if (!resp.ok)
                return alert(await resp.json())

        } catch (e: any) {
            const error = e as FirebaseError
            // console.log(error.code)

            switch (error.code) {
                case 'auth/invalid-email': {
                    setEmailError("Invalid Email")
                    break
                }
                case 'auth/weak-password': {
                    setPasswordError("Weak Password")
                    break
                }
                case 'auth/email-already-in-use': {
                    setEmailError("Email already in use!")
                    break
                }
            }
        }

    }

    return <div className="container" style={{ gap: 16 }}>
        <IconInput icon={Account} title={displayNameError} className={displayNameError != '' ? 'invalidInput' : ''}
            type="text" id="" placeholder="Username" maxLength={16} onChange={e => {
                setDisplayName(e.currentTarget.value)
                setDisplayNameError('')
            }} value={displayName} />

        <IconInput icon={At} title={emailError} className={emailError != '' ? 'invalidInput' : ''}
            type="email" id="" placeholder="Email" onChange={e => {
                setEmail(e.currentTarget.value)
                setEmailError('')
            }} value={email} />

        <IconInput icon={Key} title={passwordError} className={passwordError != '' ? 'invalidInput' : ''}
            type="password" placeholder="Password" onChange={e => {
                setPassword(e.currentTarget.value)
                setPasswordError('')
            }} value={password} />

        <IconInput icon={Key} title={confirmPasswordError} className={confirmPasswordError != '' ? 'invalidInput' : ''}
            type="password" placeholder="Confirm Password" onChange={e => {
                setConfirmPassword(e.currentTarget.value)
                setConfirmPasswordError('')
            }} value={confirmPassword} onKeyDown={(e) => { if (e.key === 'Enter') signup() }} />
        <div className="container" style={{flexDirection: 'row', gap: '1.25rem'}}>
            <a className="compactButton" style={{color: 'var(--border)'}} href="https://smithed.dev/discord">
                Need help
            </a>
            <div style={{width: '0.25rem', height: '0.25rem', backgroundColor: 'var(--border)', borderRadius: '50%', margin: '0rem -0.75rem'}}/>
            <a className="compactButton" style={{color: 'var(--border)'}} onClick={clickLogin}>
                Login
            </a>
            <IconTextButton className="accentedButtonLike" text="Sign Up" icon={Right} reverse={true} onClick={signup} disabled={email === '' || password === '' || displayName === '' || confirmPassword === ''}/>
        </div>
    </div>
}
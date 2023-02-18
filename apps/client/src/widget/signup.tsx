import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import './login.css'
import { FirebaseError } from "firebase/app";

export default function SignUp() {
    const [email, setEmail] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [error, setError] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    console.log(getAuth().currentUser)



    const signup = async () => {
        if (email === '' || password === '' || displayName === '') return;

        if(password !== confirmPassword)
            return setError('Passwords do not match!')

        try {
            const userDataResp = await fetch(`https://api.smithed.dev/v2/users/${displayName}`)
            if(userDataResp.ok) 
                return setError('Username taken!')

            const cred = await createUserWithEmailAndPassword(getAuth(), email, password)
            const token = await cred.user.getIdToken()
            const uid = cred.user.uid;

            const resp = await fetch(`https://api.smithed.dev/v2/users/${uid}/setup?token=${token}&displayName=${displayName}`)

            if(!resp.ok)
                return setError(await resp.json())

        } catch (e: any) {
            const error = e as FirebaseError
            console.log(error.code)
            return setError(error.code.split('/')[1].split('-').map((s) => s[0].toUpperCase() + s.substring(1)).join(' '))
        }

    }

    return <div className="container" style={{ gap: 16 }}>
        <input type="text" id="" placeholder="Display Name..." maxLength={16} onChange={e => setDisplayName(e.currentTarget.value)} value={displayName} />
        <input type="email" id="" placeholder="Email..." onChange={e => setEmail(e.currentTarget.value)} value={email} />
        <input type="password" placeholder="Password..." onChange={e => setPassword(e.currentTarget.value)} value={password} />
        <input type="password" placeholder="Confirm Password..." onChange={e => setConfirmPassword(e.currentTarget.value)} value={confirmPassword} onKeyDown={(e) => { if (e.key === 'Enter') signup() }} />
        <input type="button" value="Sign up" onClick={signup} />
        <label hidden={error === ''} style={{ color: 'var(--badAccent)' }}>{error}</label>
    </div>
}
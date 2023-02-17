import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import './login.css'
import { FirebaseError } from "firebase/app";

export default function Login() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [password, setPassword] = useState('')

    console.log(getAuth().currentUser)
    const login = async () => {
        if(email === '' || password === '') return;

        try {
            const cred = await signInWithEmailAndPassword(getAuth(), email, password)
        } catch (e: any) {
            const error = e as FirebaseError
            console.log(error.code)
            return setError(error.code.split('/')[1].split('-').map((s) => s[0].toUpperCase() + s.substring(1)).join(' '))
        }
        
    }

    return <div className="container" style={{gap: 16}}>
        <input type="email" id="" placeholder="Email..." onChange={e => setEmail(e.currentTarget.value)} value={email}/>
        <input type="password" placeholder="Password..." onChange={e => setPassword(e.currentTarget.value)} value={password} onKeyDown={(e) => {if(e.key === 'Enter') login()}}/>
        <input type="button" value="Login" onClick={login}/>
        <label hidden={error === ''} style={{color: 'var(--badAccent)'}}>{error}</label>
    </div>
}
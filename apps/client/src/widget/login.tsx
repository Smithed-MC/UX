import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import './login.css'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    console.log(getAuth().currentUser)

    const login = async () => {
        const cred = await signInWithEmailAndPassword(getAuth(), email, password)
        console.log(cred)
    }

    return <form className="container" style={{ backgroundColor: 'var(--backgroundAccent)', borderRadius: 'var(--defaultBorderRadius)', padding: 24, gap: 16 }}>
        <h1>Login</h1>
        <input type="email" id="" placeholder="Email..." onChange={e => setEmail(e.currentTarget.value)} value={email}/>
        <input type="password" placeholder="Password..." onChange={e => setPassword(e.currentTarget.value)} value={password} onKeyDown={(e) => {if(e.key === 'Enter') login()}}/>
        <input type="button" value="Login" onClick={login}/>
    </form>
}
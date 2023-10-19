import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import React, { useState } from "react";
import './login.css'
import { FirebaseError } from "firebase/app";
import { IconInput, IconTextButton } from "components";
import { Right, Key, At } from "components/svg";

export default function ResetPassword({clickBack}: {clickBack: () => void}) {
    const [email, setEmail] = useState('')
    const [emailError, setEmailError] = useState('')

    // console.log(getAuth().currentUser)
    const reset = async () => {
        if(email === '') return;
        try {
            await sendPasswordResetEmail(getAuth(), email)
            alert('An email has been sent with a password reset link.')
            clickBack()
        } catch (e: any) {
            const error = e as FirebaseError
            setEmailError(error.code)
        }
        
    }

    return <div className="container" style={{gap: 16}}>
        <IconInput type="email" className={emailError != '' ? 'invalidInput' : ''} placeholder="Email" icon={At} onChange={e => {
            setEmail(e.currentTarget.value)
            setEmailError('')    
        }} value={email} title={emailError}/>
        <div className="container" style={{flexDirection: 'row', gap: '1.25rem'}}>
            <a className="compactButton" style={{color: 'var(--border)'}} onClick={clickBack}>
                Back
            </a>
            <IconTextButton className="accentedButtonLike" text="Reset Password" icon={Right} reverse={true} onClick={reset} disabled={email === ''}/>
        </div>
    </div>
}
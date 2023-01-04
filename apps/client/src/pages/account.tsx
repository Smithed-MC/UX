import React, { useEffect, useState } from "react"; 
import {getAuth, User} from 'firebase/auth'
import Login from "../widget/login";
import { useNavigate } from "react-router-dom";
import { useFirebaseUser } from "hooks";


export default function Account() {
    const user = useFirebaseUser()
    const navigate = useNavigate()

    if(user == null) {
        return <div className="container" style={{width: '100vw', height: '100vh', top: 0, position: 'absolute', right: 0}}>
            <Login/>
        </div>
    }

    
    
    (async () => {
        const userData = await (await fetch('https://api.smithed.dev/getUser?uid=' + user.uid)).json()
        navigate(`./${userData.displayName}?uid=${user.uid}`)
    })()

    return <div></div>
}
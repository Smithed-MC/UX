import { invoke, tauri } from "@tauri-apps/api"
import { listen } from '@tauri-apps/api/event'
import {WebviewWindow} from '@tauri-apps/api/window'
import { open } from '@tauri-apps/api/shell'
import { useEffect } from "react"

export default function Settings() {

    useEffect(() => {
        const unsubscribe = listen<string>('store_users', (event) => {
            localStorage.setItem('mc_users', event.payload)
        })
        return () => {
            unsubscribe.then((v) => v())
        }
    })

    return <div>
        <h1>Settings</h1>
        Version: 0.3.0
        {/* <button onClick={async () => {
            
            const deviceCodeResp = JSON.parse(await invoke('get_device_code'))

            alert("Your device code is: " + deviceCodeResp.user_code)
            const window = new WebviewWindow("microsoftSignIn", {url: deviceCodeResp.verification_uri})
            const token = await tauri.invoke('get_minecraft_token', {deviceCode: deviceCodeResp.device_code})
            window.close()
        }}>Register User</button>
        <button onClick={async () => {
            await tauri.invoke('launch_game')
        }}>Launch Game</button> */}
    </div>
}

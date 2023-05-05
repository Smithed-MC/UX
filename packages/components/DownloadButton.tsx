import React, { useState } from 'react'
import { Download } from './svg'
import saveAs from 'file-saver'
interface DownloadButtonProps {
    link: string
}

export default function DownloadButton({ link }: DownloadButtonProps) {
    const [downloading, setDownloading] = useState(false)
    return <div style={{ width: 48, height: 48, flexShrink: 0 }}>
        <a className="button wobbleHover container" style={{ maxWidth: 48, maxHeight: 48, borderRadius: '24px', padding: 12 }} href={link} onClick={async (e) => {
            e.preventDefault()
            setDownloading(true)
            
            const resp = await fetch(link)
            for(let h of resp.headers) {
                console.log(h)
            }
            saveAs(await resp.blob())
            setDownloading(false)
        }}>
            <Download style={{ fill: 'var(--buttonText)' }} />
        </a>
        {downloading && <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)'}}>

        </div>}
    </div>
}
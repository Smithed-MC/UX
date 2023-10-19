import React, { useState } from 'react'
import { Download } from './svg'
import saveAs from 'file-saver'
import Spinner from './Spinner'
interface DownloadButtonProps {
    link: string
}


export default function DownloadButton({ link }: DownloadButtonProps) {
    const [downloading, setDownloading] = useState(false)
    return <div style={{ width: 48, height: 48, flexShrink: 0 }}>
        <a className="button wobbleHover container" style={{ width: 48, height: 48, borderRadius: '24px', padding: 12, boxSizing: 'border-box', overflow: 'clip', justifyContent: 'center' }} href={link} rel="nofollow" onClick={async (e) => {
            e.preventDefault()
            
            setDownloading(true)

            const resp = await fetch(link)
            if (!resp.ok) {
                setDownloading(false)
                return
            }
                
            
            const disposition = resp.headers.get('content-disposition')
            if (disposition == null) {
                setDownloading(false)
                return
            }

            const filename = disposition.matchAll(/.*filename="(.+)"/g).next().value[1]

            saveAs(await resp.blob(), filename)
            setDownloading(false)
        }}>
            {!downloading && <Download style={{ fill: 'var(--buttonText)' }} />}
            { downloading && <Spinner style={{width: 32, height: 32, position: 'absolute', border: '4px solid var(--subText)', borderTop:'4px solid var(--buttonText)', boxSizing: 'border-box', top: 8, left: 8}}/>}
        </a>
    </div>
}
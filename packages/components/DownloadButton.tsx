import React from 'react'
import { Download } from './svg'

interface DownloadButtonProps {
    link: string
}

export default function DownloadButton({ link }: DownloadButtonProps) {
    return <div style={{ width: 48, height: 48, flexShrink: 0 }}>
        <a className="button wobbleHover container" style={{ maxWidth: 48, maxHeight: 48, borderRadius: '24px', padding: 12 }} href={link}>
            <Download style={{ fill: 'var(--buttonText)' }} />
        </a>
    </div>
}
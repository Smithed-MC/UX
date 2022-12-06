import React from 'react'
import { Edit } from './svg'

interface DownloadButtonProps {
    link?: string,
    [key: string]: any
}

export default function EditButton({link, ...props}: DownloadButtonProps) {
    return <div style={{ width: 48, height: 48, flexShrink: 0, ...props.style }} {...props}>
        <a className="button wobbleHover container" style={{ maxWidth: 48, maxHeight: 48, borderRadius: 24, padding: 12 }} href={link}>
            <Edit style={{ fill: 'var(--buttonText)' }} />
        </a>
    </div>
}
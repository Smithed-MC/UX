import React from 'react'
import { AddToBundle, Edit, RemoveFromBundle } from './svg'

interface AddButtonProps {
    add: boolean,
    onClick?: () => void,
    [key: string]: any
}

export default function AddRemovePackButton({add, onClick, ...props}: AddButtonProps) {
    return <div style={{ width: 48, height: 48, flexShrink: 0, ...props.style }} {...props}>
        <button className="button wobbleHover container" style={{ width: 48, height: 48, borderRadius: 24, padding: 8, boxSizing: 'border-box', backgroundColor: `var(--${add ? 'accent' : 'badAccent'})` }} onClick={onClick} disabled={props.disabled}>
            {add && <AddToBundle style={{ stroke: 'var(--buttonText)' }} />}
            {!add && <RemoveFromBundle style={{ stroke: 'var(--buttonText)' }} />}
        </button>
    </div>
}
import React from 'react'
import { AddToBundle, Edit } from './svg'

interface AddButtonProps {
    link?: string,
    onClick?: () => void,
    [key: string]: any
}

export default function AddButton({link, onClick, ...props}: AddButtonProps) {
    const ButtonType = (props: any) => {
        if(link !== '')
            return <a {...props}/>
        return <button {...props}/>
    }
    return <div style={{ width: 48, height: 48, flexShrink: 0, ...props.style }} {...props}>
        <ButtonType className="button wobbleHover container" style={{ width: 48, height: 48, borderRadius: 24, padding: 8, boxSizing: 'border-box' }} href={link} onClick={onClick}>
            <AddToBundle style={{ stroke: 'var(--buttonText)' }} />
        </ButtonType>
    </div>
}
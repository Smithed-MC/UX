import { ButtonHTMLAttributes, FunctionComponent, InputHTMLAttributes, RefObject, SVGProps, useRef, useState } from "react";
import './IconInput.css'

interface IconTextButtonProps {
    icon?: FunctionComponent<SVGProps<SVGSVGElement>> | string,
    iconElement?: JSX.Element,
    inputRef?: RefObject<HTMLInputElement>
}

export default function IconInput({ icon: IconSvg, iconElement, className, style, inputRef, ...props }: IconTextButtonProps & React.HTMLProps<HTMLInputElement>) {

    return <div className={'container input ' + className} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', ...style }}>
        {(IconSvg || iconElement) && <span className="container" style={{ color: 'var(--border)' }}>
            {IconSvg !== undefined && typeof (IconSvg) === 'string' && IconSvg}
            {IconSvg !== undefined && typeof (IconSvg) !== 'string' && <IconSvg />}
            {iconElement !== undefined && iconElement}
        </span>}
        <input {...props} ref={inputRef} className="childInput" style={{ backgroundColor: 'transparent', border: 'none', fontFamily: 'Lexend', width: '100%', height: '100%', fontSize: '1rem', WebkitUserSelect: 'none', color: 'var(--foreground)' }}></input>
    </div>
}
/// <reference types="vite-plugin-svgr/client" />
import React, { CSSProperties, useRef, useState } from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import { useQueryParams } from 'hooks'

require('./style.css')
require('./NavBar.css')
import { Cross, MenuBars } from './svg.js'

interface NavButtonProps {
    onOpen: () => void
    onClose: () => void,
    style?: CSSProperties
}

var previousState = false;

export function NavButton({ onOpen, onClose, style }: NavButtonProps) {
    const [open, setOpen] = useState(previousState)
    const button = useRef<HTMLButtonElement>(null)
    const animationDuration = 0.5
    const setAnimation = (animation: string) => button.current?.style.setProperty('animation', animation);

    const onInternalButtonClick = () => {
        if (button.current?.style.animation !== '') return;
        setAnimation(`${open ? 'spinRight' : 'spinLeft'} ${animationDuration}s 1`);
        setTimeout(() => { setAnimation('') }, animationDuration * 1000)

        if (open)
            onClose()
        else
            onOpen()

        previousState = !open;
        setOpen(!open)
    }

    return <button ref={button} className={"button" + (!open ? ' navButtonClosed' : '')} style={{
        width: 48, height: 48, borderRadius: 'var(--defaultBorderRadius)', padding: 12, ...style
    }} onClick={onInternalButtonClick}>
        <MenuBars style={{ fill: "var(--foreground)", display: !open ? 'inherit' : 'none' }} />
        <Cross style={{ stroke: "var(--foreground)", display: open ? 'inherit' : 'none' }} />
    </button>
}

interface NavOptionProps {
    SVGComponent: any
    path: string;
    title: string
    navigateTo?: string;
    withSpecialQueryParam?: string;
}

export function NavOption({ SVGComponent, path, title, navigateTo, withSpecialQueryParam }: NavOptionProps) {
    const navigate = useNavigate();
    const queryParams = useQueryParams()
    const pathMatch = useMatch(path);
    const navigatePathMatch = navigateTo ? useMatch(navigateTo) ? true : false : false;
    const [hover, setHover] = useState(false)
    function onClick() {
        navigate(navigateTo ?? path);
    }

    const isOpen = ((pathMatch && (withSpecialQueryParam ? queryParams?.[withSpecialQueryParam] : true)) || navigatePathMatch) ? true : false;
    return <button className={'button container ' + (isOpen ? 'navOptionOpen' : '')} style={{ width: 48, height: 48, overflow: 'visible', zIndex: 10, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }} onClick={onClick}
        onMouseOver={() => setHover(true)} onMouseOut={() => setHover(false)}>
        <div className={'container'} style={{
            display: hover ? 'inherit' : 'none',
            position: 'absolute',
            placeSelf: 'start',
            left: 36,
            zIndex: -2,
            backgroundColor: 'var(--accent)',
            padding: 8, borderRadius: '0 16px 16px 0', paddingLeft: '32px', paddingRight: 12,
            color: 'white',
            animation: 'navbarTooltipEnter 0.4s 1',
            transition: 'transform 0.4s cubic-bezier(0.85, 0, 0.15, 1)',
            width: '100%',
            alignItems: 'end',
            fontSize: '1rem'
        }}>
            {title}
        </div>
        <div className='container' style={{ backgroundColor: isOpen ? 'var(--foreground)' : 'var(--accent)', zIndex: 1, borderRadius: 24, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <SVGComponent style={{ fill: isOpen ? 'var(--accent)' : "var(--foreground)", margin: 12 }} />
        </div>
    </button>
}

export function NavBar({ children }: { children: any }) {
    const [open, setOpen] = useState(previousState)
    const navBarOptions = useRef<HTMLDivElement>(null)

    function onOpen() {
        setOpen(true)
        navBarOptions.current?.style.setProperty('animation', 'navbarPullup 0.5s 1')
    }

    function onClose() {
        const duration = 0.75
        const animation = `navbarSlidedown ${duration}s 1`
        navBarOptions.current?.style.setProperty('animation', animation)
        setTimeout(() => { if (navBarOptions.current?.style.animationName === 'navbarSlidedown') setOpen(false) }, duration * 1000 - 100)
    }

    return (
        <div className="container" style={{flexDirection: 'row', gap: 32, width: '100%', boxSizing: 'border-box', justifyContent: 'safe start'}}>
            <a style={{fontSize: '24px', lineHeight: '30px', fontWeight: '700', fontFamily: 'Lexend', color: 'var(--foreground)', textDecoration: 'none'}} href="/">Smithed</a>
            <div style={{width: 1, height: 36, background: 'var(--foreground)'}}/>
            {children}
        </div>
    )
}

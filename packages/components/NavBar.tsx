/// <reference types="vite-plugin-svgr/client" />
import React, { useRef, useState } from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import { useQueryParams } from 'hooks'

import './style.css'
import './NavBar.css'
import { Cross, MenuBars } from './svg'

interface NavButtonProps {
    onOpen: () => void
    onClose: () => void
}

var previousState = false;

export function NavButton({ onOpen, onClose }: NavButtonProps) {
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

    return <button ref={button} className={"button" + (!open ? ' navButtonClosed': '')} style={{
        width: 64, height: 64, borderRadius: 'var(--defaultBorderRadius)', padding: 12,
    }} onClick={onInternalButtonClick}>
        <MenuBars style={{ fill: "var(--buttonText)", display: !open ? 'inherit' : 'none' }} />
        <Cross style={{ stroke: "var(--buttonText)", display: open ? 'inherit' : 'none' }} />
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
    console.log(queryParams);
    const pathMatch = useMatch(path);
    const navigatePathMatch = navigateTo ? useMatch(navigateTo) ? true : false : false;
    const [hover, setHover] = useState(false)
    function onClick() {
        navigate(navigateTo ?? path);
    }

    const isOpen = ((pathMatch && (withSpecialQueryParam ? queryParams?.[withSpecialQueryParam] : true)) || navigatePathMatch) ? true : false;
    return <button className={'button container ' + (isOpen ? 'navOptionOpen' : '')} style={{ width: 48, height: 48, overflow: 'visible', zIndex: 10, borderRadius: 24 }} onClick={onClick}
        onMouseOver={() => setHover(true)} onMouseOut={() => setHover(false)}>
        <div className={'container'} style={{
            display: hover ? 'inherit' : 'none',
            position: 'absolute',
            placeSelf: 'start',
            left: 30,
            zIndex: -2,
            backgroundColor: 'var(--accent)',
            padding: 8, borderRadius: 16, paddingLeft: '32px', paddingRight: 12,
            color: 'white',
            animation: 'navbarTooltipEnter 0.4s 1',
            transition: 'transform 0.4s cubic-bezier(0.85, 0, 0.15, 1)',
            width: '100%',
            alignItems: 'end',
        }}>
            {title}
        </div>
        <div className='container' style={{ backgroundColor: isOpen ? 'var(--buttonText)' : 'var(--accent)', zIndex: 1, borderRadius: 24, width: 48, height: 48 }}>
            <SVGComponent style={{ fill: isOpen ? 'var(--accent)' : "var(--buttonText)", margin: 12 }} />
        </div>
    </button>
}

export function NavBar({children}: {children: any}) {
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

    return (<div className='container' style={{
        position: 'fixed', bottom: 16, left: 16,
        flexDirection: 'column-reverse',
        gap: 16,
        overflowY: 'hidden',
        overflow: 'visible',
        zIndex: 100
    }}>
        <NavButton onOpen={onOpen} onClose={onClose} />
        <div ref={navBarOptions} className='container' style={{
            display: open ? 'flex' : 'none',
            gap: 8, padding: 8, backgroundColor: 'var(--backgroundAccent)', borderRadius: 'var(--defaultBorderRadius)',
            border: '4px solid var(--background)'
        }}>
            {children}
        </div>
    </div>)
}

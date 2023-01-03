import { NavBar, NavButton, PackCard } from "components";
import React, { useEffect, useRef, useState } from "react";
import { PackEntry } from "data-types"
import PackInfo from "../widget/packInfo";
import { useNavigate } from "react-router-dom";
import './browse.css'

export default function Browse(props: any) {
    const [packs, setPacks] = useState<{ [key: string]: PackEntry }>({})
    const [showWidget, setShowWidget] = useState<string | undefined>(undefined)
    const navigate = useNavigate()
    const rootDiv = useRef<HTMLDivElement>(null)



    function onWindowResize() {
        if (rootDiv.current) {
            if (rootDiv.current.clientWidth < 1024) {
                rootDiv.current.style.setProperty('flex-direction', 'column')
                rootDiv.current.style.setProperty('justify-content', 'center')
                rootDiv.current.style.setProperty('align-items', 'center')
                const packCardContainer = rootDiv.current.getElementsByClassName('packCardContainer')[0] as HTMLDivElement
                packCardContainer.style.width = '80%'

                setShowWidget('')
            }
            else {
                rootDiv.current.style.setProperty('flex-direction', 'row')
                rootDiv.current.style.setProperty('align-items', 'start')
                const packCardContainer = rootDiv.current.getElementsByClassName('packCardContainer')[0] as HTMLDivElement
                packCardContainer.style.width = '40%'
            }
        }
    }

    async function onLoad() {
        onWindowResize()
        window.addEventListener('resize', onWindowResize)

        const response = await fetch('https://api.smithed.dev/getPacks')
        const data = await response.json()
        // console.log(data)
        setPacks(data)
    }
    function onClick(p: string) {
        console.log(rootDiv.current?.clientWidth)
        if (screen.width < 1024) return navigate(`../${p.split(':').join('/')}`)
        setShowWidget(showWidget === p ? undefined : p)
    }
    function getDownloads(p: string) {
        if (packs[p].downloads === undefined) return 0
        let sum = 0
        Object.keys(packs[p].downloads).forEach(d => sum += packs[p].downloads[d])
        return sum
    }

    useEffect(() => { onLoad(); return () => window.removeEventListener('resize', onWindowResize) }, [])

    return <div className="mainDiv" style={{  height: '100vh', top: 0, gap: 32, position: 'absolute', width: '100vw' }}>
        <div className='container' style={{
            alignItems: 'safe start', justifyContent: 'safe center', gap: 32, 
            height: '100%', width: 'calc(100vw - 24px)', 
            flexDirection: 'row', 
            paddingLeft: 16}} 
            ref={rootDiv}
        >
            {!showWidget && <div className="container" style={{ width: '33%' }}>

            </div>}
            <div className="container packCardContainer" style={{ flex: showWidget ? '40%' : '66%', width: '40%', height: '100%' }}>
                <div className="container" style={{ padding: '16px 24px 16px 24px', gap: 16, overflowY: 'auto', overflowX: 'hidden', height: '100%', width: '100%', justifyContent: 'safe start', alignItems: 'safe center' }}>
                    {Object.keys(packs)
                        .filter(p => packs[p].owner !== undefined)
                        .sort((a, b) => getDownloads(a) - getDownloads(b))
                        .reverse()
                        .map(p => <PackCard id={p} packEntry={packs[p]} onClick={() => onClick(p)} style={{border: p === showWidget ? '2px solid var(--accent)' : ''}}/>)
                    }
                </div>
            </div>
            {showWidget && <div className="container" style={{ flex: '60%', height: 'max-content', maxHeight: '100%', width: 'min-content', justifyContent: 'safe start', alignItems: 'safe center', flexGrow:1,  }}>
                <div className="container" style={{ gap: 16, overflowY: 'auto', overflowX: 'hidden', height: '100%', justifyContent: 'safe start', alignItems: 'safe center', padding: '16px 16px 16px 16px', width: 'fit-content'}}>
                    <div className="container" style={{ width: '100%', justifyContent: 'safe center', alignItems: 'safe center' }}>
                        <PackInfo yOffset={window.scrollY} packEntry={packs[showWidget]} id={showWidget} onClose={() => setShowWidget(undefined)} fixed={true} style={{ width: '100%' }} />
                    </div>
                </div>
            </div>}
            {!showWidget && <div className="container rightPanel" style={{ width: '33%' }}>

            </div>}
        </div>
    </div>

}
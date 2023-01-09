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


    async function onLoad() {
        const response = await fetch('https://api.smithed.dev/getPacks')
        const data = await response.json()
        // console.log(data)
        setPacks(data)
    }
    function onClick(p: string) {
        if ((rootDiv.current?.clientWidth ?? 0) < 1024) return navigate(`../${p.split(':').join('/')}`)
        setShowWidget(showWidget === p ? undefined : p)
    }
    function getDownloads(p: string) {
        if (packs[p].downloads === undefined) return 0
        let sum = 0
        Object.keys(packs[p].downloads).forEach(d => sum += packs[p].downloads[d])
        return sum
    }

    useEffect(() => { onLoad(); }, [])

    return <div className="mainDiv" style={{ height: '100%', top: 0, gap: 32, position: 'absolute', width: '100vw' }}>
        <div className={showWidget ? 'browserRootWidget' : 'browserRoot'} ref={rootDiv}>
            {!showWidget && <div className="container" style={{ width: '100%' }}>

            </div>}
            <div className="container packCardContainer" style={{height: '100vh'}}>
                <div className="container" style={{ padding: '16px 16px 16px 16px', gap: 16, overflowY: 'auto', overflowX: 'hidden', height: '100%', boxSizing: 'border-box', width: '100%', justifyContent: 'safe start', alignItems: 'safe center' }}>
                    {Object.keys(packs)
                        .filter(p => packs[p].owner !== undefined)
                        .sort((a, b) => getDownloads(a) - getDownloads(b))
                        .reverse()
                        .map(p => <PackCard id={p} packEntry={packs[p]} onClick={() => onClick(p)} style={{ border: p === showWidget ? '2px solid var(--accent)' : '' }} />)
                    }
                </div>
            </div>
            {showWidget && <div className="container" style={{ height: '100%', boxSizing: 'border-box', justifyContent: 'safe start', alignItems: 'safe center', width: '100%' }}>
                <div className="container" style={{ gap: 16, overflowY: 'auto', overflowX: 'hidden', height: '100%', width: '100%', justifyContent: 'safe start', alignItems: 'safe center', padding: '16px 16px 16px 16px', boxSizing: 'border-box'}}>
                        <PackInfo yOffset={window.scrollY} packEntry={packs[showWidget]} id={showWidget} onClose={() => setShowWidget(undefined)} fixed={true} />
                </div>
            </div>}
            {!showWidget && <div className="container" style={{ width: '100%' }}>

            </div>}
        </div>
    </div>

}
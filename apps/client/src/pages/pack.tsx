import { useParams } from "react-router-dom"
import React, { useEffect, useState } from "react"
import { PackData } from "data-types"
import PackInfo from "../widget/packInfo"
import Download from "../widget/download"
import { Spinner } from "components"
import './pack.css'
export default function Packs() {
    const { owner: owner, id: id } = useParams()
    const [data, setData] = useState<PackData>()
    const [notFound, setNotFound] = useState(false)

    async function onLoad() {
        const response = await fetch(`https://api.smithed.dev/getUserPack?username=${owner}&pack=${id}`)
        if (!response.ok) return setNotFound(true)
        const data = await response.json()
        setData(data)
    }

    useEffect(() => { onLoad() }, [owner, id])


    if (notFound) return <div className="container" style={{ width: '100%', height: '95vh', gap: 8 }}>
        <h1 style={{ color: 'var(--badAccent)', marginBottom: 0 }}>Error 404</h1>
        <label style={{ fontSize: 24, marginBottom: 16 }}>That pack could not be found!</label>
        <a className="button" href="/browse" style={{ padding: 12, borderRadius: 32 }}>Back to Browse</a>
    </div>

    if (data === undefined) return <div className="container" style={{ width: '100%', height: '95vh' }}>
        <Spinner />
    </div>

    return <div className='panelContainer' style={{ height: '100%', overflowX: 'hidden', gap: 32, overflow: "hidden", width: '100vw' }}>
        <div className="container" style={{ overflow: 'auto', height: '100%', padding: '0px 16px', justifyContent: 'safe start', alignItems: 'safe center', width: '100%' }}>
        <div className="container" style={{ width: '100%', padding: '16px 0px 16px 0px', justifyContent: 'safe center', alignItems: 'safe center' }}>
                <PackInfo packData={data} id={owner + ':' + id} onClose={() => { }} yOffset={0} fixed={false} style={{ flex: '66%', flexShrink: 0, width: '100%' }} />
            </div>
        </div>
        {data !== undefined && <div style={{ flex: "33%", paddingRight: 40, paddingTop: 16, overflowY: 'auto', overflowX: 'clip' }} >
            <Download packData={data} id={owner + ':' + id} />
        </div>}
    </div>
}
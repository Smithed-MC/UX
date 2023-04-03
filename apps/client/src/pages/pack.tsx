import { useParams } from "react-router-dom"
import React, { useEffect, useState } from "react"
import { PackData } from "data-types"
import PackInfo from "../widget/packInfo"
import Download from "../widget/download"
import { Spinner } from "components"
import './pack.css'
export default function Packs() {
    const { id: id } = useParams()
    const [data, setData] = useState<PackData>()
    const [notFound, setNotFound] = useState(false)

    async function onLoad() {
        const response = await fetch(`https://api.smithed.dev/v2/packs/${id}`)
        if (!response.ok) return setNotFound(true)
        const data = await response.json()
        setData(data)
    }

    useEffect(() => { onLoad() }, [id])


    if (notFound) return <div className="container" style={{ width: '100%', height: '95vh', gap: 8, boxSizing: 'border-box' }}>
        <h1 style={{ color: 'var(--badAccent)', marginBottom: 0 }}>Error 404</h1>
        <label style={{ fontSize: '1.5rem', marginBottom: 16 }}>That pack could not be found!</label>
        <a className="button" href="/browse" style={{ padding: 12, borderRadius: 'var(--defaultBorderRadius)' }}>Back to Browse</a>
    </div>

    if (data === undefined) return <div className="container" style={{ width: '100%', height: '95vh' }}>
        <Spinner />
    </div>

    return <div className='panelContainer' style={{ width: '100vw', boxSizing: 'border-box' }}>
            <div className="container" style={{ gap: 16, height: '100%', boxSizing: 'border-box', width: '100%', justifyContent: 'safe start', alignItems: 'safe center', padding: 16 }}>
                    <PackInfo yOffset={window.scrollY} id={id ?? ''} fixed={false} onClose={() => {}}/>
            </div>

        {data !== undefined &&
            <div className="container" style={{ width: '100%' }}>
                <div className="container" style={{ padding: '16px 16px 16px 16px', gap: 16, overflowY: 'auto', overflowX: 'hidden', height: '100vh', width: '100%', justifyContent: 'safe start', alignItems: 'safe center', boxSizing: 'border-box' }}>
                    <Download packData={data} id={id ?? ''} style={{ height: 'auto' }} />
                </div>

            </div>
        }
    </div>
}
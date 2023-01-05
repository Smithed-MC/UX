import React, { CSSProperties, RefObject, useEffect, useRef, useState } from 'react'
import { PackData, PackEntry } from 'data-types'
import { formatDownloads } from 'formatters'
import { ReactComponent as QuestionMark } from './assets/question-mark.svg'
import { ReactComponent as Download } from './assets/download.svg'
import { useMatch, useNavigate } from 'react-router-dom'
import './PackCard.css'
import DownloadButton from './DownloadButton'
import Spinner from './Spinner'
import EditButton from './EditButton'

interface PackCardProps {
    id: string,
    packEntry?: PackEntry,
    packData?: PackData,
    editable?: boolean,
    style?: CSSProperties
    onClick?: () => void
}

export default function PackCard({ id, packEntry, packData, onClick, editable, style }: PackCardProps) {
    const [data, setData] = useState<PackData>()
    const [downloads, setDownloads] = useState<number>(0)
    const [fallback, setFallback] = useState(false)
    const [author, setAuthor] = useState('')
    const [loaded, setLoaded] = useState(false)
    const match = useMatch('/browse')
    const card = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()

    async function getData() {
        if (packEntry === undefined) return
        const response = await fetch(`https://api.smithed.dev/getUserPack?uid=${packEntry.owner}&pack=${id.split(':')[1]}`)
        if (!response.ok)
            return void setData(undefined)
        const data = await response.json()
        setData(data)
    }

    async function getAuthor() {
        if (packEntry === undefined) return
        const response = await fetch(`https://api.smithed.dev/getUser?uid=${packEntry.owner}`)
        if (!response.ok)
            return void setAuthor('')
        const data = await response.json()
        setAuthor(data.displayName)
    }


    async function onLoad() {

        if (packEntry === undefined)
            packEntry = await (await fetch(`https://api.smithed.dev/getPack?pack=${id}`)).json()

        if (packData !== undefined) {
            setData(packData)
        }
        else {
            await getData()
        }

        await getAuthor()
        if (packEntry) await getTotalDownloads(packEntry)

        setLoaded(true)
    }

    useEffect(() => { onLoad(); }, [])

    function getTotalDownloads(packEntry: PackEntry) {
        let total = 0
        for (let day in packEntry.downloads) {
            total += packEntry.downloads[day]
        }
        setDownloads(total)
    }

    if (data === undefined || (data.display.hidden && match))
        return <div style={{ display: 'none' }} />

    if (!loaded) return <div className="packCard" style={{ ...style }}>
        <div className='container' style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16, width: '100%' }}>
            <div className="packImage" style={{ display: 'block', backgroundColor: 'var(--background)', borderRadius: 16, overflow: 'hidden', flexBasis: 'max-content', flexShrink: '0' }}>
                <div className='packImage' />
            </div>
            <div className='container fadeOut' style={{ alignItems: 'start', flexGrow: 1, gap: 8, width: '100%' }}>
                <label className='' style={{ fontSize: 24, backgroundColor: 'var(--background)', maxWidth: 256, width: '100%', height: 24 }} />
                <label className='' style={{ fontSize: 24, backgroundColor: 'var(--background)', width: '100%', height: 16 }} />
            </div>
        </div>
    </div>

    return <div className="packCard" key={id} ref={card} onClick={(e) => {
        if (!(e.target instanceof HTMLDivElement || e.target instanceof HTMLLabelElement)) return
        if (onClick) onClick()
    }} style={{ ...style }}>
        <div className='container' style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16, width: '100%' }}>
            <div className="packImage" style={{ display: 'block', backgroundColor: 'var(--background)', borderRadius: 16, overflow: 'hidden', flexBasis: 'max-content', flexShrink: '0' }}>
                {!fallback && <img src={data.display.icon} className="packImage fadeIn" style={{ aspectRatio: '1 / 1', imageRendering: 'pixelated' }} onError={() => setFallback(true)} />}
                {fallback && <QuestionMark className="packImage" style={{ fill: "var(--text)" }} />}
            </div>
            <div className='container fadeIn' style={{ alignItems: 'start', flexGrow: 1, gap: 8, maxWidth: '100%', fontSize: 18 }}>
                <label className='' style={{ fontSize: 24, color: 'var(--accent2)' }}>
                    {data.display.name} <a style={{ fontSize: 16, color: 'var(--subText)', cursor: 'pointer' }} href={'/' + author}>by {author}</a>
                </label>
                {data.display.description}
            </div>
        </div>
        <div className='container downloadBox fadeIn' style={{ height: '100%', flexBasis: 'fit-content', flexShrink: 0, gap: 16 }}>
            <label style={{ fontSize: 24 }}>{formatDownloads(downloads)} <label style={{ fontSize: 16, color: 'var(--subText)' }}>download{downloads === 1 ? '' : 's'}</label></label>
            <div className='container' style={{ flexDirection: 'row', justifyContent: 'right', gap: 8 }}>
                <DownloadButton link={`https://api.smithed.dev/download?pack=${id}`} />
                {editable && <EditButton link={`../edit?pack=${id.split(':')[1]}`} />}
            </div>
        </div>
    </div>
}
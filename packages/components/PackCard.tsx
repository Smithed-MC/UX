import React, { RefObject, useEffect, useRef, useState } from 'react'
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
    editable?: boolean
    onClick?: () => void
}

export default function PackCard({ id, packEntry, packData, onClick, editable }: PackCardProps) {
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

    function onWindowResize() {
        if (card.current) {
            const images = card.current.getElementsByClassName('packImage')
            const downloadBoxes = card.current.getElementsByClassName('downloadBox')

            const width = card.current.getBoundingClientRect().width

            if (width < 480) {
                card.current.style.setProperty('flex-direction', 'column')
                for (let i of images) {
                    const image = i as HTMLImageElement
                    image.style.setProperty('width', '64px');
                    image.style.setProperty('height', '64px');
                }
                for (let d of downloadBoxes) {
                    const downloadBox = d as HTMLDivElement
                    downloadBox.style.setProperty('flex-direction', 'row')
                    downloadBox.style.setProperty('width', '100%')
                    downloadBox.style.setProperty('align-items', 'center')
                    downloadBox.style.setProperty('justify-content', 'center')
                }
            } else {
                card.current.style.setProperty('flex-direction', 'row')

                for (let i of images) {
                    const image = i as HTMLImageElement
                    image.style.setProperty('width', '128px');
                    image.style.setProperty('height', '128px');
                }
                for (let d of downloadBoxes) {
                    const downloadBox = d as HTMLDivElement
                    downloadBox.style.setProperty('flex-direction', 'column')
                    downloadBox.style.setProperty('width', 'min-content')
                    downloadBox.style.setProperty('align-items', 'end')
                    downloadBox.style.setProperty('justify-content', 'start')
                }
            }
        }
    }

    async function onLoad() {

        onWindowResize()
        window.addEventListener('resize', onWindowResize)
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

    useEffect(() => { onLoad(); return () => window.removeEventListener('resize', onWindowResize) }, [])

    function getTotalDownloads(packEntry: PackEntry) {
        let total = 0
        for (let day in packEntry.downloads) {
            total += packEntry.downloads[day]
        }
        setDownloads(total)
    }

    if (data === undefined || (data.display.hidden && match))
        return <div style={{ display: 'none' }} />

    if (!loaded) return <div className='container' style={{ backgroundColor: 'var(--backgroundAccent)', height: 128, borderRadius: 24, width: 128 }}>
        <Spinner style={{ width: 64, height: 64, border: '12px solid var(--text)', borderTop: '12px solid var(--accent)' }} />
    </div>

    return <div className="packCard" key={id} ref={card} onClick={(e) => {
        if (!(e.target instanceof HTMLDivElement || e.target instanceof HTMLLabelElement)) return
        if (onClick) onClick()
    }}>
        <div className='container' style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16, width: '100%' }}>
            <div className="packImage" style={{ display: 'block', backgroundColor: 'var(--background)', borderRadius: 16, overflow: 'hidden', flexBasis: 'max-content', flexShrink: '0' }}>
                {!fallback && <img src={data.display.icon} className="packImage" style={{ aspectRatio: '1 / 1', imageRendering: 'pixelated' }} onError={() => setFallback(true)} />}
                {fallback && <QuestionMark className="packImage" style={{ fill: "var(--text)" }} />}
            </div>
            <div className='container' style={{ alignItems: 'start', flexGrow: 1, gap: 8, width: '100%' }}>
                <label className='' style={{ fontSize: 24, color: 'var(--accent2)' }}>
                    {data.display.name} <a style={{ fontSize: 16, color: 'var(--subText)', cursor: 'pointer' }} href={'/' + author}>by {author}</a>
                </label>
                {data.display.description}
            </div>
        </div>
        <div className='container downloadBox' style={{ height: '100%', flexBasis: 'fit-content', flexShrink: 0, gap: 16 }}>
            <label style={{ fontSize: 24 }}>{formatDownloads(downloads)} <label style={{ fontSize: 16, color: 'var(--subText)' }}>download{downloads === 1 ? '' : 's'}</label></label>
            <div className='container' style={{flexDirection: 'row', justifyContent: 'right', gap: 8}}>
                <DownloadButton link={`https://api.smithed.dev/download?pack=${id}`} />
                {editable && <EditButton link={`../edit?pack=${id.split(':')[1]}`} />}
            </div>
        </div>
    </div>
}
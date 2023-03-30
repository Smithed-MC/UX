import React, { CSSProperties, RefObject, useEffect, useRef, useState } from 'react'
import { PackBundle, PackData, PackEntry, PackVersion } from 'data-types'
import { formatDownloads } from 'formatters'
import { ReactComponent as QuestionMark } from './assets/question-mark.svg'
import { ReactComponent as Download } from './assets/download.svg'
import { useMatch, useNavigate } from 'react-router-dom'
import './PackCard.css'
import DownloadButton from './DownloadButton'
import Spinner from './Spinner'
import EditButton from './EditButton'
import AddRemovePackButton from './AddRemovePackButton'
import { compare, coerce } from 'semver'
import { User } from 'firebase/auth'

interface PackCardProps {
    id: string,
    packEntry?: PackEntry,
    packData?: PackData,
    state?: 'editable' | 'add',
    style?: CSSProperties
    bundleData?: PackBundle
    user?: User | null
    onClick?: () => void,
    [key: string]: any
}

export default function PackCard({ id, packData, onClick, state, style, bundleData, user, ...props }: PackCardProps) {
    const [data, setData] = useState<PackData>()
    const [downloads, setDownloads] = useState<number>(0)
    const [fallback, setFallback] = useState(false)
    const [author, setAuthor] = useState('')
    const [loaded, setLoaded] = useState(false)
    const [contained, setContained] = useState(false)
    const [validForBundle, setValidForBundle] = useState(false)

    console.log(validForBundle)

    const match = useMatch('/browse')
    const card = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()

    async function getData() {
        const response = await fetch(`https://api.smithed.dev/v2/packs/${id}`)
        if (!response.ok)
            return void setData(undefined)
        const data = await response.json()
        setData(data)
    }

    async function getAuthor(ownerId: string) {
        const response = await fetch(`https://api.smithed.dev/v2/users/${ownerId}`)
        if (!response.ok)
            return void setAuthor('')
        const data = await response.json()
        setAuthor(data.displayName)
    }


    async function onLoad() {
        const metaDataResponse = await fetch(`https://api.smithed.dev/v2/packs/${id}/meta`)
        if (!metaDataResponse.ok) {
            setData(undefined)
            return
        }
        const metaData = await metaDataResponse.json()

        await Promise.all([getData(), getAuthor(metaData.owner)])

        setDownloads(metaData.stats.downloads.total)

        setLoaded(true)
        setFallback(false)
    }

    async function onAddClick() {
        console.log('ran')
        if (bundleData === undefined || user == null || data === undefined)
            return

        console.log(id, bundleData.packs)

        if (bundleData.packs.map(p => p.id).includes(id)) {
            bundleData.packs.splice(bundleData.packs.findIndex(p => p.id === id), 1)
            setContained(false)
        } else {
            setContained(true)
            const latestVersion = data?.versions
                .filter(v => v.supports.includes(bundleData.version))
                .sort((a, b) => compare(coerce(a.name) ?? '', coerce(b.name) ?? ''))
                .reverse()[0]

            bundleData.packs.push({
                id: id,
                version: latestVersion.name
            })
        }

        const token = await user.getIdToken()

        await fetch(`https://api.smithed.dev/v2/bundles/${bundleData.uid}?token=${token}`, { method: 'PUT', headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: bundleData }) })
    }

    useEffect(() => { setContained(bundleData?.packs.find(p => p.id === id) !== undefined)}, [bundleData])
    useEffect(() => {
        setValidForBundle(bundleData !== undefined && data?.versions.findIndex(v => v.supports.includes(bundleData.version)) === -1)
    }, [bundleData, data])
    useEffect(() => { onLoad(); }, [id])

    if (data === undefined || (data.display.hidden && match))
        return <div style={{ ...style }} />

    if (!loaded) return <div className="packCard" style={{ ...style }} {...props}>
        <div className='container' style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16, width: '100%' }}>
            <div className="packImage" style={{ display: 'block', backgroundColor: 'var(--background)', borderRadius: 'var(--defaultBorderRadius)', overflow: 'hidden', flexBasis: 'max-content', flexShrink: '0' }}>
                <div className='packImage' />
            </div>
            <div className='container fadeOut' style={{ alignItems: 'start', flexGrow: 1, gap: 8, width: '100%' }}>
                <label className='' style={{ fontSize: 24, backgroundColor: 'var(--background)', maxWidth: 256, width: '100%', height: 24 }} />
                <label className='' style={{ fontSize: 24, backgroundColor: 'var(--background)', width: '100%', height: 16 }} />
            </div>
        </div>
    </div>

    return <div className='cardContainer'>
        <div className="packCard" key={id} ref={card} onClick={(e) => {
            if (!(e.target instanceof HTMLDivElement || e.target instanceof HTMLLabelElement)) return
            if (onClick) onClick()
        }} style={{ ...style }} {...props}>
            <div className='container' style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16, width: '100%', height: '100%' }}>
                <div className="packImage" style={{ display: 'block', backgroundColor: 'var(--background)', borderRadius: 'var(--defaultBorderRadius)', overflow: 'hidden', flexBasis: 'max-content', flexShrink: '0' }}>
                    {!fallback && <img src={data.display.icon} key={data.id} className="packImage fadeIn" style={{ aspectRatio: '1 / 1', imageRendering: 'pixelated' }} onError={() => setFallback(true)} />}
                    {fallback && <QuestionMark className="packImage" style={{ fill: "var(--text)" }} />}
                </div>
                <div className='container fadeIn' style={{ alignItems: 'start', flexGrow: 1, gap: 8, maxWidth: '100%', fontSize: 18, height: '100%', justifyContent: 'start', boxSizing: 'border-box' }}>
                    <label className='' style={{ fontSize: 24, color: 'var(--accent2)' }}>
                        {data.display.name} <a style={{ fontSize: 16, color: 'var(--subText)', cursor: 'pointer' }} href={'/' + author}>by {author}</a>
                    </label>
                    <label className='packDescription'>
                        {data.display.description}
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'end', gap: 8, height: 'max-content' }}>
                        {/* {data.categories?.map(c => <div style={{borderRadius: 'var(--defaultBorderRadius)', backgroundColor: 'var(--accent2)', padding: 8}}>{c}</div>)} */}
                    </div>
                </div>
            </div>
            <div className='container downloadBox fadeIn' style={{ height: '100%', flexBasis: 'fit-content', flexShrink: 0, gap: 16 }}>
                <label style={{ fontSize: 24 }}>{formatDownloads(downloads)} <label style={{ fontSize: 16, color: 'var(--subText)' }}>download{downloads === 1 ? '' : 's'}</label></label>
                <div className='container' style={{ flexDirection: 'row', justifyContent: 'right', gap: 8 }}>
                    {state !== 'add' && <DownloadButton link={`https://api.smithed.dev/v2/download?pack=${id}`} />}
                    {state === 'add' && <AddRemovePackButton add={!contained} onClick={onAddClick} disabled={validForBundle}/>}
                    {state === 'editable' && <EditButton link={`../edit?pack=${id}`} />}
                </div>
            </div>
        </div>
    </div>
}
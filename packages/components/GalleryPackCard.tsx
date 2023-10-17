import React, { CSSProperties, RefObject, useEffect, useRef, useState } from 'react'
import { PackBundle, PackData, PackEntry, PackMetaData, PackVersion } from 'data-types'
import { formatDownloads, prettyTimeDifference } from 'formatters'
import { ReactComponent as QuestionMark } from './assets/question-mark.svg'
import { ReactComponent as Download } from './assets/download.svg'
import { useMatch, useNavigate } from 'react-router-dom'
import './GalleryPackCard.css'
import DownloadButton from './DownloadButton.js'
import Spinner from './Spinner.js'
import EditButton from './EditButton.js'
import AddRemovePackButton from './AddRemovePackButton.js'
import { compare, coerce } from 'semver'
import { User } from 'firebase/auth'
import { IconTextButton } from './IconTextButton.js'
import { Edit, Right } from './svg.js'


interface PackCardProps {
    id: string,
    packEntry?: PackEntry,
    packData?: PackData,
    state?: 'editable' | 'add',
    style?: CSSProperties,
    parentStyle?: CSSProperties,
    bundleData?: PackBundle
    user?: User | null
    onClick?: () => void,
    addWidget?: JSX.Element
    [key: string]: any
}

function CarouselDot({ selected }: { selected?: boolean }) {
    return <div style={{ width: '0.5rem', height: '0.5rem' }} className='container'>
        <svg xmlns="http://www.w3.org/2000/svg" width="9" height="8" viewBox="0 0 9 8" fill="none">
            <circle cx="4.5" cy="4" r="4" fill={selected ? "var(--foreground)" : "var(--border)"} style={{ transition: 'all 0.2s ease-in-out' }} />
        </svg>
    </div>
}

export default function GalleryPackCard({ id, packData, onClick, state, style, parentStyle, bundleData, user, addWidget, ...props }: PackCardProps) {
    const [data, setData] = useState<PackData | undefined>(packData)
    const [metaData, setMetaData] = useState<PackMetaData>()
    const [fallback, setFallback] = useState<boolean>(data?.display.icon !== undefined || data?.display.gallery !== undefined)
    const [author, setAuthor] = useState('')

    const [displayGallery, setDisplayGallery] = useState(false)
    const [currentImage, setCurrentImage] = useState(0)
    const [blur, setBlur] = useState(true)

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

    function updateBlur() {
        const list = card.current?.getClientRects()

        if (list === undefined)
            return

        const onScreen = list[0].top < window.innerHeight + list[0].height && list[0].top + list[0].height > 0
        setBlur(onScreen);

        if(displayGallery && !onScreen) {
            setDisplayGallery(false)
        }
    }

    async function onLoad() {
        const metaDataResponse = await fetch(`https://api.smithed.dev/v2/packs/${id}/meta`)
        if (!metaDataResponse.ok) {
            setData(undefined)
            return
        }
        const metaData = await metaDataResponse.json()

        await Promise.all([getData(), getAuthor(metaData.owner)])

        setMetaData(metaData)

        setFallback(false)

        updateBlur();
    }



    async function onAddClick() {
        console.log('ran')
        if (bundleData === undefined || user == null || data === undefined)
            return

        console.log(id, bundleData.packs)

        if (bundleData.packs.map(p => p.id).includes(id)) {
            bundleData.packs.splice(bundleData.packs.findIndex(p => p.id === id), 1)
            // setContained(false)
        } else {
            // setContained(true)
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

    // useEffect(() => { setContained(bundleData?.packs.find(p => p.id === id) !== undefined) }, [bundleData])
    // useEffect(() => {
    //     if (data === undefined || !(data.versions instanceof Array))
    //         return
    //     setValidForBundle(bundleData !== undefined && data?.versions.findIndex(v => v.supports.includes(bundleData.version)) === -1)
    // }, [bundleData, data])

    useEffect(() => { onLoad(); }, [id])
    useEffect(() => {
        const app = document.getElementById("app")
        if (app == null)
            return

        const content = app.children[0]

        content.addEventListener('scroll', updateBlur)
        window.addEventListener('resize', updateBlur)
        return () => {
            content.removeEventListener('scroll', updateBlur)
            window.removeEventListener('resize', updateBlur)
        }
    }, [])

    // if (data === undefined )
    //     return <div style={{ ...style }} />

    // if (!data || (data.display.hidden && match)) return <div className="packCard" style={{ ...style }} {...props}>
    //     <div className='container' style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16, width: '100%' }}>
    //         <div style={{ display: 'block', width: 32, height: 32, backgroundColor: 'var(--section)', borderRadius: 'var(--defaultBorderRadius)', overflow: 'hidden', flexBasis: 'max-content', flexShrink: '0' }}>
    //             <div className='packCardImage' />
    //         </div>
    //         <div className='container fadeOut' style={{ alignItems: 'start', flexGrow: 1, gap: 8, width: '100%' }}>
    //             <label className='' style={{ fontSize: '1.5rem', backgroundColor: 'var(--background)', maxWidth: 256, width: '100%', height: 24 }} />
    //             <label className='' style={{ fontSize: '1.5rem', backgroundColor: 'var(--background)', width: '100%', height: 16 }} />
    //         </div>
    //     </div>
    // </div>

    return <div className={`galleryPackCardContainer${displayGallery ? ' displayGallery' : ''}`} style={{ ...parentStyle }}>
        <div style={{ height: '100%', width: '100%' }}>
            <div className={`galleryPackCard${displayGallery ? ' displayGallery' : ''}`} key={id} ref={card} onClick={(e) => {
                if (!(e.target instanceof HTMLDivElement || e.target instanceof HTMLLabelElement)) return
                // if (onClick) onClick()
            }} style={{ ...style }} {...props} onMouseLeave={() => {
                setDisplayGallery(false)
                setCurrentImage(0)
            }}>
                <div className='galleryImage' style={{ position: 'relative' }}>
                    {fallback && <div style={{ backgroundColor: 'var(--accent)', width: '100%', height: '100%', flexGrow: 1 }} />}
                    {!data?.display.gallery && !fallback
                        && <img style={{ width: '40rem', WebkitFilter: blur ? 'blur(0.5rem)' : '' }} src={data?.display.icon} onError={(e) => setFallback(true)}
                            onClick={() => {
                                if (!card.current)
                                    return

                                const animation = 'galleryPackCardShake 0.3s ease-in-out'
                                if (card.current.style.animation === animation)
                                    return;

                                card.current.style.setProperty('animation', animation)
                                setTimeout(() => card.current?.style.removeProperty('animation'), 0.4 * 1000)
                            }} />
                    }
                    {data?.display.gallery &&
                        <img className='thumbnail' style={{ width: '100%', cursor: 'pointer' }} src={data?.display.gallery[currentImage]}
                            onClick={() => { setDisplayGallery(!displayGallery) }} />
                    }
                    {displayGallery && data?.display.gallery && <div className='carousel'>
                        <button className='buttonLike'
                            style={{ height: '2.5rem', backgroundColor: 'var(--background)' }}
                            onClick={() => setCurrentImage(Math.max(currentImage - 1, 0))}
                        >
                            <Right style={{ height: '1rem', color: currentImage === 0 ? 'var(--border)' : 'var(--foreground)', scale: '-1' }} />
                        </button>
                        <div className='container' style={{ padding: '1rem 2rem', backgroundColor: 'var(--background)', borderRadius: '2rem', gap: '1rem', flexDirection: 'row' }}>
                            {data?.display.gallery.map((_, i) => <CarouselDot selected={currentImage === i} />)}
                        </div>
                        <button className='buttonLike'
                            style={{ height: '2.5rem', backgroundColor: 'var(--background)' }}
                            onClick={() => setCurrentImage(Math.min(currentImage + 1, (data?.display.gallery?.length ?? 1) - 1))}
                        >
                            <Right style={{ height: '1rem', color: currentImage === data?.display.gallery.length - 1 ? 'var(--border)' : 'var(--foreground)' }} />
                        </button>
                    </div>}
                </div>
                <div className='packInfo'>
                    <span style={{ fontWeight: 600, fontSize: '1.5rem', gridArea: 'name' }}>{data?.display.name}</span>
                    <p className='description' style={{ opacity: displayGallery ? 0 : undefined, width: displayGallery ? 0 : undefined, height: displayGallery ? 0 : undefined, display: displayGallery ? 'none' : undefined }}>{data?.display.description}</p>
                    <span className='author' style={{ opacity: displayGallery ? 0 : undefined, width: displayGallery ? 0 : undefined, height: displayGallery ? 0 : undefined, display: displayGallery ? 'none' : undefined }}>
                        {`by ${author}${data?.categories ? " • " + data?.categories[0] : ''}`}
                    </span>
                    <div className='container' style={{ flexDirection: 'row', gap: '1rem', placeSelf: 'end', gridArea: 'open' }}>
                        {addWidget}
                        <IconTextButton className="accentedButtonLike" text={"Open"} icon={Right} reverse={true} href={`/packs/${id}`} />
                    </div>
                </div>
            </div>
        </div>
    </div>
}

// <div className='container' style={{ flexDirection: 'row', justifyContent: 'right', gap: 8 }}>
//                     {state !== 'add' && <DownloadButton link={`https://api.smithed.dev/v2/download?pack=${id}`} />}
//                     {showInvalidTooltip && <div style={{ position: 'fixed', animation: 'fadeIn 0.5s', marginRight: 40, backgroundColor: 'var(--accent)', padding: 8, paddingRight: 16, borderRadius: 'var(--defaultBorderRadius) 0 0 var(--defaultBorderRadius)' }}>Pack does not support {bundleData?.version}</div>}
//                     {state === 'add' && <AddRemovePackButton add={!contained} onClick={onAddClick} disabled={validForBundle} onMouseOver={() => {
//                         if (validForBundle) setShowInvalidTooltip(true)
//                     }} onMouseOut={() => {
//                         if (validForBundle) setShowInvalidTooltip(false)
//                     }} />}
//                     {state === 'editable' && <EditButton link={`../edit?pack=${id}`} />}
//                 </div>

// 3_4_0
// breaking
// true
// downloads
// datapack
// "https://github.com/ICY105/Datapack-Utilities/releases/download/3.4.0/DatapackUtilities_v3.4.0.zip"
// supports
// 0
// "1.18"
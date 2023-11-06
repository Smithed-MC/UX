import { CSSProperties, useMemo, useRef, useState } from 'react'
import { PackBundle, PackData, PackEntry, PackMetaData } from 'data-types'
import { formatDownloads, prettyTimeDifference } from 'formatters'
import './GalleryPackCard.css'
import { compare, coerce } from 'semver'
import { User } from 'firebase/auth'
import { IconTextButton } from './IconTextButton.js'
import { Download, FlagCrossed, Logo, Refresh, Right } from './svg.js'


interface PackCardProps {
    id: string,
    packEntry?: PackEntry,
    packData?: PackData,
    packMeta?: PackMetaData,
    packAuthor?: string,
    state?: 'editable' | 'add',
    style?: CSSProperties,
    parentStyle?: CSSProperties,
    bundleData?: PackBundle
    user?: User | null
    onClick?: () => void,
    addWidget?: JSX.Element
    [key: string]: any
}

function CarouselDot({ selected, onClick }: { selected?: boolean, onClick: () => void }) {
    return <div style={{ width: '0.5rem', height: '0.5rem' }} className='container' onClick={onClick}>
        <svg xmlns="http://www.w3.org/2000/svg" width="9" height="8" viewBox="0 0 9 8" fill="none">
            <circle cx="4.5" cy="4" r="4" fill={selected ? "var(--foreground)" : "var(--border)"} style={{ transition: 'all 0.2s ease-in-out' }} />
        </svg>
    </div>
}

export default function GalleryPackCard({ id, packData, packMeta, onClick, state, style, parentStyle, bundleData, user, addWidget, packAuthor, ref, ...props }: PackCardProps) {
    const [data, setData] = useState<PackData | undefined>(packData)
    const [metaData, setMetaData] = useState<PackMetaData | undefined>(packMeta)
    const [fallback, setFallback] = useState<boolean>(data?.display.icon !== undefined || data?.display.gallery !== undefined)
    const [author, setAuthor] = useState(packAuthor)

    const [badges, setBadges] = useState<JSX.Element[]>([])

    const [displayGallery, setDisplayGallery] = useState(false)
    const [currentImage, setCurrentImage] = useState(0)

    const card = useRef<HTMLDivElement>(null)

    async function getData() {
        if (packData !== undefined)
            return;

        const response = await fetch(import.meta.env.VITE_API_SERVER + `/packs/${id}`)
        if (!response.ok)
            return void setData(undefined)
        const data = await response.json()
        setData(data)
        console.log('data wasn\'t passed')
    }

    async function getAuthor(ownerId: string) {
        if (author !== undefined)
            return;

        const response = await fetch(import.meta.env.VITE_API_SERVER + `/users/${ownerId}`)
        if (!response.ok)
            return void setAuthor('')
        const data = await response.json()
        setAuthor(data.displayName)
    }



    async function onLoad() {
        let owner = ''
        if (metaData === undefined) {
            const metaDataResponse = await fetch(import.meta.env.VITE_API_SERVER + `/packs/${id}/meta`)
            if (!metaDataResponse.ok) {
                setData(undefined)
                return
            }
            const fetchedMeta = await metaDataResponse.json()
            setMetaData(fetchedMeta)
            owner = fetchedMeta.owner
        } else {
            owner = metaData.owner
        }

        await Promise.all([getData(), getAuthor(owner)])

        setFallback(false)

        let badges: JSX.Element[] = []
        if (author === 'Smithed') {
            badges.push(<Logo style={{ width: '1rem', height: '1rem' }} />)
        }
        if (packData?.versions?.every(v => v.downloads.resourcepack === undefined || v.downloads.resourcepack === ''))
            badges.push(<FlagCrossed style={{width: '1rem', height: '1rem'}}/>)

        setBadges(badges)
    }

    useMemo(() => { onLoad(); }, [id])


    return <div ref={ref} className={`galleryPackCardContainer${displayGallery ? ' displayGallery' : ''}`} style={{ ...parentStyle }}>
        <div style={{ height: '100%', width: '100%' }}>
            <div className={`galleryPackCard${displayGallery ? ' displayGallery' : ''}`} key={id} ref={card} onClick={(e) => {
                if (!(e.target instanceof HTMLDivElement || e.target instanceof HTMLLabelElement)) return
            }} style={{ ...style }} {...props} onMouseLeave={() => {
                setDisplayGallery(false)
                setCurrentImage(0)
            }}>
                <div className='galleryImage' style={{ position: 'relative' }}>
                    {fallback && <div style={{ backgroundColor: 'var(--accent)', width: '100%', height: '100%', flexGrow: 1 }} />}
                    {(!data?.display.gallery || data?.display.gallery.length == 0) && !fallback
                        && <img style={{ width: '100%', filter: 'saturate(50%) brightness(50%)' }} src={data?.display.icon} onError={(e) => setFallback(true)}
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
                    {data?.display.gallery && data?.display.gallery.length > 0 &&
                        <img className='thumbnail' style={{ width: '100%', cursor: 'pointer' }} src={data?.display.gallery[currentImage]}
                            onClick={() => { setDisplayGallery(!displayGallery) }} />
                    }
                    {displayGallery && data?.display.gallery && <div className='carousel'>
                        <button className='buttonLike'
                            style={{ height: '2.5rem', backgroundColor: 'var(--background)' }}
                            onClick={() => {
                                if (currentImage == 0) {
                                    setCurrentImage((data?.display.gallery?.length ?? 1) - 1);
                                } else {
                                    setCurrentImage(Math.max(currentImage - 1, 0));
                                }
                            }}
                        >
                            <Right style={{ height: '1rem', color: 'var(--foreground)', scale: '-1' }} />
                        </button>
                        <div className='container' style={{ padding: '1rem 2rem', backgroundColor: 'var(--background)', borderRadius: '2rem', gap: '1rem', flexDirection: 'row' }}>
                            {data?.display.gallery.map((_, i) => <CarouselDot key={"carouselDot" + i} selected={currentImage === i} onClick={() => setCurrentImage(i)} />)}
                        </div>
                        <button className='buttonLike'
                            style={{ height: '2.5rem', backgroundColor: 'var(--background)' }}
                            onClick={() => {
                                if (currentImage == (data?.display.gallery?.length ?? 1) - 1) {
                                    setCurrentImage(0);
                                } else {
                                    setCurrentImage(Math.min(currentImage + 1, (data?.display.gallery?.length ?? 1) - 1))
                                }
                            }}
                        >
                            <Right style={{ height: '1rem', color: 'var(--foreground)' }} />
                        </button>
                    </div>}
                </div>
                <div className='packInfo'>
                    <div className="container" style={{ flexDirection: 'row', fontWeight: 600, fontSize: '1.5rem', gridArea: 'name', justifyContent: 'start', width: '100%' }}>
                        {data?.display.name}
                        {!displayGallery && badges.length > 0 && <>
                            <div style={{ flexGrow: 1 }}></div>
                            <div className="container" style={{
                                flexDirection: 'row',
                                backgroundColor: 'var(--bold)', borderRadius: 'var(--defaultBorderRadius)',
                                width: 'min-content', padding: '0.5rem 1rem 0.5rem 1rem',
                                gap: '1rem',
                                maxHeight: '2rem'
                            }}>
                                {badges}
                            </div>
                        </>}
                    </div>
                    <p className='description' style={{ opacity: displayGallery ? 0 : undefined, width: displayGallery ? 0 : undefined, height: displayGallery ? 0 : undefined, display: displayGallery ? 'none' : undefined }}>{data?.display.description}</p>
                    <span className='author' style={{ opacity: displayGallery ? 0 : undefined, width: displayGallery ? 0 : undefined, height: displayGallery ? 0 : undefined, display: displayGallery ? 'none' : undefined }}>
                        {`by `}<a style={{ color: 'var(--text)' }} href={`/${author}`}>{author}</a>{(data?.categories && data.categories.length > 0) ? " • " + data?.categories[0] : ''}
                    </span>
                    <div className='container' style={{ flexDirection: 'row', gap: '1rem', placeSelf: 'end', gridArea: 'open' }}>
                        {addWidget}
                        <IconTextButton className="accentedButtonLike" text={"Open"} icon={Right} reverse={true} href={`/packs/${metaData ? metaData.rawId : id}`} />
                    </div>
                </div>
                <div className='footer'>
                    <Download style={{ width: '1rem', height: '1rem' }} />
                    {formatDownloads(metaData?.stats.downloads.total ?? 0)}
                    <div style={{ width: '0.25rem', height: '0.25rem', backgroundColor: 'var(--foreground)', opacity: 0.5, borderRadius: '50%' }} />
                    <Refresh style={{ width: '1rem', height: '1rem' }} />
                    {prettyTimeDifference(metaData?.stats.updated ?? metaData?.stats.added ?? 0)} ago
                </div>
            </div>
        </div>
    </div>
}

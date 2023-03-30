import { HTTPResponses, PackBundle, PackData, PackDependency, UserData } from 'data-types'
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { formatDownloads } from 'formatters'
import './user.css'
import { PackCard, Spinner } from 'components'
import * as queryString from 'query-string'
import { useFirebaseUser, useQueryParams } from 'hooks'
import { Edit, SignOut } from 'components/svg'
import EditButton from 'components/EditButton'
import { Helmet } from 'react-helmet'
import { getAuth } from 'firebase/auth'
import DownloadButton from 'components/DownloadButton'
import Browse from './browse'

interface UserStats {
    totalDownloads: number,
    dailyDownloads: number
    packs: string[],
    bundles: string[],
    id: string,
}

function CreationButton({ text, onPress }: { text: string, onPress: () => void }) {
    return <div className='container' style={{ gap: 16, flexDirection: 'row', padding: 16, borderRadius: 'var(--defaultBorderRadius)', backgroundColor: 'var(--backgroundAccent)', fontSize: 18 }}>
        {text}
        <button className='button container wobbleHover' style={{ fontSize: 48, width: 48, height: 48, justifyContent: 'center', borderRadius: '50%' }} onClick={onPress}>
            <label>+</label>
        </button>
    </div>
}

function Bundle({ id }: { id: string }) {
    const [rawBundleData, setRawBundleData] = useState<PackBundle | undefined>()
    const [containedPacks, setContainedPacks] = useState<[string, string, string][]>()
    const [showBrowse, setShowBrowse] = useState<boolean>(false)

    async function getPackName(pack: PackDependency): Promise<[string, string, string] | undefined> {
        const resp = await fetch(`https://api.smithed.dev/v2/packs/${pack.id}`)
        if (!resp.ok)
            return undefined
        const data: PackData = await resp.json()

        return [pack.id, data.display.name, pack.version];
    }

    async function loadBundleData() {
        const resp = await fetch(`https://api.smithed.dev/v2/bundles/${id}`)

        if (!resp.ok)
            return

        const data: PackBundle = await resp.json()

        const promises = data.packs.map(p => getPackName(p))
        const results = (await Promise.all(promises)).filter(r => r !== undefined)

        setRawBundleData(data)
        setContainedPacks(results as [string, string, string][])
    }

    useEffect(() => { loadBundleData() }, [id])

    if (rawBundleData === undefined) return <div style={{ display: 'none' }} />

    return <div className='container' style={{flexDirection: 'row', width: '100%', padding: 16, borderRadius: 'var(--defaultBorderRadius)', backgroundColor: 'var(--backgroundAccent)', boxSizing: 'border-box', gap: 16}}>
        
        <div className='container' style={{ alignItems: 'start', gap: 8, flexGrow: 1 }}>
            <label style={{ fontSize: 24, color: 'var(--accent2)' }}>{rawBundleData.name}</label>
            <div style={{ display: 'flex', fontSize: 18, alignItems: 'center', gap: 8 }}>
                Minecraft Version
                <label style={{ backgroundColor: 'var(--background)', padding: 8, boxSizing: 'border-box', borderRadius: 'var(--defaultBorderRadius)' }}>
                    {rawBundleData.version}
                </label>
            </div>
            <label style={{ fontSize: 18 }}>Contained Packs</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {containedPacks?.map(p => <div style={{ display: 'flex', fontSize: 18, backgroundColor: 'var(--background)', alignItems: 'center', gap: 8, padding: 8, borderRadius: 'var(--defaultBorderRadius)' }}>
                    <a style={{ fontSize: 18 }} href={`/packs/${p[0]}`}>{p[1]}</a>
                    v{p[2]}
                </div>)}
            </div>
        </div>
        <div className='container' style={{gridArea: 'options', gap: 16}}>
            <DownloadButton link={`https://api.smithed.dev/v2/bundles/${rawBundleData.uid}/download`}/>
            <EditButton link={`/browse?bundleId=${rawBundleData.uid}`}/>
        </div>

    </div>
}

export default function User() {
    const { owner: userId } = useParams()
    const { uid } = useQueryParams()
    const firebaseUser = useFirebaseUser()
    const editable = uid !== undefined && uid === firebaseUser?.uid
    const navigate = useNavigate()

    const [user, setUser] = useState<UserData>()
    const [userStats, setUserStats] = useState<UserStats>()
    const [loaded, setLoaded] = useState<boolean>()

    async function getDownloads(id: string, packs: string[]) {
        let total = 0;
        let daily = 0;

        const today = new Date().toLocaleDateString(undefined, { timeZone: 'America/New_York' }).replaceAll('/', '-')


        for (let pack of packs) {
            try {
                const packEntry = await (await fetch(`https://api.smithed.dev/v2/packs/${pack}/meta`)).json()
                total += packEntry.stats.downloads.total
                daily += packEntry.stats.downloads.today ?? 0
            } catch {
                console.log(`Pack ${pack}`)
            }

        }
        return [total, daily]
    }

    async function getUserData() {
        setLoaded(false)

        const userDataResponse = await fetch(`https://api.smithed.dev/v2/users/${userId}`)
        if (!userDataResponse.ok) return
        const user = await userDataResponse.json()

        const userPacksResponse = await fetch(`https://api.smithed.dev/v2/users/${userId}/packs`)
        const packIds: string[] = userPacksResponse.ok ? (await userPacksResponse.json()) : []

        const userBundlesResponse = await fetch(`https://api.smithed.dev/v2/users/${userId}/bundles`)
        const bundleIds: string[] = userBundlesResponse.ok ? (await userBundlesResponse.json()) : []

        const [totalDownloads, dailyDownloads] = await getDownloads(userId ?? '', packIds)

        setUser(user)
        setUserStats({
            packs: packIds,
            bundles: bundleIds,
            id: userId ?? '',
            totalDownloads: totalDownloads,
            dailyDownloads: dailyDownloads
        })
        setLoaded(true)
    }

    useEffect(() => { getUserData() }, [userId])

    function Stat({ name, value }: { name: string, value: number | string | undefined }) {
        return <label className='statName'>{name}<br /><label className='statValue'>{value}</label></label>
    }

    if (!loaded) return <div className='container' style={{ width: '100%', height: '100vh', boxSizing: 'border-box' }}><Spinner /></div>
    if (userStats === undefined) return <div></div>
    return <div className='container' style={{ width: '100%', boxSizing: 'border-box', position: 'absolute', top: 0, left: 0, height: '100%', overflowY: 'auto', overflowX: 'hidden', justifyContent: 'safe start' }}>
        <Helmet>
            <title>{user?.displayName}</title>
            <meta name="description" content="User page" />
        </Helmet>
        <div className='container userContentRoot' style={{ gap: 32, padding: 16, boxSizing: 'border-box' }}>
            <div className='flexDirection' style={{ width: '100%', backgroundColor: 'var(--backgroundAccent)', borderRadius: 'var(--defaultBorderRadius)', padding: 32, gap: 16, boxSizing: 'border-box' }}>
                <img src={"data:image/png;base64,"} style={{ width: 128, height: 128, imageRendering: 'pixelated' }} />
                <div className='statContainer' style={{ padding: 16, width: '100%' }}>
                    <div className="container" style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: 32 }}>{user?.displayName}</label>
                        {editable && <div className="container" style={{ flexDirection: 'row', gap: 8 }}>
                            <EditButton />
                            <a href="../account" className="button wobbleHover container" title="Sign Out" onClick={() => { getAuth().signOut() }} style={{ maxWidth: 48, maxHeight: 48, borderRadius: 24, padding: 12 }}>
                                <SignOut style={{ width: 24, height: 24, stroke: 'var(--buttonText)' }} />
                            </a>
                        </div>}

                    </div>
                    <div className='statBoxes container '>
                        <Stat name='Total Packs' value={userStats?.packs?.length ?? 0} />
                        <Stat name='Total Downloads' value={formatDownloads(userStats?.totalDownloads ?? 0)} />
                        <Stat name='Daily Downloads' value={formatDownloads(userStats?.dailyDownloads ?? 0)} />
                    </div>
                </div>
            </div>
            {editable && <CreationButton text={'Create a new pack'} onPress={() => {
                navigate('/edit?new=true')
            }} />}
            {userStats.packs.length > 0 && <div className='container' style={{ gap: 16, width: '100%', justifyContent: 'safe start', boxSizing: 'border-box' }}>
                {userStats?.packs.map(p => <PackCard state={editable ? 'editable' : undefined} id={p} onClick={() => { navigate(p) }} />)}
            </div>}
            {editable && <div className='container' style={{ paddingBottom: 64, width: '100%', gap: 32 }}>
                <h1 style={{ margin: 0 }}>My Pack Bundles</h1>
                <CreationButton text={'Create a new bundle'} onPress={() => {

                }} />
                {userStats.bundles?.map(b => <Bundle key={b} id={b} />)}
            </div>}
        </div>
    </div>
} 
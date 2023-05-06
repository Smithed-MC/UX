import { HTTPResponses, MinecraftVersion, PackBundle, PackData, PackDependency, UserData, supportedMinecraftVersions } from 'data-types'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDownloads } from 'formatters'
import './user.css'
import { PackCard, Spinner, SvgButton } from 'components'
import { useFirebaseUser, useQueryParams } from 'hooks'
import { SignOut, Trash } from 'components/svg'
import EditButton from 'components/EditButton'
import { Helmet } from 'react-helmet'
import { getAuth } from 'firebase/auth'
import DownloadButton from 'components/DownloadButton'
import AddRemovePackButton from 'components/AddRemovePackButton'
import { User as FirebaseUser } from 'firebase/auth'
interface UserStats {
    totalDownloads: number,
    dailyDownloads: number
    packs: string[],
    bundles: string[],
    id: string,
}

function CreationButton({ text, onPress }: { text: string, onPress: () => void }) {
    return <div className='container' style={{ gap: 16, flexDirection: 'row', padding: 16, borderRadius: 'var(--defaultBorderRadius)', backgroundColor: 'var(--backgroundAccent)', fontSize: '1.125rem' }}>
        {text}
        <button className='button container wobbleHover' style={{ fontSize: 48, width: 48, height: 48, justifyContent: 'center', borderRadius: '50%' }} onClick={onPress}>
            <label>+</label>
        </button>
    </div>
}

export function Bundle({ id, editable, showOwner }: { id: string, editable: boolean, showOwner?: boolean }) {
    const [rawBundleData, setRawBundleData] = useState<PackBundle | undefined>()
    const [containedPacks, setContainedPacks] = useState<[string, string, string][]>()
    const [ownerName, setOwnerName] = useState('')
    const [showConfirmation, setShowConfirmation] = useState<boolean>(false)
    const parentElement = useRef<HTMLDivElement>(null)
    const firebaseUser = useFirebaseUser()

    async function getPackName(pack: PackDependency): Promise<[string, string, string] | undefined> {
        const resp = await fetch(`https://api.smithed.dev/v2/packs/${pack.id}`)
        if (!resp.ok)
            return undefined
        const data: PackData = await resp.json()

        return [pack.id, data.display.name, pack.version];
    }
    async function getOwnerName(uid: string) {
        const resp = await fetch(`https://api.smithed.dev/v2/users/${uid}`)
        if (!resp.ok)
            return

        const data: { displayName: string } = await resp.json()

        setOwnerName(data.displayName)
    }

    async function loadBundleData() {
        const resp = await fetch(`https://api.smithed.dev/v2/bundles/${id}`)

        if (!resp.ok)
            return

        const data: PackBundle = await resp.json()

        const promises = data.packs.map(p => getPackName(p))
        const results = (await Promise.all(promises)).filter(r => r !== undefined)

        if (showOwner)
            await getOwnerName(data.owner)

        setRawBundleData(data)
        setContainedPacks(results as [string, string, string][])
    }

    useEffect(() => { loadBundleData() }, [id])

    if (rawBundleData === undefined) return <div style={{ display: 'none' }} />

    return <div className='container' style={{ flexDirection: 'row', width: '100%', padding: 16, borderRadius: 'var(--defaultBorderRadius)', backgroundColor: 'var(--backgroundAccent)', boxSizing: 'border-box', gap: 16 }} ref={parentElement}>

        <div className='container' style={{ alignItems: 'start', gap: 8, flexGrow: 1, justifyContent: 'start', height: '100%' }}>
            <label style={{ fontSize: '1.5rem', color: 'var(--accent2)' }}>{rawBundleData.name}</label>
            {showOwner === true && <div style={{ display: 'flex', fontSize: '1.125rem', alignItems: 'center', gap: 8 }}>
                Created By
                <label style={{ backgroundColor: 'var(--background)', padding: 8, boxSizing: 'border-box', borderRadius: 'var(--defaultBorderRadius)' }}>
                    {ownerName}
                </label>
            </div>}
            <div style={{ display: 'flex', fontSize: '1.125rem', alignItems: 'center', gap: 8 }}>
                Minecraft Version
                <label style={{ backgroundColor: 'var(--background)', padding: 8, boxSizing: 'border-box', borderRadius: 'var(--defaultBorderRadius)' }}>
                    {rawBundleData.version}
                </label>
            </div>
            <label style={{ fontSize: '1.125rem' }}>Contained Packs</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {containedPacks?.map(p => <div style={{ display: 'flex', fontSize: '1.125rem', backgroundColor: 'var(--background)', alignItems: 'center', gap: 8, padding: 8, borderRadius: 'var(--defaultBorderRadius)' }}>
                    <a style={{ fontSize: '1.125rem' }} href={`/packs/${p[0]}`}>{p[1]}</a>
                    {p[2].startsWith('v') ? '' : 'v'}{p[2]}
                </div>)}
                {(containedPacks === undefined || containedPacks.length === 0) && <label style={{ color: 'var(--subText)' }}>No packs added</label>}
            </div>
        </div>
        <div className='container' style={{ gridArea: 'options', gap: 16, display: 'grid', gridTemplateRows: 'auto auto' }}>
            <DownloadButton link={`https://api.smithed.dev/v2/bundles/${rawBundleData.uid}/download`} />
            {editable && <AddRemovePackButton add={true} link={`/browse?bundleId=${rawBundleData.uid}`} />}
            {editable && <SvgButton svg={Trash} buttonStyle={{ backgroundColor: 'var(--badAccent)' }} svgStyle={{ stroke: 'var(--buttonText)' }} onClick={() => {
                setShowConfirmation(true)
            }} />}
        </div>
        {showConfirmation && <div className='container' style={{ position: 'fixed', zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', width: '100%', height: '100%', top: 0, left: 0, justifyContent: 'center', animation: 'fadeInBackground 1s' }}>
            <div className='container' style={{backgroundColor: 'var(--backgroundAccent)', borderRadius: 'var(--defaultBorderRadius)', padding: 16, animation: 'slideInContent 0.5s ease-in-out', border: '4px solid var(--background)', gap: 16}}>
                <h3 style={{margin: 4}}>Are you sure you want to remove "{rawBundleData.name}"?</h3>
                <div className='container' style={{flexDirection: 'row', gap: 16}}>
                    <button className='button' onClick={() => setShowConfirmation(false)}>Cancel</button>
                    <button className='button' onClick={async () => {
                        if(firebaseUser == null)
                            return setShowConfirmation(false)
                        const resp = await fetch(`https://api.smithed.dev/v2/bundles/${rawBundleData.uid}?token=${await firebaseUser.getIdToken()}`, {method: 'DELETE'})
                        if(!resp.ok) {
                            alert(resp.statusText)
                        } else {
                            parentElement.current?.style.setProperty('display', 'none');
                        }
                        setShowConfirmation(false)
                    }} style={{backgroundColor: 'var(--badAccent)'}}>Confirm</button>
                </div>         
            </div>
        </div>}
    </div>
}

function CreateBundle({ user, showModal, addPack }: { user: FirebaseUser, showModal: (value: boolean) => void, addPack: (value: PackBundle) => void }) {
    const [name, setName] = useState<string | undefined>(undefined)
    const [version, setVersion] = useState<MinecraftVersion | undefined>(undefined)

    const navigate = useNavigate()

    const isEnabled = name !== undefined && version !== undefined

    const close = () => {
        showModal(false)
    }
    const finish = async () => {
        close()
        if (version === undefined || name === undefined)
            return undefined

        const bundleData: PackBundle = {
            owner: user.uid,
            version: version,
            name: name,
            packs: [],
            public: false
        }

        const resp = await fetch(`https://api.smithed.dev/v2/bundles?token=${await user.getIdToken()}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                data: bundleData
            })
        })

        if (resp.status !== HTTPResponses.CREATED)
            return undefined

        const { uid } = await resp.json()
        bundleData.uid = uid
        addPack(bundleData)
        return uid
    }
    const finishAndEdit = async () => {
        const uid = await finish()
        if (uid === undefined)
            return
        navigate(`/browse?bundleId=${uid}`)
    }

    return <div className="container" style={{ position: 'fixed', width: '100%', height: '100%', top: 0, left: 0, backgroundColor: 'rgba(0, 0, 0, 50%)', animation: 'fadeInBackground 0.5s' }}>
        <div className='container' style={{ backgroundColor: 'var(--backgroundAccent)', border: '4px solid var(--background)', boxSizing: 'border-box', padding: 16, borderRadius: 'var(--defaultBorderRadius)', gap: 16, animation: 'slideInContent 0.5s ease-in-out' }}>
            <h2 style={{ margin: 0 }}>Create a bundle</h2>
            <input type="text" placeholder='Name...' onChange={(e) => setName(e.currentTarget?.value)} />
            <select onChange={(e) => setVersion(e.currentTarget?.value)}>
                <option value="none" hidden style={{ color: 'var(--subText)' }}>
                    Select a version...
                </option>
                {supportedMinecraftVersions.map(v => <option value={v}>{v}</option>)}
            </select>
            <div className='container' style={{ flexDirection: 'row', width: '100%', gap: 16 }}>
                <button className='button' style={{ backgroundColor: 'var(--badAccent)', width: '33%' }} onClick={close}>
                    Cancel
                </button>
                <button className='button' style={{ width: '33%' }} disabled={!isEnabled} onClick={finish}>
                    Finish
                </button>
                <button className='button' style={{ width: '33%' }} disabled={!isEnabled} onClick={finishAndEdit}>
                    Finish & Edit
                </button>
            </div>
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
    const [showBundleCreationModal, setShowBundleCreationModal] = useState(false)

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
                        <label style={{ fontSize: '2rem' }}>{user?.displayName}</label>
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
                    setShowBundleCreationModal(true)
                }} />
                {showBundleCreationModal && <CreateBundle showModal={setShowBundleCreationModal} addPack={(value: PackBundle) => {
                    userStats.bundles.push(value.uid ?? '')
                    setUserStats(Object.create(userStats))
                }} user={firebaseUser} />}
                {userStats.bundles?.map(b => <Bundle key={b} id={b} editable />)}
            </div>}
        </div>
    </div>
} 
import { HTTPResponses, MinecraftVersion, PackBundle, PackData, PackDependency, UserData, supportedMinecraftVersions } from 'data-types'
import { useEffect, useRef, useState } from 'react'
import { useLoaderData, useNavigate, useParams } from 'react-router-dom'
import { formatDownloads } from 'formatters'
import './user.css'
import { IconInput, IconTextButton, PackCard, Spinner, SvgButton } from 'components'
import { useAppDispatch, useFirebaseUser, useQueryParams } from 'hooks'
import { Account, BackArrow, Check, Clock, Cross, Download, Edit, Folder, Jigsaw, Line, List, NewFolder, SignOut, Trash, Upload } from 'components/svg'
import EditButton from 'components/EditButton'
import { Helmet } from 'react-helmet'
import { getAuth } from 'firebase/auth'
import DownloadButton from 'components/DownloadButton'
import AddRemovePackButton from 'components/AddRemovePackButton'
import { User as FirebaseUser } from 'firebase/auth'
import { prettyTimeDifference } from 'formatters'
import { CreateBundle } from '../widget/bundle'
import { setSelectedBundle } from 'store'

interface UserStats {
    totalDownloads: number,
    dailyDownloads: number
    packs: string[],
    bundles: string[],
    id: string,
}

function CreationButton({ text, onPress }: { text: string, onPress: () => void }) {
    return <div className='container' style={{ gap: 16, flexDirection: 'row', padding: 16, borderRadius: 'var(--defaultBorderRadius)', backgroundColor: 'var(--section)', fontSize: '1.125rem' }}>
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
    const dispatch = useAppDispatch()

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

    return <div className='container' style={{ flexDirection: 'row', width: '100%', padding: 16, borderRadius: 'var(--defaultBorderRadius)', backgroundColor: 'var(--section)', boxSizing: 'border-box', gap: 16 }} ref={parentElement}>

        <div className='container' style={{ alignItems: 'start', gap: '1rem', flexGrow: 1, justifyContent: 'start', height: '100%' }}>
            <div className='container' style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <div>
                    <label style={{ fontSize: '1.5rem', fontWeight: 700 }}>{rawBundleData.name}</label>
                    {showOwner === true && <div style={{ display: 'flex', fontSize: '1.125rem', alignItems: 'center', gap: 8 }}>
                        Created By
                        <label style={{ backgroundColor: 'var(--background)', padding: 8, boxSizing: 'border-box', borderRadius: 'var(--defaultBorderRadius)' }}>
                            {ownerName}
                        </label>
                    </div>}
                    <div style={{ display: 'flex', fontSize: '1.125rem', alignItems: 'center', gap: 8 }}>
                        for version {rawBundleData.version}
                    </div>
                </div>
                <div className='container bundleControls'>
                    {editable && <div className="buttonLike invalidButtonLike bundleControlButton" onClick={() => {
                        setShowConfirmation(true)
                    }}>
                        <Trash fill="var(--disturbing)" />
                    </div>}
                    {editable && <a className='buttonLike highlightButtonLike bundleControlButton' href={`/browse`} onClick={(e) => {
                        dispatch(setSelectedBundle(rawBundleData.uid))
                    }}><NewFolder /></a>}
                    <IconTextButton text={"Download"} iconElement={<Download fill="var(--foreground)" />} className="accentedButtonLike bundleControlButton" reverse={true} href={`https://api.smithed.dev/v2/bundles/${rawBundleData.uid}/download`} />
                </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {containedPacks?.map(p => <div style={{ display: 'flex', backgroundColor: 'var(--highlight)', alignItems: 'center', gap: '1rem', padding: '0.5rem 1rem', borderRadius: 'var(--defaultBorderRadius)' }}>
                    <a className="compactButton" href={`/packs/${p[0]}`}>{p[1]}</a>
                    <div style={{ width: 2, height: '100%', backgroundColor: 'var(--border)' }} />
                    {p[2].startsWith('v') ? '' : 'v'}{p[2]}
                </div>)}
                {(containedPacks === undefined || containedPacks.length === 0) && <label style={{ color: 'var(--subText)' }}>No packs added</label>}
            </div>
        </div>
        {showConfirmation && <div className='container' style={{ position: 'fixed', zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', width: '100%', height: '100%', top: 0, left: 0, justifyContent: 'center', animation: 'fadeInBackground 1s' }}>
            <div className='container' style={{ backgroundColor: 'var(--backgroundAccent)', borderRadius: 'var(--defaultBorderRadius)', padding: 16, animation: 'slideInContent 0.5s ease-in-out', border: '4px solid var(--background)', gap: 16 }}>
                <h3 style={{ margin: 4 }}>Are you sure you want to remove "{rawBundleData.name}"?</h3>
                <div className='container' style={{ flexDirection: 'row', gap: 16 }}>
                    <button className='button' onClick={() => setShowConfirmation(false)}>Cancel</button>
                    <button className='button' onClick={async () => {
                        if (firebaseUser == null)
                            return setShowConfirmation(false)
                        const resp = await fetch(`https://api.smithed.dev/v2/bundles/${rawBundleData.uid}?token=${await firebaseUser.getIdToken()}`, { method: 'DELETE' })
                        if (!resp.ok) {
                            alert(resp.statusText)
                        } else {
                            parentElement.current?.style.setProperty('display', 'none');
                        }
                        setShowConfirmation(false)
                    }} style={{ backgroundColor: 'var(--badAccent)' }}>Confirm</button>
                </div>
            </div>
        </div>}
    </div>
}

function CreateBundleModal({ user, showModal, addPack }: { user: FirebaseUser | null, showModal: (value: boolean) => void, addPack: (value: PackBundle) => void }) {
    const [name, setName] = useState<string | undefined>(undefined)
    const [version, setVersion] = useState<MinecraftVersion | undefined>(undefined)

    const navigate = useNavigate()

    const isEnabled = name !== undefined && version !== undefined

    const close = () => {
        showModal(false)
    }
    

    return <div className="container" style={{ position: 'fixed', width: '100%', height: '100%', top: 0, left: 0, backgroundColor: 'rgba(0, 0, 0, 50%)', animation: 'fadeInBackground 0.5s' }}>
        <div className='container' style={{ backgroundColor: 'var(--background)', border: '2px solid var(--border)', boxSizing: 'border-box', padding: 16, borderRadius: 'var(--defaultBorderRadius)', gap: 16, animation: 'slideInContent 0.5s ease-in-out' }}>
            <CreateBundle close={close} finish={close} showCloseButton showEditButton/>
        </div>
    </div>
}


export default function User() {
    const { owner: userId } = useParams()
    const firebaseUser = useFirebaseUser()
    const navigate = useNavigate()
    const { user, userStats }: { user: UserData, userStats: UserStats } = useLoaderData() as any

    const [editable, setEditable] = useState<boolean>(false)
    const [editingUserData, setEditingUserData] = useState(false)

    const [pfp, setPFP] = useState(user.pfp)
    const [showBundleCreationModal, setShowBundleCreationModal] = useState(false)
    const [showFallbackPFP, setShowFallbackPFP] = useState(false)

    const pfpUploadRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setEditable(userId === firebaseUser?.uid)
    }, [firebaseUser])

    function Stat({ name, value, icon }: { name: string, value: number | string | undefined, icon: any }) {
        return <div className='statDisplay'>
            {icon}
            <div style={{ width: 2, backgroundColor: 'var(--border)', height: '1rem' }} />
            <label className='statText'>{value} {name}{value == 1 ? '' : 's'}</label>
        </div>
    }

    if (userStats === undefined) return <div></div>
    return <div className='container' style={{ width: '100%', boxSizing: 'border-box', height: '100%', overflowY: 'auto', overflowX: 'hidden', justifyContent: 'safe start' }}>
        <Helmet>
            <title>{user?.displayName}</title>
            <meta name="description" content="User page" />
        </Helmet>
        <div className='container userContentRoot' style={{ gap: '4rem', boxSizing: 'border-box', maxWidth: '46.25rem' }}>
            <div className='flexDirection' style={{ width: '100%', backgroundColor: 'var(--backgroundAccent)', borderRadius: 'var(--defaultBorderRadius)', gap: 16, boxSizing: 'border-box' }}>
                <div className='statContainer' style={{ width: '100%' }}>
                    <div className="container" style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className='userIconAndName'>
                            <div style={{ gridArea: 'image', width: 64, height: 64, overflow: 'hidden', borderRadius: 'var(--defaultBorderRadius)', display: 'flex' }}>
                                {!showFallbackPFP && !import.meta.env.SSR && <img src={pfp ?? ""} style={{ width: 64, height: 64, margin: 0 }} width={64} height={64} onError={(e) => setShowFallbackPFP(true)} />}
                                {showFallbackPFP && <div className='userFallbackPFP'><Account style={{ width: 32, height: 32 }} /></div>}

                                {editingUserData && <button style={{ width: 64, height: 64, position: 'absolute', backgroundColor: 'rgba(0,0,0,0.50)' }} onClick={() => {
                                    pfpUploadRef.current?.click()
                                }}>
                                    <Upload fill="var(--foreground)" style={{ width: 32, height: 32 }} />
                                    <input ref={pfpUploadRef} type="file" accept='image/png, image/jpeg' style={{ display: 'none' }} onChange={async (e) => {
                                        const file = e.currentTarget.files?.item(0)

                                        console.log(file);
                                        if (file === undefined || file == null)
                                            return

                                        if (file.size > 1024 * 1024)
                                            return alert('Selected image exceeds 1MB')

                                        const result = await new Promise<string>((resolve) => {
                                            const fileReader = new FileReader()
                                            fileReader.readAsDataURL(file);
                                            fileReader.onloadend = () => {
                                                resolve(fileReader.result as string)
                                            }
                                        })

                                        console.log(result)
                                        setPFP(result)
                                        setShowFallbackPFP(false)
                                    }} />
                                </button>}
                            </div>
                            <label className='userName'>{user?.displayName}</label>
                            <label className='userJoinTime'>Joined {prettyTimeDifference(user?.creationTime ?? 0)} ago</label>
                        </div>
                        {editable && <div className="container profileControlContainer">
                            <a href="../account" className="buttonLike profileControl first" title="Sign Out" onClick={() => { getAuth().signOut() }} >
                                <div style={{ display: 'flex', flexDirection: 'row', gap: 2, width: 16, height: 16, alignItems: 'center' }}>
                                    <BackArrow />
                                    <Line fill="var(--foreground)" />
                                </div>
                            </a>
                            {!editingUserData && <IconTextButton className="accentedButtonLike profileControl last" text={'Edit'} icon={Edit} reverse={true} onClick={() => setEditingUserData(true)} />}
                            {editingUserData && <IconTextButton className="successButtonLike profileControl last" text={'Save'} icon={Check} reverse={true} onClick={async () => {
                                if (firebaseUser == null)
                                    return
                                const resp = await fetch(`https://api.smithed.dev/v2/users/${firebaseUser.uid}?token=${await firebaseUser.getIdToken()}`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({
                                        data: {
                                            pfp: pfp
                                        }
                                    }),
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                })

                                if (!resp.ok)
                                    alert(await resp.text())

                                user.pfp = pfp
                                setEditingUserData(false)
                            }}
                            />}
                            {editingUserData && <button className='buttonLike invalidButtonLike' onClick={() => {
                                setPFP(user.pfp)
                                setShowFallbackPFP(false)
                                setEditingUserData(false)
                            }}><Cross /></button>}
                        </div>}

                    </div>
                    <div className='statBoxes container '>
                        <Stat icon={<Jigsaw fill={'var(--foreground)'} />} name='Total Pack' value={userStats?.packs?.length ?? 0} />
                        <Stat icon={<Download fill={'var(--foreground)'} />} name='Total Download' value={formatDownloads(userStats?.totalDownloads ?? 0)} />
                        <Stat icon={<Clock fill={'var(--foreground)'} />} name='Daily Download' value={formatDownloads(userStats?.dailyDownloads ?? 0)} />
                    </div>
                </div>
            </div>
            {userStats.packs.length > 0 && <div className='container' style={{ width: '100%', gap: '1rem' }}>
                <div className='container' style={{ flexDirection: 'row', justifyContent: 'start', gap: '0.5rem', width: '100%' }}>
                    <List />
                    <label>Packs:</label>
                    <div style={{ flexGrow: 1 }} />
                    {editable && <a className='compactButton' href="/edit?new=true">+ New</a>}
                </div>
                {userStats?.packs.map(p => <PackCard state={editable ? 'editable' : undefined} id={p} onClick={() => { navigate(`../packs/${p}`) }} />)}
            </div>}
            {userStats.bundles.length > 0 && <div className='container' style={{ width: '100%', gap: '1rem' }}>
                <div className='container' style={{ flexDirection: 'row', justifyContent: 'start', gap: '0.5rem', width: '100%' }}>
                    <Folder />
                    <label>Bundles:</label>
                    <div style={{ flexGrow: 1 }} />
                    {editable && <a className='compactButton' href="" onClick={(e) => {
                        e.preventDefault()
                        setShowBundleCreationModal(true)
                    }}>+ New</a>}
                </div>
                {editable && <div className='container' style={{ width: '100%', gap: '1rem' }}>
                    {showBundleCreationModal && firebaseUser && <CreateBundleModal showModal={setShowBundleCreationModal} addPack={(value: PackBundle) => {
                        navigate('')
                    }} user={firebaseUser} />}
                </div>}
                {userStats.bundles?.map(b => <Bundle key={b} id={b} editable={editable} />)}
            </div>}
        </div>
    </div>
} 
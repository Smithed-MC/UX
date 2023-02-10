import { HTTPResponses, PackData, UserData } from 'data-types'
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { formatDownloads } from 'formatters'
import './user.css'
import { PackCard, Spinner } from 'components'
import * as queryString from 'query-string'
import { useFirebaseUser, useQueryParams } from 'hooks'
import { Edit } from 'components/svg'
import EditButton from 'components/EditButton'
import { Helmet } from 'react-helmet'

interface UserStats {
    totalDownloads: number,
    dailyDownloads: number
    packs: string[],
    id: string,
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


        const [totalDownloads, dailyDownloads] = await getDownloads(userId ?? '', packIds)

        setUser(user)
        setUserStats({
            packs: packIds,
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
            <meta name="description" content="User page"/>
        </Helmet>
        <div className='container userContentRoot' style={{ gap: 32, padding: 16, boxSizing: 'border-box' }}>
            <div className='flexDirection' style={{ width: '100%', backgroundColor: 'var(--backgroundAccent)', borderRadius: 'var(--defaultBorderRadius)', padding: 32, gap: 16, boxSizing: 'border-box' }}>
                <img src={"data:image/png;base64,"} style={{ width: 128, height: 128, imageRendering: 'pixelated' }} />
                <div className='statContainer' style={{ padding: 16, width: '100%' }}>
                    <div className="container" style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: 32 }}>{user?.displayName}</label>
                        {editable && <EditButton />}
                    </div>
                    <div className='statBoxes container '>
                        <Stat name='Total Packs' value={userStats?.packs?.length ?? 0} />
                        <Stat name='Total Downloads' value={formatDownloads(userStats?.totalDownloads ?? 0)} />
                        <Stat name='Daily Downloads' value={formatDownloads(userStats?.dailyDownloads ?? 0)} />
                    </div>
                </div>
            </div>
            {editable && <div className='container' style={{ gap: 16, flexDirection: 'row', padding: 16, borderRadius: 'var(--defaultBorderRadius)', backgroundColor: 'var(--backgroundAccent)', fontSize: 18 }}>
                Create new pack
                <button className='button container wobbleHover' style={{ fontSize: 48, width: 48, height: 48, justifyContent: 'center', borderRadius: '50%' }} onClick={() => {
                    navigate('/edit?new=true')
                }}>
                    <label>+</label>
                </button>
            </div>}
            {userStats.packs.length > 0 && <div className='container' style={{ gap: 16, width: '100%', justifyContent: 'safe start', boxSizing: 'border-box' }}>
                {userStats?.packs.map(p => <PackCard editable={editable} id={p} onClick={() => { navigate(p) }} />)}
            </div>}
        </div>
    </div>
} 
import { NavBar, NavButton, PackCard } from "components";
import React, { useEffect, useRef, useState } from "react";
import { PackBundle, PackEntry, PackVersion, packCategories } from "data-types"
import PackInfo from "../widget/packInfo";
import { useNavigate } from "react-router-dom";
import './browse.css'
import { useFirebaseUser, useQueryParams } from "hooks";
import { Left } from "components/svg";
import { compare } from "semver";
import { getAuth } from "firebase/auth";

export default function Browse(props: any) {
    
    const { search, category, bundleId } = useQueryParams()

    const [categories, setCategories] = useState(new Set(category != null ? typeof category === 'string' ? [category] : category : []))
    const [packs, setPacks] = useState<{ id: string, displayName: string }[]>([])
    const [showWidget, setShowWidget] = useState<string | undefined>(undefined)
    const [bundleData, setBundleData] = useState<PackBundle>()
    const navigate = useNavigate()
    const user = useFirebaseUser()
    const rootDiv = useRef<HTMLDivElement>(null)


    async function updateUrl(search: string | null | (string|null)[]) {
        let url = '?'
        if (search != null && search !== '')
            url += 'search=' + search + '&'
        for(let c of categories.values())
            url += 'category=' + c + '&'
        navigate(url)
    }

    async function getPacksFromAPI() {
        const query: string[] = [
            'limit=20'
        ]

        if (search != null && search !== '')
            query.push('search=' + search as string)

        if (bundleId != null)
            query.push('bundleId=' + bundleId)

        for(let c of categories.values())
            query.push('category=' + encodeURIComponent(c as string))

        const url = 'https://api.smithed.dev/v2/packs?' + query.join('&')
        console.log(url)
        const response = await fetch(url)
        const data = await response.json()
        console.log(data)
        // const elements = document.getElementsByTagName("browsePackCard")
        // for(let e of elements) {
        //     e.remove()
        // }
        setPacks(data)
    }

    async function getBundleData() {
        const resp = await fetch(`https://api.smithed.dev/v2/bundles/${bundleId}`)
        setBundleData(await resp.json())
    }

    async function fetchData() {
        await Promise.all([
            getPacksFromAPI(), 
            bundleId != null ? getBundleData() : undefined
        ])
    }



    function onClick(p: string) {
        if ((rootDiv.current?.clientWidth ?? 0) < 1024) return navigate(`../packs/${p}`)
        setShowWidget(showWidget === p ? undefined : p)
    }

    async function onAddClick(p: string) {
        console.log('ran')
        if(bundleData === undefined || user == null)
            return

        if(bundleData.packs.map(p => p.id).includes(p))
            return

        const resp = await fetch(`https://api.smithed.dev/v2/packs/${p}/versions`)
        const versions: PackVersion[] = await resp.json();

        const latestVersion = versions
            .filter(v => v.supports.includes(bundleData.version))
            .sort((a, b) => compare(a.name, b.name))
            .reverse()[0]

        bundleData.packs.push({
            id: p,
            version: latestVersion.name
        })

        const token = await user.getIdToken()

        await fetch(`https://api.smithed.dev/v2/bundles/${bundleId}?token=${token}`, {method: 'PATCH', body: JSON.stringify({data: bundleData})})
    }

    useEffect(() => { fetchData(); }, [search, categories.size])

    return <div className="mainDiv" style={{ height: '100vh', top: 0, gap: 32, position: 'absolute', width: '100vw' }}>
        <div className="container">
            <a href="/account" className="button">
                <Left style={{fill: 'var(--text)'}}/>
            </a>
        </div>
        <div className={showWidget ? 'browserRootWidget' : 'browserRoot'} ref={rootDiv}>
            {!showWidget && <div className="container" style={{ width: '100%' }}>

            </div>}
            <div className="container packCardContainer" style={{ height: '100vh', padding: 16, gap: 16 }}>
                <div className="container" style={{ width: '100%', maxWidth: 512, boxSizing: "border-box", gap: 16 }}>
                    <input placeholder="Search..." style={{ backgroundColor: 'var(--backgroundAccent)', width: '100%', color: 'var(--text)' }} defaultValue={search != null ? search as string : undefined} onChange={(e) => {

                        updateUrl(e.target.value.replaceAll(' ', '+'));

                    }} />
                    <div className="container" style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly' }}>
                        {packCategories.map((c) => <div style={{ display: 'flex', alignItems: 'baseline', flexDirection: 'row' }}><input type="checkbox" defaultChecked={categories.has(c)} onChange={(e) => {
                            const val = e.currentTarget.checked;
                            if(val)
                                categories.add(c)
                            else
                                categories.delete(c);
                            updateUrl(search)
                        }} />{c}</div>)}
                    </div>
                </div>
                <div className="container" id="packCardContainer" style={{ gap: 16, overflowY: 'auto', overflowX: 'hidden', height: '100%', boxSizing: 'border-box', width: '100%', justifyContent: 'safe start', alignItems: 'safe center' }}>
                    {packs
                        .map(p => <PackCard tag="browsePackCard" 
                            key={p.id} id={p.id} state={bundleId != null ? 'add' : undefined} 
                            onClick={() => onClick(p.id)} 
                            style={{ border: p.id === showWidget ? '2px solid var(--accent)' : '' }}
                            onAddClick={bundleId == null ? undefined : () => onAddClick(p.id)}
                        />)
                    }
                </div>
            </div>
            {showWidget && <div className="container packCardContainer" style={{ height: '100vh', padding: 16, gap: 16 }}>
                <div className="container" style={{ gap: 16, overflowY: 'auto', overflowX: 'hidden', height: '100%', boxSizing: 'border-box', width: '100%', justifyContent: 'safe start', alignItems: 'safe center' }}>
                    <PackInfo yOffset={window.scrollY} id={showWidget} onClose={() => setShowWidget(undefined)} fixed={true} />
                </div>
            </div>}
            {!showWidget && <div className="container" style={{ width: '100%' }}>

            </div>}
        </div>
    </div>

}
import { NavBar, NavButton, PackCard, FilterButton } from "components";
import React, { useEffect, useRef, useState } from "react";
import { PackBundle, PackEntry, PackVersion, packCategories } from "data-types"
import PackInfo from "../widget/packInfo";
import { useNavigate } from "react-router-dom";
import './browse.css'
import { useFirebaseUser, useQueryParams } from "hooks";
import { Left } from "components/svg";
import { coerce, compare } from "semver";
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
    
    let currentLoaded = 0;
    let updatingPacks = false;


    async function updateUrl(search: string | null | (string | null)[]) {
        let url = '?'
        let searchUrl = []
        if (search != null && search !== '')
            searchUrl.push('search=' + search)

        let bundleIdUrl = []
        if (bundleId != null)
            bundleIdUrl.push('bundleId=' + bundleId)

        let categoriesurl = []
        for (let c of categories.values())
            categoriesurl.push('category=' + c)

        url += searchUrl.join('&') + bundleIdUrl.join('&') + categoriesurl.join('&')
        navigate(url)
    }

    async function getPacksFromAPI() {
        const url = createUrlFromVariables();
        const response = await fetch(url)
        const data = await response.json()
        // const elements = document.getElementsByTagName("browsePackCard")
        // for(let e of elements) {
        //     e.remove()
        // }
        setPacks(data)
    }

    function createUrlFromVariables() {
        const query: string[] = [
            'limit=20',
            'start=' + currentLoaded
        ];

        if (search != null && search !== '')
            query.push('search=' + search as string);

        for (let c of categories.values())
            query.push('category=' + encodeURIComponent(c as string));

        const url = 'https://api.smithed.dev/v2/packs?' + query.join('&');
        return url;
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

    async function onScroll(e: React.UIEvent<HTMLDivElement, UIEvent>) {
        if(updatingPacks)
            return
        const scrollPosition = e.currentTarget.scrollTop
        const scrollHeight = e.currentTarget.scrollHeight
        console.log(e.currentTarget.offsetHeight, scrollHeight, scrollPosition)

        if (scrollPosition/scrollHeight < 0.60)
            return

        updatingPacks = true;

        currentLoaded += 20
        const url = createUrlFromVariables()

        const response = await fetch(url)
        const data: {id: string, displayName: string}[] = (await response.json())
        
        if(data.filter(d => packs.find(p => p.id === d.id) === undefined).length === data.length) {
            updatingPacks = false;
            setPacks(packs.concat(data))
        }
    }

    function onClick(p: string) {
        if ((rootDiv.current?.clientWidth ?? 0) < 1024) return navigate(`../packs/${p}`)
        setShowWidget(showWidget === p ? undefined : p)
    }

    useEffect(() => { fetchData(); }, [search, categories.size])

    // return <div className="container" style={{ 
    //     height: '100%', width: '100%', 
    //     position: 'absolute', backgroundColor: 'red', top: 0, left: 0,
    //     justifyContent: 'safe start',
    //     alignItems: 'safe start'
    // }}>
    //     <div className="container" style={{justifyContent: 'safe start', height: '100%', overflow: 'hidden'}}>
    //         <div>
    //             Search stuff here
    //         </div>
    //         <div className="container" style={{flexGrow: 1, overflow: 'auto', justifyContent: 'safe start'}}>
    //             Scrollable<br/>
    //             Last Scrollable<br/>
    //         </div>
    //     </div>
    // </div>


    return <div className="container" style={{
        height: '100%', width: '100%',
        position: 'absolute', top: 0, left: 0,
        justifyContent: 'safe start',
        alignItems: 'safe start',
        boxSizing: 'border-box',
    }}>
        <div className="container" style={{
            boxSizing: 'border-box', minHeight: 48,
            height: 'max(3vw, 3vh)', width: '100%', flexDirection: 'row', gap: 8, justifyContent: 'left',
            paddingLeft: 8,
            display: bundleId != null ? 'flex' : 'none'
        }}>
            <a href="/account" className="button container" style={{ minHeight: 32, height: 'max(2vw, 2vh)', minWidth: 32, width: 'max(2vw, 2vh)', boxSizing: 'border-box' }}>
                <Left style={{ fill: 'var(--text)', height: '100%', width: '100%', position: 'absolute', marginRight: 4 }} />
            </a>
            <h3>Back to Account</h3>
        </div>
        <div className={showWidget ? 'browserRootWidget' : 'browserRoot'} ref={rootDiv} style={{
            paddingBottom: bundleId != null ? 'max(3vw, 3vh)' : ''
        }}>
            {!showWidget && <div className="container" style={{ width: '100%' }}>

            </div>}
            <div className="container packCardContainer" style={{ padding: 16, gap: 16, overflow: 'hidden', justifyContent: 'safe start', alignItems: 'safe center', height: '100%' }}>
                <div className="container" style={{ width: '100%', maxWidth: 512, boxSizing: "border-box", gap: 16 }}>
                    <input placeholder="Search..." style={{ backgroundColor: 'var(--backgroundAccent)', width: '100%', color: 'var(--text)' }} defaultValue={search != null ? search as string : undefined} onChange={(e) => {

                        updateUrl(e.target.value.replaceAll(' ', '+'));

                    }} />
                    <div className="container" style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly' }}>
                        {packCategories.map((cat) => <FilterButton onClick={() => {
                            console.log(categories);
                            const val = categories.has(cat)
                            console.log(val)
                            if (!val)
                                categories.add(cat)
                            else
                                categories.delete(cat);
                            updateUrl(search)
                        }} >{cat}</FilterButton>)}
                    </div>
                </div>
                <div className="container" id="packCardContainer" style={{ gap: 16, overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box', width: '100%', justifyContent: 'safe start', alignItems: 'safe center' }} onScroll={(e) => onScroll(e)}>
                    {
                        packs.map(p => <PackCard tag="browsePackCard"
                            key={p.id} id={p.id} state={bundleId != null ? 'add' : undefined}
                            onClick={() => onClick(p.id)}
                            style={{ border: p.id === showWidget ? '2px solid var(--accent)' : '' }}
                            bundleData={bundleData}
                            user={user}
                        />)
                    }
                </div>
            </div>
            {showWidget &&
                <div className="container packCardContainer" style={{ padding: 16, gap: 16, overflow: 'hidden', justifyContent: 'safe start', alignItems: 'safe center', height: '100%' }}>
                    <div className="container" style={{ gap: 16, overflowY: 'auto', overflowX: 'hidden', height: '100%', boxSizing: 'border-box', width: '100%', justifyContent: 'safe start', alignItems: 'safe center' }}>
                        <PackInfo yOffset={window.scrollY} id={showWidget} onClose={() => setShowWidget(undefined)} fixed={true} />
                    </div>
                </div>}
            {!showWidget && <div className="container" style={{ width: '100%' }}>

            </div>}
        </div>
    </div>

}
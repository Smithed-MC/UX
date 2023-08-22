import { NavBar, NavButton, PackCard, FilterButton, IconInput, ChooseBox } from "components";
import React, { useEffect, useRef, useState } from "react";
import { PackBundle, PackData, PackEntry, PackVersion, SortOptions, packCategories, supportedMinecraftVersions } from "data-types"
import PackInfo, { AddToBundleModal } from "../widget/packInfo.js";
import { useLoaderData, useNavigate } from "react-router-dom";
import './browse.css'
import { useAppDispatch, useAppSelector, useFirebaseUser, useQueryParams } from "hooks";
import { Left, Browse as BrowseSvg, Plus } from "components/svg.js";
import { coerce, compare } from "semver";
import { getAuth } from "firebase/auth";
import { BundlePageData } from "../loaders.js";
import { useSelector } from "react-redux";
import { selectSelectedBundle, selectUsersBundles, setSelectedBundle } from "store";
import { Helmet } from "react-helmet";


export default function Browse(props: any) {

    const { search, category, sort, version } = useQueryParams()

    const selectedBundle = useAppSelector(selectSelectedBundle)
    const bundles = useAppSelector(selectUsersBundles)
    // console.log(bundles)

    const dispatch = useAppDispatch()

    const [categories, setCategories] = useState(new Set(category != null ? typeof category === 'string' ? [category] : category : []))
    const [versions, setVersions] = useState(new Set(version != null ? typeof version === 'string' ? [version] : version : []))

    const [packs, setPacks] = useState<{id: string, pack: PackData}[]>([])
    const [showWidget, setShowWidget] = useState<string | undefined>(undefined)
    const [packSort, setPackSort] = useState(sort)

    const [addPack, setAddPack] = useState<string|undefined>(undefined)


    const navigate = useNavigate()
    const user = useFirebaseUser()
    const rootDiv = useRef<HTMLDivElement>(null)

    let currentLoaded = 0;
    let updatingPacks = false;


    async function updateUrl(search: string | null | (string | null)[]) {
        let url = '?'
        let queries = []
        if (search != null && search !== '')
            queries.push('search=' + search)

        if (packSort != null)
            queries.push('sort=' + packSort)

        for (let c of categories.values())
            queries.push('category=' + c)

        for (let v of versions.values())
            queries.push('version=' + v)

        url += queries.join('&')
        navigate(url)
    }

    const getPackData = async (id:string) => {
        const resp = await fetch(`https://api.smithed.dev/v2/packs/${id}`)
        return {id, pack: await resp.json()}
    }


    async function getPacksFromAPI() {
        const url = createUrlFromVariables();
        const response = await fetch(url)
        const data: { id: string, displayName: string }[] = await response.json()
        // const elements = document.getElementsByTagName("browsePackCard")
        // for(let e of elements) {
        //     e.remove()
        // }


        setPacks(await Promise.all(data.map(d => getPackData(d.id))))
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

        for (let v of versions.values())
            query.push('version=' + encodeURIComponent(v as string));

        if (packSort != null && packSort !== '')
            query.push('sort=' + packSort)

        const url = 'https://api.smithed.dev/v2/packs?' + query.join('&');
        return url;
    }

    // async function getBundleData() {
    //     const resp = await fetch(`https://api.smithed.dev/v2/bundles/${bundleId}`)
    //     setBundleData(await resp.json())
    // }

    async function fetchData() {
        await Promise.all([
            getPacksFromAPI()
        ])
    }

    async function onScroll(e: React.UIEvent<HTMLDivElement, UIEvent>) {
        if (updatingPacks)
            return
        const scrollPosition = e.currentTarget.scrollTop
        const scrollHeight = e.currentTarget.scrollHeight
        // console.log(e.currentTarget.offsetHeight, scrollHeight, scrollPosition)

        if (scrollPosition / scrollHeight < 0.60)
            return

        updatingPacks = true;

        currentLoaded += 20
        const url = createUrlFromVariables()

        const response = await fetch(url)
        const data: { id: string, displayName: string }[] = (await response.json())

        if (data.filter(d => packs.find(p => p.id === d.id) === undefined).length === data.length) {
            updatingPacks = false;
            setPacks(packs.concat(await Promise.all(data.map(d => getPackData(d.id)))))
        }
    }

    function onClick(p: string) {
        if ((rootDiv.current?.clientWidth ?? 0) < 1024) return navigate(`../packs/${p}`)
        setShowWidget(showWidget === p ? undefined : p)
    }

    useEffect(() => { fetchData(); updateUrl(search) }, [search, categories.size, packSort, versions.size])

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


    return <div className="container" style={{ width: '100%', boxSizing: 'border-box', height: '100%', justifyContent: 'safe start', gap: 32 }}>
        <Helmet>
            <title>Browse</title>
            <meta name="description" content="Search for datapacks"/>
        </Helmet>
        <div className="container" style={{ gap: '1rem', width: '100%', maxWidth: '46.25rem' }}>
            <div className="container" style={{ width: '100%', boxSizing: "border-box", gap: 16 }}>
                <div className="container" style={{ flexDirection: 'row', width: '100%', gap: 16 }}>
                    <IconInput icon={BrowseSvg} placeholder="Search..." type="text" style={{ width: '100%', flexGrow: 1 }} defaultValue={search != null ? search as string : undefined}
                        onChange={(e) => {
                            updateUrl(e.currentTarget.value.replaceAll(' ', '+'));
                        }} />
                    <ChooseBox placeholder="Sort" className="success" style={{ maxWidth: '13rem', zIndex: 3 }} defaultValue={(sort == null ? 'downloads' : sort) as string} choices={Object.keys(SortOptions).map(opt => ({ value: opt.toLowerCase(), content: opt }))} onChange={v => {
                        if (typeof v === 'string')
                            setPackSort(v)
                    }} />
                </div>
                <div className="container" style={{ flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', gap: '1rem' }}>
                    <ChooseBox placeholder="Category" style={{ flexGrow: 1, zIndex: 2 }} defaultValue={Array.from(categories.values()).filter(c => c != null).map(c => c as string)} choices={packCategories.map(cat => { return { value: cat, content: cat } })} multiselect onChange={(v) => {
                        setCategories(new Set(typeof v === 'string' ? [v] : v))
                    }} />
                    <ChooseBox placeholder="Version" style={{ flexGrow: 1, zIndex: 2 }} defaultValue={Array.from(versions.values()).filter(c => c != null).map(c => c as string)} choices={supportedMinecraftVersions.map(v => { return { value: v, content: v } })} multiselect onChange={(v) => {
                        setVersions(new Set(typeof v === 'string' ? [v] : v))
                    }} />
                </div>
            </div>
            <div className="container cardContainer" id="packCardContainer" style={{ gap: 16, boxSizing: 'border-box', width: '100%', justifyContent: 'safe start', alignItems: 'safe center', flexDirection: 'column', position: 'relative' }} onScroll={(e) => onScroll(e)}>
                {
                    packs.map(p => <PackCard tag="browsePackCard"
                        key={p.id} id={p.id} state={selectedBundle !== '' ? 'add' : undefined}
                        onClick={() => onClick(p.id)}
                        parentStyle={{zIndex: addPack === p.id ? 1 : 0}}
                        style={{  border: p.id === showWidget ? '2px solid var(--accent)' : '' }}
                        bundleData={bundles.find(b => b.uid === selectedBundle)}
                        user={user}
                        addWidget={<AddToBundleModal
                            trigger={
                                <div className="buttonLike" style={{ display: 'flex', backgroundColor: 'var(--highlight)' }} onClick={() => setAddPack(addPack !== p.id ? p.id : '')}>
                                    <Plus />
                                </div>
                            }
                            packData={p.pack}
                            isOpen={addPack === p.id}
                            close={() => setAddPack(undefined)}
                            id={p.id}
                        />}
                    />)
                }
            </div>
        </div>
    </div>

}
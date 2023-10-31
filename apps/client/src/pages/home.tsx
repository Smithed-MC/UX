import { GalleryPackCard, IconTextButton, NavBar, NavButton, PackCard } from "components";
import React, { useEffect, useRef, useState } from "react";
import { PackData } from 'data-types';
import { Browse, Clock, ColoredLogo, Download, Download as DownloadIcon, Globe, Logo, Right, Search, Smithed } from 'components/svg.js'

import launcher_graphic from '../assets/launcher_graphic.png'
import libraries_box from '../assets/libraries_box.png'
import wiki_books from '../assets/wiki_books.png'

import './home.css'

import { useLoaderData, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { HomePageData, DataForPackCards } from "../loaders";


function CategoryHeader({ icon: Icon, text, color, sort }: { icon: any, text: string, color: string, sort: string }) {
    return <div style={{ fontWeight: 600, fontSize: '1rem', display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
        <Icon style={{ width: '1rem', color: `var(--${color})` }} fill={`var(--${color})`} /><a href={`/browse?sort=${sort}`} style={{ color: `var(--${color})` }}>{text}</a>
    </div>
}

const Divider = () => <div style={{ width: '100%', padding: '32px 0px' }}>
    <div style={{ width: '100%', height: 2, backgroundColor: 'var(--border)' }} />
</div>

const SLIDE_TIME = 3000
const TRANSITION_INTERVAL = 12 * 1000

export default function Home(props: any) {
    const { newestPacks, trendingPacks } = useLoaderData() as HomePageData
    const [currentPack, setCurrentPack] = useState(0)
    const [inAnimation, setInAnimation] = useState(true)

    useEffect(() => {
        const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
        const interval = setInterval(async () => {
            setInAnimation(false)
            await sleep(SLIDE_TIME - 50)
            setInAnimation(true)
            setCurrentPack(value => (value + 1) % 5)
        }, TRANSITION_INTERVAL)
        return () => clearInterval(interval)
    }, [])

    console.log(trendingPacks)
    const packCard = (pack: DataForPackCards) => <GalleryPackCard key={pack.id} id={pack.id}packData={pack.pack} packAuthor={pack.author} packMeta={pack.meta} style={{
        border: '2px solid var(--border)', animation: `packShowcaseSlide${inAnimation ? 'In' : 'Out'} ${SLIDE_TIME / 1000}s cubic-bezier(0.65, 0, 0.35, 1)`
    }} />

    return <div className="container" style={{ width: '100%', boxSizing: 'border-box', justifyContent: 'safe start', gap: '4rem', paddingBottom: 80 }}>
        <Helmet>
            <meta name="description" content="Datapacks: the community, the tooling; all bundled into the perfect package" />
        </Helmet>

        <div className="container homeSectionContainer">
            <div className="container" style={{ flexDirection: 'row', padding: '2rem' }}>
                <div className='container'>
                    <span className="homeSectionHeader">
                        WELCOME TO <span style={{ color: "var(--accent)" }}>SMITHED</span>
                    </span>
                    <span style={{ fontSize: '1.5rem', opacity: 0.33, textAlign: 'center' }}>
                        The platform for exploring, sharing and<br />supercharging minecraft data & resource packs.
                    </span>
                </div>
            </div>
        </div>
        <div className="cardCarousel">
            {/* <CategoryHeader icon={Download} text={"Top downloads"} color="success" sort="downloads"/>
            {packCard(downloadedPacks[currentPack])} */}
            <CategoryHeader icon={Globe} text={"Trending today"} color="warning" sort="trending" />
            {packCard(trendingPacks[currentPack])}
            <CategoryHeader icon={Clock} text={"Recently added"} color="secondary" sort="newest" />
            {packCard(newestPacks[currentPack])}
        </div>
        <IconTextButton text={"Explore"} icon={Right} reverse style={{ marginTop: '-2rem' }} href="/browse" />
        <div className="container" style={{ flexDirection: 'row', gap: '1rem', width: '100%' }}>
            <Divider />
            <span style={{ whiteSpace: 'nowrap', fontWeight: 700, fontSize: '2rem' }}>More smithed</span>
            <Divider />
        </div>
        <div className="container homeSectionContainer" style={{ justifyContent: 'center' }}>
            <div className="container" style={{ flexDirection: 'row', justifyContent: 'center', textAlign: 'center' }}>
                <div className='container homeTextContainer' style={{alignItems: 'center', gap: '1rem'}}>
                    <span className="homeSectionHeader" style={{ textAlign: 'center', width: '100%' }}>
                        TRY <span style={{ color: "var(--accent2)" }}>WELD</span>
                    </span>
                    The fastest pack merger in the west. Merge all your data and resource packs into a single zip easily droppable into any world or minecraft instance.                    <br />
                    <IconTextButton className="secondaryAccentButtonLike" text={"weld.smithed.dev"} icon={Globe} href="https://weld.smithed.dev" />
                </div>
            </div>
        </div>
        <Divider />
        <div className="container homeSectionContainer">
            <div className="container" style={{ flexDirection: 'row' }}>
                <div className='container homeTextContainer'>
                    <span className="homeSectionHeader">
                        THE <span style={{ color: "var(--disturbing)" }}>LAUNCHER</span>
                    </span>
                    Tired of having to manually update your datapacks? Merging all the ones you want to play? What about filtering through tons of incompatible content?
                    <br />
                    <br />
                    The Smithed launcher allows you to play datapacks just like you would mods! By using the launcher, conflicts between datapacks are automatically resolved, resourcepacks are automatically applied, and everything is kept separate from your base game. No more cluttered resourcepack folders.
                </div>
                <div className="homeImageContainer">
                    <img src={launcher_graphic} />
                </div>
            </div>
            <IconTextButton className="disturbingButtonLike" text={"Download Experimental"} iconElement={<Download style={{ width: 16, fill: 'var(--foreground)' }} />} style={{ width: 'fit-content' }} href="https://nightly.link/Smithed-MC/UX/workflows/nightly/main" />
        </div>

        <Divider />

        <div className="container homeSectionContainer">
            <div className="container" style={{ flexDirection: 'row' }}>
                <div className='container homeTextContainer'>
                    <span className="homeSectionHeader">
                        THE <span style={{ color: "var(--success)" }}>LIBRARIES</span>
                    </span>
                    We are a set of projects with the express purpose of making datapacks more compatible, easier to manage, and fool proof to install. Smithed is not only a project but a community of passionate people.
                </div>
                <div className="homeImageContainer">
                    <img src={libraries_box} />
                </div>
            </div>
            <IconTextButton className="successButtonLike" text={"Explore libraries"} iconElement={<Browse style={{ width: 16, fill: 'var(--foreground)' }} />} style={{ width: 'fit-content' }} href="/smithed" />
        </div>

        <Divider />

        <div className="container homeSectionContainer">
            <div className="container" style={{ flexDirection: 'row', width: '100%' }}>
                <div className='container homeTextContainer'>
                    <span className="homeSectionHeader">
                        OUR <span style={{ color: "var(--secondary)" }}>WIKI</span>
                    </span>
                    What are libraries without some documentation? The answer: an unusable mess of code. Thankfully, we have some!
                </div>
                <div className="homeImageContainer">
                    <img src={wiki_books} />
                </div>
            </div>
            <IconTextButton className="secondaryButtonLike" text={"Visit wiki"} iconElement={<Globe style={{ width: 16, height: 16, fill: 'var(--foreground)' }} />} style={{ width: 'fit-content' }} href="https://wiki.smithed.dev" />
        </div>
    </div>
}
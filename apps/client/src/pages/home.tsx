import { IconTextButton, NavBar, NavButton, PackCard } from "components";
import React, { useEffect, useRef, useState } from "react";
import { PackData } from "data-types";
import { Browse, Clock, Download, Download as DownloadIcon, Globe, Search, Smithed } from 'components/svg.js'

import logo from '../assets/logo.png'
import launcher_graphic from '../assets/launcher_graphic.png'
import libraries_box from '../assets/libraries_box.png'
import wiki_books from '../assets/wiki_books.png'

import './home.css'

import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";

function SectionContainer({ children, style, className }: { children?: any, style?: React.CSSProperties, className?: string }) {
    return <div className={"container " + className} style={{ padding: 16, ...style }}>
        {children}
    </div>
}

function PackPreview({ type }: { type: 'trending' | 'downloads' | 'newest' }) {
    const [ids, setIds] = useState<string[] | undefined>(undefined)
    const [current, setCurrent] = useState(0)
    const [timer, setTimer] = useState<number | NodeJS.Timer | undefined>(undefined)
    const navigate = useNavigate()
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        (async () => {
            const results: { id: string, displayName: string }[] = (await (await fetch('https://api.smithed.dev/v2/packs?limit=10&hidden=false&sort=' + type)).json()).slice(0, 5)

            results.sort((a, b) => (Math.random() - 0.5) * 2)

            setIds(results.map(m => m.id))

        })()
    }, [])

    useEffect(() => {
        const interval = setInterval(() => {

            cardRef.current?.style.setProperty('animation', 'fadeOut 2s')
            setTimeout(() =>
                setCurrent((prevCounter) => (prevCounter + 1) % (ids?.length ?? 1)), 1900
            )
        }, 8000);

        return () => clearInterval(interval);
    }, [ids]);

    if (ids === undefined) {
        return <div style={{ height: 256 }}></div>
    }


    return <div key={current} ref={cardRef} style={{ flexGrow: 1, width: '100%', animation: 'fadeIn 2s', gridArea: type + 'Preview' }}>
        <PackCard id={ids[current]} style={{ width: '100%', height: '256px', boxSizing: 'border-box' }} onClick={() => navigate(`/packs/${ids[current]}`)} />
    </div>
}


function CategoryHeader({ icon: Icon, text, color }: { icon: any, text: string, color: string }) {
    return <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center', color: `var(--${color})` }}>
        <Icon style={{ width: '1rem' }} fill={`var(--${color})`} /> {text}
    </div>
}

const Divider = () => <div style={{ width: '100%', padding: '32px 0px' }}>
    <div style={{ width: '100%', height: 4, backgroundColor: 'var(--border)' }} />
</div>

export default function Home(props: any) {
    return <div className="container" style={{ width: '100%', boxSizing: 'border-box', justifyContent: 'safe start', gap: 32, paddingBottom: 80 }}>
        <Helmet>
            <meta name="description" content="Datapacks: the community, the tooling; all bundled into the perfect package"/>
        </Helmet>
        <div className="cardCarousel">
            <CategoryHeader icon={Download} text={"Top downloads"} color="success" />
            <PackCard id="tcc" style={{border: '2px solid var(--border)'}}/>
            <CategoryHeader icon={Globe} text={"Trending today"} color="warning" />
            <PackCard id="tcc" style={{border: '2px solid var(--border)'}}/>
            <CategoryHeader icon={Clock} text={"Recently added"} color="secondary" />
            <PackCard id="tcc" style={{border: '2px solid var(--border)'}}/>
        </div>

        <div className="container homeSectionContainer">
            <div className="container" style={{ flexDirection: 'row' }}>
                <div className='container homeTextContainer'>
                    <label className="homeSectionHeader">
                        WHO ARE <label style={{ color: "var(--accent)" }}>WE</label>
                    </label>
                    We are a set of projects with the express purpose of making datapacks more compatible, easier to manage, and fool proof to install. Smithed is not only a project but a community of passionate people.
                </div>
                <div className="homeImageContainer">
                    <Smithed style={{strokeWidth: 3, stroke: 'black', width: '12rem'}}/>
                </div>
            </div>
            <IconTextButton className="accentedButtonLike" text={"Join the community"} icon={"@"} style={{ width: 'fit-content' }} href="https://smithed.dev/discord" />
        </div>

        <Divider />

        <div className="container homeSectionContainer">
            <div className="container" style={{ flexDirection: 'row' }}>
                <div className='container homeTextContainer'>
                    <label className="homeSectionHeader">
                        THE <label style={{ color: "var(--disturbing)" }}>LAUNCHER</label>
                    </label>
                    Tired of having to manually update your datapacks? Merging all the ones you want to play? What about filtering through tons of incompatible content?
                    <br />
                    <br />
                    The Smithed launcher allows you to play datapacks just like you would mods! By using the launcher, conflicts between datapacks are automatically resolved, resourcepacks are automatically applied and everything is kept separate from your base game. No more cluttered resourcepack folders.
                </div>
                <div className="homeImageContainer">
                    <img src={launcher_graphic} />
                </div>
            </div>
            <IconTextButton className="disturbingButtonLike" text={"Download Experimental"} iconElement={<Download style={{ width: 16, fill: 'var(--foreground)' }} />} style={{ width: 'fit-content' }} href="https://nightly.link/Smithed-MC/UX/workflows/nightly/master" />
        </div>

        <Divider />

        <div className="container homeSectionContainer">
            <div className="container" style={{ flexDirection: 'row' }}>
                <div className='container homeTextContainer'>
                    <label className="homeSectionHeader">
                        THE <label style={{ color: "var(--success)" }}>LIBRARIES</label>
                    </label>
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
                    <label className="homeSectionHeader">
                        OUR <label style={{ color: "var(--secondary)" }}>WIKI</label>
                    </label>
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
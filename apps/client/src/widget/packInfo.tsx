import { tauri } from "@tauri-apps/api";
import { open } from '@tauri-apps/api/shell'
import { IconTextButton, markdownOptions, MarkdownRenderer, Spinner } from "components";
import { Cross, Discord, Download, Github, Globe, Plus, Right, Warning } from "components/svg";
import { MinecraftVersion, MinecraftVersionSchema, PackBundle, PackData, PackEntry, PackMetaData, supportedMinecraftVersions, UserData } from "data-types";
import Markdown, { MarkdownToJSX } from "markdown-to-jsx";
import React, { useEffect, useRef, useState } from "react";
import { useFormAction, useLoaderData, useNavigate } from "react-router-dom";
import './packInfo.css'
import { coerce, compare } from "semver";
import { prettyTimeDifference } from "formatters";
import { useAppDispatch, useAppSelector, useFirebaseUser } from "hooks";
import { selectSelectedBundle, selectUsersBundles, setSelectedBundle, setUsersBundles } from "store";
import { CreateBundle } from "./bundle";
import { Bundle } from "../pages/user";
import { DownloadButtonFn } from "../inject";
import BackButton from "./BackButton";

interface PackInfoProps {
    yOffset: number
    packEntry?: PackEntry
    packData?: PackData
    id: string
    fixed: boolean
    onClose: () => void
    style?: React.CSSProperties
    downloadButton: DownloadButtonFn
    showBackButton: boolean
}

if (!import.meta.env.SSR && window.__TAURI_IPC__ !== undefined && markdownOptions !== undefined) {
    markdownOptions.a = ({ children, ...props }) => (<a {...props} target="_blank" href={undefined} onClick={(e) => { open(props.href ?? '') }}>{children}</a>)
}

export function AddToBundleModal({ trigger, isOpen, close, packData, id }: { trigger: JSX.Element, isOpen: boolean, close: () => void, packData?: PackData, id: string }) {
    const selectedBundle = useAppSelector(selectSelectedBundle)
    const bundles = useAppSelector(selectUsersBundles)

    const dispatch = useAppDispatch()

    const user = useFirebaseUser()

    const [page, setPage] = useState<'mcVersion' | 'packVersion' | 'bundle' | 'createBundle'>(selectedBundle === '' ? "mcVersion" : 'packVersion')
    const [direction, setDirection] = useState<'left' | 'right'>('right')

    const [minecraftVersion, setMinecraftVersion] = useState<MinecraftVersion | undefined>(selectedBundle !== '' ? bundles.find(b => b.uid === selectedBundle)?.version : undefined)
    const [bundle, setBundle] = useState<PackBundle | undefined>(selectedBundle !== '' ? bundles.find(b => b.uid === selectedBundle) : undefined)

    const changePage = (direction: 'left' | 'right') => {
        const pages = [
            'mcVersion',
            'bundle',
            'packVersion'
        ]
        const idx = pages.findIndex(p => p === page)

        const directionNumber = direction === 'left' ? -1 : 1

        if (idx + directionNumber < 0)
            return
        if (idx + directionNumber >= pages.length)
            return

        setPage(pages[idx + directionNumber] as 'mcVersion' | 'packVersion' | 'bundle' | 'createBundle')
        setDirection(direction)
    }

    function WidgetOption({ isOutdated, onClick, children }: { isOutdated: boolean, onClick?: () => void, children?: any }) {
        return <div className={`buttonLike container ${isOutdated ? 'invalidButtonLike' : 'accentedButtonLike'}`}
            style={{ width: '100%', flexDirection: 'row', justifyContent: 'start', gap: '0.5rem' }}
            onClick={onClick}
        >
            {children}
            <div style={{ flexGrow: 1 }} />
            {isOutdated && <Warning style={{ fill: 'var(--disturbing)' }} />}
            <Right style={{ fill: isOutdated ? 'var(--disturbing)' : '' }} />
        </div>
    }

    const SelectMinecraftVersionPage = () => <div className="container addToBundlePage">
        <div className="container" style={{ animationName: 'slideIn' + direction, gap: '1.5rem' }}>

            <div className="container" style={{ gap: '1rem', width: '100%' }}>
                <label style={{ fontWeight: 600 }}>Choose Minecraft version</label>
                {supportedMinecraftVersions
                    .filter((mcVersion) =>
                        packData?.versions.find(v =>
                            v.supports.includes(mcVersion)
                        ) !== undefined
                    ).reverse().map(v => {
                        const sortedVersions = packData?.versions.sort((a, b) => compare(coerce(a.name) ?? '', coerce(b.name) ?? '')).reverse()
                        const attachedVersion = sortedVersions?.find(ver => ver.supports.includes(v))
                        const latestVersion = sortedVersions?.at(0)

                        const isOutdated = latestVersion !== attachedVersion

                        return <WidgetOption isOutdated={isOutdated} onClick={() => {
                            setMinecraftVersion(v)
                            changePage('right')
                        }}>
                            <label style={{ color: isOutdated ? 'var(--disturbing)' : '', fontWeight: 600 }}>{v}</label>
                            <label style={{ opacity: 0.25 }}>
                                {!attachedVersion?.name.startsWith("v") && "v"}{attachedVersion?.name}
                            </label>
                        </WidgetOption>
                    })}
            </div>
            <div className="container compactButton" style={{ flexDirection: 'row', gap: '0.5rem', fontWeight: '700' }} onClick={() => {
                close()
            }}>
                <Right style={{ transform: 'rotate(180deg)' }} />
                Close
            </div>
            <span className="container" style={{ flexDirection: 'row', gap: '0.5rem', color: 'var(--border)', fontSize: '0.75rem', fontWeight: 600 }}>
                <Warning style={{ fill: 'var(--border)', width: '0.75rem', height: '0.75rem' }} />
                Symbol means that the version is outdated
            </span>
        </div>
    </div>
    const SelectPackVersionPage = () => {
        const versions = packData?.versions
            .filter((v) => v.supports.includes(bundle?.version ?? ''))
            .sort((a, b) => compare(coerce(a.name) ?? '', coerce(b.name) ?? ''))
            .reverse()
        return <div className="container addToBundlePage">
            <div className="container" style={{ animationName: 'slideIn' + direction, gap: '1.5rem' }}>
                <div className="container" style={{ gap: '1rem', width: '100%' }}>

                    <label style={{ fontWeight: 600, textAlign: 'center' }}>Choose Datapack version for "{bundle?.name}"</label>
                    {versions?.map((v, idx) => {
                        const isOutdated = idx !== 0

                        return <WidgetOption isOutdated={isOutdated} onClick={async () => {
                            if (bundle === undefined)
                                return

                            const packs = [...bundle.packs]
                            const containedPack = packs.findIndex(p => p.id === id)
                            if (containedPack != -1) {
                                packs.splice(containedPack, 1)
                            }
                            packs.push({
                                id: id,
                                version: v.name
                            })


                            const newData = {
                                ...bundle,
                                packs: packs
                            }
                            // console.log(newData)

                            const resp = await fetch(`https://api.smithed.dev/v2/bundles/${bundle.uid}?token=${await user?.getIdToken()}`, {
                                method: 'PUT',
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    data: newData
                                })
                            })

                            if (!resp.ok)
                                alert(await resp.text())

                            setPage('mcVersion')
                            setDirection('right')

                            const newBundles = [...bundles]
                            newBundles.splice(newBundles.findIndex(b => b.uid === bundle.uid), 1)
                            newBundles.push(newData)

                            dispatch(setUsersBundles(newBundles))
                            dispatch(setSelectedBundle(bundle.uid))
                            close()
                        }}>
                            <label style={{ color: isOutdated ? 'var(--disturbing)' : 'var(--foreground)' }}>{v.name}</label>
                            <label style={{ opacity: 0.25 }}>
                            </label>
                        </WidgetOption>
                    })}
                </div>
                {versions?.length === 0 && <span style={{ color: 'var(--disturbing)' }}>Pack has no versions for {minecraftVersion}</span>}
                <div className="container compactButton" style={{ flexDirection: 'row', gap: '0.5rem', fontWeight: '700' }} onClick={() => {
                    if (versions?.length === 0) {
                        setPage('mcVersion')
                        setDirection('left')
                    } else {
                        changePage('left')
                    }
                }}>
                    <Right style={{ transform: 'rotate(180deg)' }} />
                    Back
                </div>
                <span className="container" style={{ flexDirection: 'row', gap: '0.5rem', color: 'var(--border)', fontSize: '0.75rem', fontWeight: 600 }}>
                    <Warning style={{ fill: 'var(--border)', width: '0.75rem', height: '0.75rem' }} />
                    Symbol means that the version is outdated
                </span>
            </div>
        </div>
    }
    const SelectBundlePage = () => {

        return <div className="container addToBundlePage">
            <div className="container" style={{ animationName: 'slideIn' + direction, gap: '1.5rem' }}>

                <div className="container" style={{ gap: '1rem', width: '100%' }}>
                    <label style={{ fontWeight: 600 }}>Choose Bundle for {minecraftVersion}</label>

                    {bundles
                        .filter((b) => b.version === minecraftVersion)
                        .map((b) => {
                            return <WidgetOption isOutdated={false} onClick={() => {
                                setBundle(b)
                                changePage('right')
                            }}>
                                {b.name}
                            </WidgetOption>
                        })}

                    <IconTextButton icon={Plus} text={"New"} onClick={() => setPage('createBundle')} />
                    <div className="container compactButton" style={{ flexDirection: 'row', gap: '0.5rem', fontWeight: '700' }} onClick={() => {
                        changePage('left')
                    }}>
                        <Right style={{ transform: 'rotate(180deg)' }} />
                        Back
                    </div>
                </div>
            </div>
        </div>
    }

    const CreateBundlePage = () => <div className="container addToBundlePage">
        <CreateBundle minecraftVersion={minecraftVersion} showCloseButton close={() => setPage('bundle')} finish={(bundle) => {
            // console.log(bundle)
            setBundle(bundle)
            setPage('packVersion')
            setDirection('right')
        }} />
    </div>

    return <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {trigger}
        {isOpen && <div style={{ position: 'absolute', display: 'block', zIndex: 100, top: 'calc(100% + 0.5rem)', left: '50%' }}>
            <div className="container" style={{
                width: '25.125rem',
                boxSizing: 'border-box',
                marginLeft: '-50%',
                animation: 'fadeIn 0.25s ease-in-out'
            }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="30" viewBox="0 0 36 30" fill="none">
                    <path d="M18.866 3.5L18 2L17.134 3.5L3.27757 27.5L2.41154 29H4.14359H31.8564H33.5885L32.7224 27.5L18.866 3.5Z" fill="#121213" stroke="#4B4B4B" stroke-width="2" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="34" height="30" viewBox="0 0 34 30" fill="none" style={{ marginTop: -26, zIndex: 1, marginBottom: '-0.25rem' }}>
                    <path d="M17 0L33.8875 29.25H0.112505L17 0Z" fill="#121213" />
                </svg>
                <div>
                    {page === 'mcVersion' && <SelectMinecraftVersionPage />}
                    {page === 'bundle' && <SelectBundlePage />}
                    {page === 'packVersion' && <SelectPackVersionPage />}
                    {page === 'createBundle' && <CreateBundlePage />}
                </div>
            </div>
        </div>}
    </div>
}


export default function PackInfo({ yOffset, packEntry, id, fixed, onClose, style, downloadButton, showBackButton }: PackInfoProps) {
    const loaderData = useLoaderData() as any
    // console.log(loaderData)

    const packData: PackData | undefined = loaderData.packData
    const metaData: PackMetaData | undefined = loaderData.metaData
    const owner: UserData | undefined = loaderData.owner
    const fullview: string = loaderData.fullview

    const [showBundleSelection, setShowBundleSelection] = useState(false)

    const [injectPopup, setInjectPopup] = useState<undefined | JSX.Element>(undefined);

    const parentDiv = useRef<HTMLDivElement>(null)
    const spinnerDiv = useRef<HTMLDivElement>(null)

    return <div className='container packInfoRoot' style={{ width: '100%', gap: '4rem', ...style }}>
        <div className="packPageHeader" style={{}}>
            <div className="packDetailsContainer">
                <img src={packData?.display.icon} style={{ gridArea: 'icon', borderRadius: 'var(--defaultBorderRadius)' }}></img>
                <label style={{ gridArea: 'name', fontSize: '1.5rem', fontWeight: 600 }}>{packData?.display.name}</label>
                <label style={{ gridArea: 'byLine' }}>by <a href={`/${owner?.uid}`}>{owner?.displayName}</a>
                    <label className="packDetailsUpdateInfo">
                        {` ∙ ${metaData?.stats.updated ? 'Updated' : 'Uploaded'} ${prettyTimeDifference(metaData?.stats.updated ?? metaData?.stats.added ?? 0)} ago`}
                    </label>
                </label>
            </div>
            <div className="downloadContainer">

                <AddToBundleModal
                    trigger={
                        <div className="buttonLike" style={{ display: 'flex' }} onClick={() => setShowBundleSelection(true)}>
                            <Plus />
                        </div>
                    }
                    packData={packData}
                    isOpen={showBundleSelection}
                    close={() => setShowBundleSelection(false)}
                    id={id}
                />
                <div className="container" style={{ gap: '0.5rem' }}>
                    {downloadButton(id, (element) => { setInjectPopup(element) }, () => { setInjectPopup(undefined) })}
                    <label style={{ color: 'var(--border)' }}>{(() => {
                        const version = packData?.versions.sort((a, b) => compare(coerce(a.name) ?? '', coerce(b.name) ?? '')).at(-1)

                        if (version?.supports[0] === version?.supports.at(-1))
                            return version?.supports[0]

                        return `${version?.supports[0]} — ${version?.supports.at(-1)}`
                    })()}</label>
                </div>
            </div>
            <div className="userButtonsContainer">
                {showBackButton && <BackButton />}
                {packData?.display.urls?.discord && packData?.display.urls?.discord.length > 0 &&
                    <IconTextButton className={"packInfoMediaButton"} icon={Discord} text={"Join Discord"} href={packData?.display.urls?.discord} />
                }
                {packData?.display.urls?.homepage && packData?.display.urls?.homepage.length > 0 &&
                    <IconTextButton className={"packInfoMediaButton"} iconElement={<Globe fill="var(--foreground)" />} text={"Official website"} href={packData?.display.urls?.homepage} />
                }
                {packData?.display.urls?.source && packData?.display.urls?.source.length > 0 &&
                    <IconTextButton className={"packInfoMediaButton"} icon={Github} text={"Source code"} href={packData?.display.urls?.source} />
                }
                <IconTextButton className="accentedButtonLike packInfoSmallDownload packInfoMediaButton" iconElement={<Download fill="var(--foreground)" />} text={"Download"} href={`https://api.smithed.dev/v2/download?pack=${id}`} rel="nofollow" />
            </div>
        </div>
        <div style={{ maxWidth: '53rem' }}>
            {fullview !== '' && <MarkdownRenderer style={{}}>{fullview.replace(/<!-- HIDE -->([^]*?)<!-- HIDE END -->\n?/g, '')}</MarkdownRenderer>}
        </div>
        {injectPopup}
    </div>
}
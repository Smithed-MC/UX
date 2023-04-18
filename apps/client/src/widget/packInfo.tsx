import { tauri } from "@tauri-apps/api";
import { open } from '@tauri-apps/api/shell'
import { markdownOptions, MarkdownRenderer, Spinner } from "components";
import { Cross } from "components/svg";
import { PackData, PackEntry } from "data-types";
import Markdown, { MarkdownToJSX } from "markdown-to-jsx";
import React, { useEffect, useRef, useState } from "react";
import { useFormAction, useNavigate } from "react-router-dom";
import './packInfo.css'

interface PackInfoProps {
    yOffset: number
    packEntry?: PackEntry
    packData?: PackData
    id: string
    fixed: boolean
    onClose: () => void
    style?: React.CSSProperties
}

if (window.__TAURI_IPC__ !== undefined && markdownOptions.overrides !== undefined) {
    markdownOptions.overrides.a = ({ children, ...props }) => (<a {...props} target="_blank" href={undefined} onClick={(e) => { open(props.href) }}>{children}</a>)
}

export default function PackInfo({ yOffset, packEntry, packData, id, fixed, onClose, style }: PackInfoProps) {
    const [data, setData] = useState<PackData | undefined>()
    const [author, setAuthor] = useState('')
    const [fullviewPage, setFullviewPage] = useState('')
    const parentDiv = useRef<HTMLDivElement>(null)
    const spinnerDiv = useRef<HTMLDivElement>(null)

    async function getData() {
        const response = await fetch(`https://api.smithed.dev/v2/packs/${id}`)
        if (!response.ok)
            return void setData(undefined)
        const data = await response.json()
        console.log(data)
        setData(data)
        return data
    }

    async function getAuthor(id: string) {
        const response = await fetch(`https://api.smithed.dev/v2/users/${id}`)
        if (!response.ok)
            return void setAuthor('')
        const data = await response.json()
        setAuthor(data.displayName)
    }

    function correctGithubLinks(url: string) {
        const matches = /(https:\/\/)?(www\.)?github\.com\/(\S[^\/]+)\/(\S[^\/]+)\/(\S[^\/]+)\/(\S[^?\s]+)/g.exec(url)
        console.log(matches)
        if (matches == null || matches.length === 0)
            return url

        matches.splice(0, 3)
        const user = matches.shift()
        const repo = matches.shift()
        const method = matches.shift()
        if (method !== 'blob')
            return url
        const path = matches.shift()

        return `https://raw.githubusercontent.com/${user}/${repo}/${path}`

    }

    async function getFullViewPage(data: PackData) {
        console.log('Initial URL: ', data.display.webPage)
        if (data.display.webPage === undefined || !data.display.webPage.startsWith('https://')) return setFullviewPage('');
        const response = await (async () => {

            data.display.webPage = correctGithubLinks(data.display.webPage ?? '')
            console.log('Post coercion:', data.display.webPage)
            let resp: any;
            try {
                resp = await fetch(data.display.webPage ?? '', {})
            } catch (err) {
                return;
            }
            if (resp.status !== 200)
                return await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(data.display.webPage ?? '')}`)
            return resp
        })()
        if (!response?.ok) return setFullviewPage('')
        const text = await response.text()
        setFullviewPage(text)
    }

    async function onLoad() {
        parentDiv.current?.style.setProperty('display', 'none')
        spinnerDiv.current?.style.setProperty('animation', 'fadeIn 1s 1')
        spinnerDiv.current?.style.setProperty('display', 'inherit')

        const metaDataResponse = await fetch(`https://api.smithed.dev/v2/packs/${id}/meta`)
        if(!metaDataResponse.ok) {
            setData(undefined)
            return
        }
        const metaData = await metaDataResponse.json()

        const data = await getData()

        await getFullViewPage(data)
        await getAuthor(metaData.owner)

        setTimeout(() => {
            parentDiv.current?.style.setProperty('display', 'flex')
            parentDiv.current?.style.setProperty('animation', fixed ? 'pullIn 0.75s ease-in-out' : 'pullInLeft 0.75s')
            spinnerDiv.current?.style.setProperty('animation', '')
            spinnerDiv.current?.style.setProperty('display', 'none')
        }, 100)
    }

    useEffect(() => { onLoad() }, [id, packData])

    return <div className='container packInfoRoot' style={{ height: 'auto', width: '100%', ...style }}>
        <div ref={spinnerDiv} className="container" key="spinner" style={{ height: fixed ? '100%' : '100%', marginTop: yOffset, boxSizing: 'border-box' }}><Spinner /></div>
        {data !== undefined && <div className="container" style={{
            justifyContent: 'start',
            backgroundColor: 'var(--backgroundAccent)', borderRadius: 'var(--defaultBorderRadius)',
            padding: 16, marginTop: yOffset,
            display: 'none',
            boxSizing: 'border-box',
            width: '100%'
        }} ref={parentDiv}>
            <div className="container" style={{ flexDirection: fixed ? 'column' : 'row', width: '100%', justifyContent: 'center', gap: fixed ? 0 : 16 }}>
                <div className='container' style={{ flex: '33%', width: '100%', justifyContent: fixed ? 'left' : 'right', flexDirection: 'row' }}>
                    {fixed && <button className="button container wobbleHover" style={{ width: 48, height: 48, borderRadius: '24px', padding: 12, backgroundColor: 'var(--badAccent)', marginBottom: -48 }} onClick={onClose}>
                        <Cross style={{ stroke: 'var(--buttonText)' }} />
                    </button>}
                    {!fixed && <img className="packImage" src={data.display.icon} style={{ width: 96, height: 96, borderRadius: 'var(--defaultBorderRadius)', border: '4px solid var(--background)' }}>

                    </img>}
                </div>
                <a style={{ fontSize: '2rem', textDecoration: 'underline', color: 'var(--accent2)', width: 'max-content', textAlign: 'center' }} href={`/packs/${id}`}>{data?.display.name}</a>
                <div style={{ flex: '33%' }}></div>
            </div>
            <p style={{ backgroundColor: 'var(--background)', padding: 12, borderRadius: 'var(--defaultBorderRadius)', maxWidth: '100%', fontSize: '1.125rem' }}>
                {data.display.description}
            </p>
            <div style={{ width: '100%'}}>
                {fullviewPage !== '' && <MarkdownRenderer style={{}}>{fullviewPage.replace(/<!-- HIDE -->([^]*?)<!-- HIDE END -->\n?/g, '')}</MarkdownRenderer>}
            </div>

        </div>}
    </div>
}
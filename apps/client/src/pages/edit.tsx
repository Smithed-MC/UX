import { e } from '@tauri-apps/api/event-2a9960e7'
import { ErrorPage, MarkdownRenderer, Spinner } from 'components'
import { Info, Left, Right } from 'components/svg'
import { PackData, PackVersion } from 'data-types'
import { formatDownloadURL } from 'formatters'
import { useFirebaseUser, useQueryParams } from 'hooks'
import React, { useEffect, useRef, useState } from 'react'
import { valid } from 'semver'

interface InputWithTooltipProps {
    tooltip: any,
    offset?: number,
    [key: string]: any
}

function Editor({ children, title, ...props }: any) {
    return <div className='container' style={{ backgroundColor: 'var(--backgroundAccent)', width: '100%', maxWidth: 'calc(512px + 16px)', borderRadius: 24, padding: 16 }}>
        <h1>{title}</h1>
        <div className='container' style={{ width: '100%', height: '100%', gap: 16, alignItems: 'start' }}>{children}</div>
    </div>
}

function EditorDiv({ children, style, ...props }: any) {
    return <div className='container' style={{ alignItems: 'start', gap: 8, width: '100%', ...style }} {...props}>{children}</div>
}

const prettyString = (s: string) => (s[0].toUpperCase() + s.substring(1)).match(/[A-Z][a-z]+/g)?.join(' ') ?? s
function AttributeHeader({ attr }: { attr: string }) {

    return <h3 style={{ margin: 0, marginTop: 8 }}>{prettyString(attr)}</h3>
}

interface EditorInputProps {
    reference: { [key: string]: any }
    attr: string,
    description: string,
    header?: string
}


function Tooltip({ description }: { description: string }) {
    const [hover, setHover] = useState(false)
    return <div style={{ width: 0, height: 0, marginBottom: 16 }}>
        <Info style={{ fill: 'var(--accent)', width: 16, height: 16, marginLeft: -24, opacity: hover ? 1 : 0.3 }} onMouseOver={() => setHover(true)} onMouseOut={() => setHover(false)} />
        {hover && <div style={{ position: 'absolute', backgroundColor: 'var(--accent)', borderRadius: 24, padding: 8 }}>{description}</div>}
    </div>

}

function StringInput({ reference, attr, description, header }: EditorInputProps) {
    return <EditorDiv>
        <AttributeHeader attr={header ?? attr} />
        <div className='container' style={{ width: '100%', flexDirection: 'row' }}>
            <input style={{ width: '100%', backgroundColor: 'var(--background)', color: 'white' }} placeholder={prettyString(attr) + '...'} onChange={(e) => reference[attr] = e.currentTarget.value} defaultValue={reference[attr]} />
            <Tooltip description={description} />
        </div>
    </EditorDiv>
}

interface ImageURLInputProps extends EditorInputProps {
    width: number | string,
    height: number | string
}

function ImageURLInput({ reference, attr, width, height, description, header }: ImageURLInputProps) {
    const [src, setSrc] = useState(reference[attr])

    return <EditorDiv>
        <AttributeHeader attr={header ?? attr} />
        <div className='container' style={{ width: '100%', flexDirection: 'row' }}>
            <input style={{ width: '100%', backgroundColor: 'var(--background)', color: 'white' }} placeholder={prettyString(attr) + '...'} onChange={async (e) => { reference[attr] = await formatDownloadURL(e.currentTarget.value); setSrc(reference[attr]) }} defaultValue={reference[attr]} />
            <Tooltip description={description} />
        </div>

        <img style={{ width: width, height: height, padding: 4, backgroundColor: 'var(--background)', borderRadius: 24 }} src={src} />
    </EditorDiv>
}

function MarkdownURLInput({ reference, attr, description }: EditorInputProps) {
    const [showPreview, setShowPreview] = useState<string | undefined>(undefined)
    const [error, setError] = useState<string | undefined>(undefined)
    return <EditorDiv>
        <AttributeHeader attr={attr} />
        <div className='container' style={{ width: '100%', flexDirection: 'row' }}>
            <input style={{ width: '100%', backgroundColor: 'var(--background)', color: 'white' }} placeholder={prettyString(attr) + '...'} onChange={(e) => { reference[attr] = e.currentTarget.value; }} defaultValue={reference[attr]} />
            <Tooltip description={description} />
            <button className='button' style={{ marginLeft: 8 }} onClick={async () => {
                setError('')
                const url = reference[attr]
                if (url === '') return void setError('No URL is specified')


                const resp = await fetch(await formatDownloadURL(url))
                if (!resp.ok) {
                    switch (resp.status) {
                        case 404:
                            setError('404: Page was not found, check your link again.')
                            break;
                        default:
                            setError(`Error has occured! ${resp.status}: ${resp.statusText}`)
                            break;
                    }
                    return
                }

                setShowPreview(await resp.text())
            }}>Preview</button>
            {showPreview && <div className='container' style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'calc(100vh - 32px)', justifyContent: 'start', padding: 16 }}>
                <div className='container' style={{ backgroundColor: 'var(--backgroundAccent)', width: '100%', maxWidth: 720, padding: 16, height: '100%', borderRadius: 24, border: '2px solid var(--accent)' }}>
                    <MarkdownRenderer style={{ flexGrow: 1, width: '100%' }}>{showPreview}
                    </MarkdownRenderer>
                    <button className='button' style={{ width: 128, fontSize: 18, backgroundColor: 'var(--badAccent)' }} onClick={() => { setShowPreview(undefined) }}>Close</button>
                </div>

            </div>}
        </div>
        {error && <label style={{ color: 'var(--badAccent)' }}>{error}</label>}
    </EditorDiv>
}

function DownloadURLInput({ reference, attr, description, header }: EditorInputProps) {
    const [error, setError] = useState<string | undefined>(undefined)
    const [valid, setValid] = useState<boolean>(false)
    const [value, setValue] = useState<string>(reference[attr])

    useEffect(() => setValue(reference[attr]), [reference, attr])

    return <EditorDiv>
        <AttributeHeader attr={header ?? attr} />
        <div className='container' style={{ width: '100%', flexDirection: 'row' }}>
            <input style={{ width: '100%', backgroundColor: 'var(--background)', color: 'white' }} placeholder={prettyString(attr) + '...'} onChange={(e) => { reference[attr] = e.currentTarget.value; setValue(reference[attr]); setValid(false) }} value={value} />
            <Tooltip description={description} />
            <button className='button' style={{ marginLeft: 8 }} onClick={async () => {
                setError('')
                setValid(false)
                const url = reference[attr]
                if (url === '') return void setError('No URL is specified')

                const resp = await fetch(`https://api.smithed.dev/validateDownload?url=${url}`)
                const status = await resp.text()

                if (status !== 'valid') return void setError(status)

                setValid(true)

            }}>Test</button>
        </div>
        {error && <label style={{ color: 'var(--badAccent)', padding: 4 }}>{error}</label>}
        {valid && <label style={{ color: 'var(--goodAccent)', padding: 4 }}>Download is working!</label>}
    </EditorDiv>
}

function Selection({ values, onChange, defaultValue }: { values: string[], onChange?: (i: number) => void, defaultValue?: number }) {
    const [index, setIndex] = useState(defaultValue ?? 0)

    const cycle = (direction: number) => {
        const newIndex = (values.length + (index + direction)) % values.length
        setIndex(newIndex)
        if (onChange) onChange(newIndex)
    }

    useEffect(() => setIndex(defaultValue ?? 0), [defaultValue])

    const cycleLeft = () => cycle(-1)
    const cycleRight = () => cycle(1)

    return <EditorDiv style={{ flexDirection: 'row' }}>
        <button className='button' style={{ borderRadius: '50%', height: 32, width: 32, alignItems: 'center' }} onClick={cycleLeft}>
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Left style={{ width: '24px', height: '24px', flexShrink: 0, stroke: 'var(--buttonText)' }} />
            </div>
        </button>
        <div className='container' style={{ flexGrow: 1, maxWidth: 196, backgroundColor: 'var(--accent)', height: 32, alignItems: 'center', borderRadius: 24 }}>{values[index]}</div>
        <button className='button' style={{ borderRadius: '50%', height: 32, width: 32, alignItems: 'center' }} onClick={cycleRight}>
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Right style={{ width: '24px', height: '24px', flexShrink: 0, stroke: 'var(--buttonText)' }} />
            </div>
        </button>
    </EditorDiv>
}

export default function Edit() {
    const user = useFirebaseUser()
    const { pack } = useQueryParams()
    const [packData, setPackData] = useState<PackData>()
    const [selectedVersion, setSelectedVersion] = useState(0)

    async function onLoad() {
        if (user == null) return
        const data = await (await fetch(`https://api.smithed.dev/getUserPack?uid=${user.uid}&pack=${pack}`)).json()
        setPackData(data)
    }
    useEffect(() => { onLoad() }, [pack, user])

    if (user == null) return <ErrorPage title="Error 401" description='Not signed in!' returnLink='/' returnMessage='Back to Home' />
    if (packData === undefined) return <div className="container" style={{ width: '100%', height: '95vh' }}>
        <Spinner />
    </div>

    return <div className="container" style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, flexDirection: 'row', alignItems: 'start', justifyContent: 'flex-start' }}>
        <div className="container" style={{ width: '100%', padding: 24, flexDirection: 'row', gap: 48, alignItems: 'start' }}>
            <Editor title={'Display'}>
                <StringInput description='Name of the pack' reference={packData.display} attr={'name'} />
                <StringInput description='Short description of the pack' reference={packData.display} attr={'description'} />
                <ImageURLInput description='URL to the icon of the pack' reference={packData.display} attr={'icon'} width={64} height={64} />
                <MarkdownURLInput description='URL to the ReadME of the pack' reference={packData.display} attr={'webPage'} />
            </Editor>
            <Editor title={'Versions'}>
                <NewVersion data={packData.versions} onAddVersion={() => setSelectedVersion(packData.versions.length-1)}/>
                <Selection values={packData.versions.map(v => v.name)} onChange={setSelectedVersion} defaultValue={selectedVersion}/>
                <DownloadURLInput reference={packData.versions[selectedVersion].downloads} attr='datapack' header='Datapack Download' description='Raw URL to the download for the datapack' />
                <DownloadURLInput reference={packData.versions[selectedVersion].downloads} attr='resourcepack' header='Resourcepack Download' description='Raw URL to the download for the resourcepack' />
            </Editor>
        </div>
    </div>
}

function NewVersion({data, onAddVersion}: {data: PackVersion[], onAddVersion: () => void}) {
    const [addNewVersion, setAddNewVersion] = useState(false)
    const [error, setError] = useState('')
    const versionName = useRef<HTMLInputElement>(null);

    const addVersion = () => {
        if(versionName.current == null) 
            return
        const name = versionName.current.value
        console.log(name)
        setError('')

        if(name === undefined || name === '') {
            return setError('Name cannot be empty')
        }
        if (valid(name) == null) {
            return setError('Version name is not valid SemVer')
        }

        versionName.current.value = ''

        data.push({
            name: name,
            downloads: {
                datapack: '',
                resourcepack: ''
            },
            supports: []
        })
        
        console.log(data)
        onAddVersion()
    }

    const toggleDisplay = () => {
        setError('')
        setAddNewVersion(true)
    }

    if (addNewVersion) {
        return <EditorDiv style={{alignItems: 'center', width: '100%'}} onMouseLeave={() => setAddNewVersion(false)}>
            <EditorDiv style={{ flexDirection: 'row', width: '100%', alignItems: 'center' }}>
                <input style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }} placeholder='Version Number...' ref={versionName} />
                <button className='button' style={{ width: 32, height: 32, fontSize: 24 }} onClick={addVersion}>
                    <div className='container' style={{ width: '100%', height: '100%' }}>+</div>
                </button>
            </EditorDiv>
            {error && <label style={{ color: 'var(--badAccent)' }}>{error}</label>}
        </EditorDiv>
    }

    return <EditorDiv style={{ flexDirection: 'row', width: '100%', alignItems: 'center' }}>
        <button className='button' style={{ fontSize: 16 }} onClick={toggleDisplay}>Add new version</button>
    </EditorDiv>
}

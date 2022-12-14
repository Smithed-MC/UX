import { e } from '@tauri-apps/api/event-2a9960e7'
import { ErrorPage, MarkdownRenderer, Spinner } from 'components'
import { Back, Cross, Info, Left, Right, Save, Trash } from 'components/svg'
import { MinecraftVersion, PackData, PackDependency, PackVersion, packCategories } from 'data-types'
import { formatDownloadURL } from 'formatters'
import { useFirebaseUser, useQueryParams } from 'hooks'
import React, { CSSProperties, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { coerce, compare, valid } from 'semver'
import './edit.css'

interface InputWithTooltipProps {
    tooltip: any,
    offset?: number,
    [key: string]: any
}

function Editor({ children, title, ...props }: any) {
    return <div className='container' style={{ backgroundColor: 'var(--backgroundAccent)', width: '100%', maxWidth: 'calc(512px + 16px)', borderRadius: 'var(--defaultBorderRadius)', padding: 16 }}>
        <h1>{title}</h1>
        <div className='container' style={{ width: '100%', height: '100%', gap: 16, alignItems: 'start' }}>{children}</div>
    </div>
}

function EditorDiv({ children, style, ...props }: { children: any, style?: CSSProperties, [key: string]: any }) {
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


function Tooltip({ description, style, offset }: { description: string, offset?: number, style?: React.CSSProperties }) {
    const [hover, setHover] = useState(false)
    return <div style={{ width: 0, height: 0, marginBottom: 18, ...style }}>
        <Info style={{ fill: 'var(--accent)', width: 16, height: 16, marginLeft: offset ?? -26, opacity: hover ? 1 : 0.5, backgroundColor: 'var(--buttonText)', borderRadius: 'var(--defaultBorderRadius)', border: '1px solid var(--buttonText)' }} onMouseOver={() => setHover(true)} onMouseOut={() => setHover(false)} />
        {hover && <div className="fadeIn" style={{ animationDuration: '0.3s', position: 'absolute', backgroundColor: 'var(--accent)', borderRadius: 'var(--defaultBorderRadius)', padding: 8 }}>{description}</div>}
    </div>

}

function StringInput({ reference, attr, description, header }: EditorInputProps) {
    return <EditorDiv>
        <AttributeHeader attr={header ?? attr} />
        <div className='container' style={{ width: '100%', flexDirection: 'row' }}>
            <input style={{ width: '100%', backgroundColor: 'var(--background)', color: 'white', paddingRight: 32 }} placeholder={prettyString(attr) + '...'} onChange={(e) => reference[attr] = e.currentTarget.value} defaultValue={reference[attr]} />
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
            <input style={{ width: '100%', backgroundColor: 'var(--background)', color: 'white', paddingRight: 32 }} placeholder={prettyString(attr) + '...'} onChange={async (e) => { reference[attr] = await formatDownloadURL(e.currentTarget.value); setSrc(reference[attr]) }} defaultValue={reference[attr]} />
            <Tooltip description={description} />
        </div>

        <img style={{ width: width, height: height, padding: 4, backgroundColor: 'var(--background)', borderRadius: 'var(--defaultBorderRadius)' }} src={src} />
    </EditorDiv>
}

function MarkdownURLInput({ reference, attr, description }: EditorInputProps) {
    const [showPreview, setShowPreview] = useState<string | undefined>(undefined)
    const [error, setError] = useState<string | undefined>(undefined)
    return <EditorDiv>
        <AttributeHeader attr={attr} />
        <div className='container' style={{ width: '100%', flexDirection: 'row' }}>
            <input style={{ width: '100%', backgroundColor: 'var(--background)', color: 'white', paddingRight: 32 }} placeholder={prettyString(attr) + '...'} onChange={(e) => { reference[attr] = e.currentTarget.value; }} defaultValue={reference[attr]} />
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
            {showPreview && <div className='container' style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'calc(100vh - 32px)', justifyContent: 'start', padding: 16, zIndex: 100 }}>
                <div className='container' style={{ backgroundColor: 'var(--backgroundAccent)', width: '100%', maxWidth: 720, padding: 16, height: '100%', borderRadius: 'var(--defaultBorderRadius)', border: '2px solid var(--accent)' }}>
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
            <input style={{ width: '100%', backgroundColor: 'var(--background)', color: 'white', paddingRight: 32 }} placeholder={prettyString(attr) + '...'} onChange={(e) => { reference[attr] = e.currentTarget.value; setValue(reference[attr]); setValid(false) }} value={value} />
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

            }}>Validate</button>
        </div>
        {error && <label style={{ color: 'var(--badAccent)', padding: 4 }}>{error}</label>}
        {valid && <label style={{ color: 'var(--goodAccent)', padding: 4 }}>Download is working!</label>}
    </EditorDiv>
}

function Selection({ values, onChange, defaultValue }: { values: string[], onChange?: (i: number) => void, defaultValue?: number }) {
    const [index, setIndex] = useState(defaultValue ?? 0)

    const updateIndex = (index: number) => {
        setIndex(index)
        if (onChange) onChange(index)
    }

    const cycle = (direction: number) => {
        const newIndex = (values.length + (index + direction)) % values.length
        updateIndex(newIndex)
    }

    useEffect(() => setIndex(defaultValue ?? 0), [defaultValue])

    const cycleLeft = () => cycle(-1)
    const cycleRight = () => cycle(1)

    return <EditorDiv style={{ flexDirection: 'row' }}>
        <button className='button' style={{ borderRadius: '50%', height: 32, width: 32, alignItems: 'center' }} onClick={cycleLeft} disabled={values.length <= 1}>
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Left style={{ width: '24px', height: '24px', flexShrink: 0, stroke: 'var(--buttonText)' }} />
            </div>
        </button>
        <select className='container' style={{ flexGrow: 1, maxWidth: 196, backgroundColor: 'var(--accent)', height: 32, alignItems: 'center', borderRadius: 'var(--defaultBorderRadius)', textAlignLast: 'center' }} value={index} onChange={(e) => { updateIndex(Number.parseInt(e.currentTarget.value)) }}>
            {values.map((v, i) => <option value={i} style={{ textAlign: 'left' }}>{v}</option>)}
        </select>
        <button className='button' style={{ borderRadius: '50%', height: 32, width: 32, alignItems: 'center' }} onClick={cycleRight} disabled={values.length <= 1}>
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Right style={{ width: '24px', height: '24px', flexShrink: 0, stroke: 'var(--buttonText)' }} />
            </div>
        </button>
    </EditorDiv>
}

function DropdownSelectionInput({ reference, attr, description, header, options, onChange }: EditorInputProps & { options: string[], onChange: () => void }) {
    const select = useRef<HTMLSelectElement>(null)
    const [selectedValue, setSelectedValue] = useState<string | undefined>(undefined)
    const [contained, setContained] = useState<boolean>()

    useEffect(() => {
        setContained(reference[attr].includes(selectedValue))
    }, [selectedValue])

    const addVersion = () => {
        reference[attr].push(selectedValue)
        onChange()
        setContained(true)
    }

    const removeVersion = () => {
        reference[attr].splice(reference[attr].findIndex((s: string) => s === selectedValue), 1)
        onChange()
        setContained(false)
    }

    return <EditorDiv>
        <AttributeHeader attr={attr} />
        <div className='container' style={{ width: '100%', flexDirection: 'row', gap: 8 }}>
            <select ref={select} style={{ width: '100%', backgroundColor: 'var(--background)' }} defaultValue='_placeholder' onChange={(e) => setSelectedValue(e.currentTarget.value)}>
                {options.map(s => <option key={s}>{s}</option>)}
                <option selected value={'_placeholder'} hidden>{description + '...'} </option>
            </select>
            {selectedValue !== undefined && ((
                !contained && <button className='button' style={{ width: 32, height: 32, fontSize: 24, borderRadius: '50%', flexShrink: 0 }} onClick={addVersion}>
                    <div className='container' style={{ width: '100%', height: '100%' }}>+</div>
                </button>
            ) || (
                    <button className='button' style={{ width: 32, height: 32, fontSize: 24, borderRadius: '50%', flexShrink: 0, backgroundColor: 'var(--badAccent)' }} onClick={removeVersion}>
                        <div className='container' style={{ width: '100%', height: '100%' }}>-</div>
                    </button>
                ))}
        </div>
    </EditorDiv>
}

function NewVersion({ data, onAddVersion }: { data: PackVersion[], onAddVersion: () => void }) {
    const [addNewVersion, setAddNewVersion] = useState(false)
    const [error, setError] = useState('')
    const versionName = useRef<HTMLInputElement>(null);

    const addVersion = () => {
        if (versionName.current == null)
            return
        const name = versionName.current.value
        console.log(name)
        setError('')

        if (name === undefined || name === '') {
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
            supports: [],
            dependencies: []
        })

        console.log(data)
        onAddVersion()
    }

    const toggleDisplay = () => {
        setError('')
        setAddNewVersion(true)
    }

    if (addNewVersion) {
        return <EditorDiv style={{ alignItems: 'center', width: '100%' }} >
            <EditorDiv style={{ flexDirection: 'row', width: '100%', alignItems: 'center' }} onMouseLeave={() => setAddNewVersion(false)}>
                <input style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }} placeholder='Version Number...' ref={versionName} onMouseEnter={() => versionName.current?.select()} />
                <button className='button' style={{ width: 32, height: 32, fontSize: 24 }} onClick={addVersion}>
                    <div className='container' style={{ width: '100%', height: '100%' }}>+</div>
                </button>
            </EditorDiv>
            {error && <label style={{ color: 'var(--badAccent)' }}>{error}</label>}
        </EditorDiv>
    }

    return <EditorDiv style={{ flexDirection: 'row', width: 'fit-content', justifyContent: 'left' }}>
        <button className='button' style={{ fontSize: 16 }} onClick={toggleDisplay}>Add new version</button>
    </EditorDiv>
}

function RenderDependencies({ dependencies, onRemoveDependency }: { dependencies: PackDependency[], onRemoveDependency: () => void }) {
    dependencies.sort((a, b) => a.id.localeCompare(b.id))
    let elements: JSX.Element[] = []
    dependencies.forEach((d, i) => {
        elements.push(<button className='button' style={{ width: 18, height: 18, backgroundColor: 'var(--badAccent)' }} onClick={() => {
            dependencies.splice(i, 1)
            onRemoveDependency()
        }}>
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Cross style={{ width: '12px', height: '12px', flexShrink: 0, stroke: 'var(--buttonText)' }} />
            </div>
        </button>)
        elements.push(<label style={{ paddingRight: 16, borderRight: '2px solid var(--background)' }}>{d.id}</label>)
        elements.push(<label>{d.version}</label>)
    })

    return <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', gridTemplateRows: 'auto', alignItems: 'center', columnGap: 16, rowGap: 8 }}>
        {elements}
    </div>
}

function NewDependency({ dependencies, onAddDependency }: { dependencies: PackDependency[], onAddDependency: () => void }) {
    const idRef = useRef<HTMLInputElement>(null)
    const versionRef = useRef<HTMLInputElement>(null)

    return <EditorDiv style={{ flexDirection: 'row', alignItems: 'center' }}>
        <input ref={idRef} style={{ width: '100%', backgroundColor: 'var(--background)', color: 'white' }} placeholder='Dependency (<Owner>:<ID>)...' />
        <input ref={versionRef} style={{ width: '100%', backgroundColor: 'var(--background)', color: 'white' }} placeholder='Version...' />
        <button className='button' style={{ width: 32, height: 32, fontSize: 24, borderRadius: '50%', flexShrink: 0 }} onClick={async () => {
            if (idRef.current == null || versionRef.current == null)
                return

            const id = idRef.current.value
            const version = versionRef.current.value

            if (id === '' || version === '') return

            const existingDependency = dependencies.find(d => d.id === id)
            if (existingDependency)
                existingDependency.version = version
            else
                dependencies.push({ id: id, version: version })

            idRef.current.value = ''
            versionRef.current.value = ''

            onAddDependency()
        }}>
            <div className='container' style={{ width: '100%', height: '100%' }}>+</div>
        </button>
    </EditorDiv>
}

export default function Edit() {
    const user = useFirebaseUser()
    const navigate = useNavigate()
    const { pack } = useQueryParams()
    const [packData, setPackData] = useState<PackData>()
    const [versions, setVersions] = useState<PackVersion[]>([])
    const [categories, setCategories] = useState<string[]>([])
    const [selectedVersion, setSelectedVersion] = useState(0)
    const [mcVersions, setMCVersions] = useState<string[]>([])
    const [supportedVersions, setSupportedVersions] = useState<MinecraftVersion[] | undefined>(packData?.versions[selectedVersion].supports)
    const deleteButtonRef = useRef<HTMLLabelElement>(null)
    const saveTextRef = useRef<HTMLDivElement>(null)
    let deleteConfirmation = 0;

    useEffect(() => {
        setSupportedVersions(packData?.versions[selectedVersion].supports)
    }, [packData, selectedVersion])

    async function onLoad() {
        if (user == null) return
        const data: PackData = await (await fetch(`https://api.smithed.dev/getUserPack?uid=${user.uid}&pack=${pack}`)).json()
        data.versions.sort((a, b) => compare(a.name, b.name))
        setPackData(data)
        setVersions(data.versions)
        setCategories(data.categories)

        const versions: string[] = await (await fetch(`https://api.smithed.dev/getVersions`)).json()
        setMCVersions(versions)
    }
    useEffect(() => { onLoad() }, [pack, user])

    if (user == null) return <div style={{animation: 'fadeIn 1s'}}>
        <ErrorPage title="Error 401" description='Not signed in!' returnLink='/' returnMessage='Back to Home' />
    </div>
    if (packData === undefined) return <div className="container" style={{ width: '100%', height: '100vh', boxSizing: 'border-box' }}>
        <Spinner />
    </div>

    const updateVersions = () => { setVersions(Object.create(packData.versions)) }
    return <div className="container" style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, flexDirection: 'row', alignItems: 'start', justifyContent: 'flex-start' }}>
        <div className="container" style={{ width: '100%', padding: 24, flexDirection: 'row', gap: 48, alignItems: 'start' }}>
            <Editor title={'Display'}>
                <StringInput description='Name of the pack' reference={packData.display} attr={'name'} />
                <StringInput description='Short description of the pack' reference={packData.display} attr={'description'} />
                <ImageURLInput description='URL to the icon of the pack' reference={packData.display} attr={'icon'} width={64} height={64} />
                <MarkdownURLInput description='URL to the ReadME of the pack' reference={packData.display} attr={'webPage'} />
                <DropdownSelectionInput description='Categories' reference={packData} attr={'categories'} options={packCategories} onChange={() => { setCategories(Object.create(packData.categories)) }} />
                <label>{categories?.sort().join(', ')}</label>
            </Editor>
            <Editor title={'Versions'}>
                <EditorDiv style={{ alignItems: 'center' }}>
                    <EditorDiv style={{ width: 'min-content' }}>
                        <EditorDiv style={{ flexDirection: 'row' }}>
                            <Selection values={versions.map(v => v.name)} onChange={setSelectedVersion} defaultValue={selectedVersion} />


                        </EditorDiv>
                        <EditorDiv style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <button style={{ width: 32, height: 32, backgroundColor: 'var(--badAccent)' }} className='button' onClick={() => {
                                if (deleteButtonRef.current == null) return

                                if (deleteConfirmation === 0) {
                                    deleteConfirmation = 1;
                                    deleteButtonRef.current.hidden = false
                                } else {
                                    packData.versions.splice(selectedVersion, 1)
                                    if (selectedVersion >= packData.versions.length)
                                        setSelectedVersion(packData.versions.length - 1)
                                    updateVersions()
                                    deleteConfirmation = 0;
                                    deleteButtonRef.current.hidden = true
                                }
                            }} onMouseOut={() => {
                                deleteConfirmation = 0;
                                if (deleteButtonRef.current != null) {
                                    deleteButtonRef.current.hidden = true
                                }
                            }}>
                                <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Trash style={{ width: '24px', height: '24px', flexShrink: 0, stroke: 'var(--buttonText)' }} />
                                </div>
                            </button>
                            <label ref={deleteButtonRef} style={{ position: 'absolute', marginLeft: 84, zIndex: 10, backgroundColor: 'var(--badAccent)', padding: 8, borderRadius: 'var(--defaultBorderRadius)' }} hidden>{'Press again to confirm'}</label>
                            <NewVersion data={packData.versions} onAddVersion={() => {
                                setVersions(Object.create(packData.versions));
                                setSelectedVersion(packData.versions.length - 1)
                            }} />
                        </EditorDiv>
                    </EditorDiv>
                </EditorDiv>
                <DownloadURLInput reference={packData.versions[selectedVersion].downloads} attr='datapack' header='Datapack Download' description='Raw URL to the download for the datapack' />
                <DownloadURLInput reference={packData.versions[selectedVersion].downloads} attr='resourcepack' header='Resourcepack Download' description='Raw URL to the download for the resourcepack' />
                <DropdownSelectionInput reference={packData.versions[selectedVersion]} attr='supports' description='Supported Minecraft Versions' options={mcVersions} onChange={() => {
                    const s = packData.versions[selectedVersion].supports
                    s.sort((a, b) => compare(coerce(a) ?? '', coerce(b) ?? ''))
                    setSupportedVersions(Object.create(s))
                }} />
                <label>{supportedVersions?.map(s =>
                    <label>- {s}<br /></label>
                )}</label>
                <AttributeHeader attr={'Dependencies'} />
                <NewDependency dependencies={versions[selectedVersion].dependencies ?? []} onAddDependency={updateVersions} />
                <RenderDependencies dependencies={versions[selectedVersion].dependencies ?? []} onRemoveDependency={updateVersions} />
            </Editor>
        </div >
        <div className='container' style={{ flexDirection: 'row', position: 'fixed', bottom: 8, right: 8, justifySelf: 'center', backgroundColor: 'var(--backgroundAccent)', borderRadius: 'var(--defaultBorderRadius)', padding: 16, gap: 16, border: '4px solid var(--background)', boxSizing: 'border-box' }}>
            <button className='button' style={{ width: 36, height: 36 }} title='Back' onClick={() => {
                navigate(-1)
            }}><Back style={{ stroke: 'var(--buttonText)', fill: 'var(--buttonText)' }} /></button>
            <button className='button' style={{ width: 36, height: 36 }} title='Save' onClick={async () => {
                console.log(packData)
                const resp = await fetch(`https://api.smithed.dev/setUserPack?uid=${user.uid}&pack=${pack}&token=${await user.getIdToken()}`, { method: 'POST', body: JSON.stringify({ data: packData }), headers: { "Content-Type": "application/json" } })

                if (resp.status !== 200) {
                    alert(await resp.text())
                } else {
                    saveTextRef.current?.style.setProperty('animation', 'fadeInAndOut 5s')
                    setTimeout(() => {
                        saveTextRef.current?.style.setProperty('animation', '')
                    }, 5000)
                }
            }}><Save style={{ stroke: 'var(--buttonText)' }} /></button>
        </div>
        <div style={{ display: 'flex', position: 'fixed', bottom: 0, width: '100%', visibility: 'hidden', height: '48px', fontSize: 18, justifyContent: 'center', color: 'var(--goodAccent)' }} ref={saveTextRef}>Pack saved</div>
    </div >
}

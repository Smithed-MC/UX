import { e } from '@tauri-apps/api/event-2a9960e7'
import { ChooseBox, ErrorPage, IconInput, IconTextButton, MarkdownRenderer, Spinner } from 'components'
import { Back, Cross, Info, Left, Right, Trash, Edit as EditSvg, Globe, Browse, Plus, Picture, Download, Check, Folder, Jigsaw, Line, Star, Text as TextSvg, At, Refresh, File, Account, Home, List } from 'components/svg'
import { HTTPResponses, MinecraftVersion, PackData, PackDependency, PackMetaData, PackVersion, UserData, packCategories } from 'data-types'
import { formatDownloadURL } from 'formatters'
import { useFirebaseUser, useQueryParams } from 'hooks'
import React, { CSSProperties, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { coerce, compare, valid } from 'semver'
import './edit.css'
import hash from 'hash.js'

interface InputWithTooltipProps {
    tooltip: any,
    offset?: number,
    [key: string]: any
}

function Editor({ children, title, style, ...props }: any) {
    return <div className='container' style={{ backgroundColor: 'var(--section)', width: '100%', maxWidth: 'calc(512px + 16px)', borderRadius: 'var(--defaultBorderRadius)', padding: 16, boxSizing: 'border-box', ...style }}>
        <h1 style={{ fontFamily: 'Lexend' }}>{title}</h1>
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
    placeholder?: string,
    description: string,
    header?: string,
    disabled?: boolean,
    svg?: React.FunctionComponent<React.SVGProps<SVGSVGElement> & {
        title?: string | undefined;
    }> | string
}


function Tooltip({ description, style, offset }: { description: string, offset?: number, style?: React.CSSProperties }) {
    const [hover, setHover] = useState(false)
    return <div style={{ width: 0, height: 0, marginBottom: 18, ...style }}>
        <Info style={{ fill: 'var(--accent)', width: 16, height: 16, marginLeft: offset ?? -26, opacity: hover ? 1 : 0.5, backgroundColor: 'var(--buttonText)', borderRadius: 'var(--defaultBorderRadius)', border: '1px solid var(--buttonText)' }} onMouseOver={() => setHover(true)} onMouseOut={() => setHover(false)} />
        {hover && <div className="fadeIn" style={{ animationDuration: '0.3s', position: 'absolute', backgroundColor: 'var(--accent)', borderRadius: 'var(--defaultBorderRadius)', padding: 8, zIndex: 1, border: '4px solid var(--buttonText)' }}>{description}</div>}
    </div>

}

function StringInput({ reference, attr, description, header, disabled, svg, placeholder, multiline }: EditorInputProps & { multiline?: boolean }) {
    return <EditorDiv>
        <div className='container' style={{ width: '100%', flexDirection: 'column', alignItems: 'start', gap: '0.5rem' }}>
            {!multiline && <IconInput icon={svg ?? EditSvg}
                style={{ width: '100%', color: 'white', paddingRight: 32 }}
                placeholder={placeholder ?? attr}
                onChange={(e) => reference[attr] = e.currentTarget.value}
                defaultValue={reference !== undefined ? reference[attr] : ''}
                disabled={disabled}
                title={description} />}
            {multiline &&
                <textarea className='input' placeholder={placeholder ?? attr}
                    style={{ minWidth: '100%', maxWidth: '100%', minHeight: '6.75rem', textAlign: 'start' }} defaultValue={reference[attr]} onChange={(e) => {
                        reference[attr] = e.currentTarget.value;
                    }}></textarea>
            }
            {/* <span style={{ color: 'var(--border)' }}>{description}</span> */}
        </div>
    </EditorDiv>
}

interface ImageURLInputProps extends EditorInputProps {
    width: number | string,
    height: number | string
}

function ImageURLInput({ reference, attr, width, height, description, header, placeholder, svg }: ImageURLInputProps) {
    const [src, setSrc] = useState(reference[attr])
    const [fallback, setFallback] = useState(false)

    useEffect(() => setFallback(false), [src])

    return <EditorDiv style={{ flexDirection: 'row', gap: '1rem' }}>
        <div className='container' style={{ width: '4rem', height: '4rem', border: '0.125rem solid var(--border)', borderRadius: 'var(--defaultBorderRadius)', backgroundColor: 'var(--section)', overflow: 'hidden' }}>
            {fallback && <span style={{ fontSize: '0.625rem' }}>PREVIEW</span>}
            {!fallback && <img src={src} style={{ width: '100%', height: '100%' }} onError={() => setFallback(true)} />}
        </div>
        <div className='container' style={{ flexDirection: 'column', alignItems: 'start', gap: '0.5rem', flexGrow: 1 }}>
            <IconInput icon={svg ?? Picture} style={{ width: '100%', color: 'white', paddingRight: 32 }} placeholder={placeholder ?? attr} onChange={async (e) => { reference[attr] = await formatDownloadURL(e.currentTarget.value); setSrc(reference[attr]) }} defaultValue={reference !== undefined ? reference[attr] : ''} />
            <span style={{ color: 'var(--border)' }}>{description}</span>
        </div>
    </EditorDiv>
}

function MarkdownURLInput({ reference, attr, description, placeholder, svg }: EditorInputProps) {
    const [showPreview, setShowPreview] = useState<string | undefined>(undefined)
    const [error, setError] = useState<string | undefined>(undefined)

    const onClickPreviewButton = async () => {
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
    }

    return <EditorDiv>
        <div className='container' style={{ width: '100%', flexDirection: 'column', alignItems: 'start', gap: '0.5rem' }}>
            <div className='container' style={{ width: '100%', flexDirection: 'row', gap: '1rem' }}>
                <IconInput icon={svg ?? Globe} style={{ width: '100%', color: 'white', paddingRight: 32 }} placeholder={placeholder ?? attr} onChange={(e) => { reference[attr] = e.currentTarget.value; }} defaultValue={reference !== undefined ? reference[attr] : ''} title={description} />
                <button className='buttonLike accentedButtonLike' onClick={onClickPreviewButton} title="Preview">
                    <Picture />
                </button>
            </div>
            {showPreview && <div className='container' style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', justifyContent: 'start', padding: 16, zIndex: 100, boxSizing: 'border-box' }}>
                <div className='container' style={{ backgroundColor: 'var(--section)', width: '100%', height: 'calc(100%)', padding: 16, boxSizing: 'border-box', borderRadius: 'var(--defaultBorderRadius)', border: '0.125rem solid var(--border)', overflow: 'hidden', overflowY: 'auto' }}>
                    <MarkdownRenderer style={{ flexGrow: 1, width: '100%', height: '100%' }}>
                        {showPreview}
                    </MarkdownRenderer>
                    <div style={{ flexGrow: 1 }} />
                    <button className='buttonLike invalidButtonLike' style={{ width: 128, fontSize: '1.125rem', backgroundColor: 'var(--disturbing)', justifySelf: 'flex-end' }} onClick={() => { setShowPreview(undefined) }}>Close</button>
                </div>

            </div>}
        </div>
        {error && <label style={{ color: 'var(--badAccent)' }}>{error}</label>}
    </EditorDiv>
}

function DownloadURLInput({ reference, attr, description, placeholder }: EditorInputProps) {
    const [error, setError] = useState<string | undefined>(undefined)
    const [valid, setValid] = useState<boolean>(false)
    const [value, setValue] = useState<string>(reference[attr])

    useEffect(() => setValue(reference[attr]), [reference, attr])

    return <EditorDiv>
        <div className='container' style={{ width: '100%', flexDirection: 'column', alignItems: 'start', gap: '0.5rem' }}>
            <div className='container' style={{ flexDirection: 'row', width: '100%' }}>
                <IconInput icon={Globe} style={{ width: '100%', color: 'white', paddingRight: 32 }} placeholder={placeholder ?? attr} onChange={(e) => { reference[attr] = e.currentTarget.value; setValue(reference[attr]); setValid(false) }} value={value} />
                <button className='accentedButtonLike' style={{ marginLeft: 8 }} onClick={async () => {
                    setError('')
                    setValid(false)
                    const url = reference[attr]
                    if (url === '') return void setError('No URL is specified')

                    const resp = await fetch(import.meta.env.VITE_API_SERVER + `/validate-download?url=${url}`)
                    const status = await resp.json()

                    if (!resp.ok) return void setError(status)

                    setValid(status.valid)

                }}>
                    <Refresh />
                </button>
            </div>
            <span style={{ color: 'var(--border)' }}>{description}</span>
            {error && <label style={{ color: 'var(--badAccent)', padding: 4 }}>{error}</label>}
            {valid && <label style={{ color: 'var(--goodAccent)', padding: 4 }}>Download is working!</label>}
        </div>
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
        <button className='buttonLike' onClick={cycleLeft} disabled={values.length <= 1}>
            <Right style={{ transform: 'scale(-100%, -100%)' }} />
        </button>
        <ChooseBox style={{ flexGrow: 1, zIndex: 10 }} defaultValue={index.toString()} choices={values.map((v, i) => ({ value: i.toString(), content: v }))} onChange={(e) => { updateIndex(Number.parseInt(e as string)) }} />
        <button className='buttonLike' onClick={cycleRight} disabled={values.length <= 1}>
            <Right />
        </button>
    </EditorDiv>
}

function DropdownSelectionInput({ reference, attr, description, placeholder, options, onChange }: EditorInputProps & { options: string[], onChange: () => void }) {
    const select = useRef<HTMLSelectElement>(null)
    const [selectedValue, setSelectedValue] = useState<string | undefined>(undefined)
    const [contained, setContained] = useState<boolean>()

    useEffect(() => {
        setContained(reference[attr]?.includes(selectedValue))
    }, [selectedValue])

    const addVersion = () => {
        reference[attr] ??= []

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
        <div className='container' style={{ width: '100%', flexDirection: 'column', gap: 8, alignItems: 'start', margin: '1rem  0 1rem 0' }}>
            <ChooseBox placeholder={placeholder} onChange={(value) => {
                // console.log(value)
                reference[attr] = typeof value === 'string' ? [value] : value
            }} choices={options.map(o => ({ value: o, content: o }))} multiselect defaultValue={reference[attr]} title={description} />
        </div>
    </EditorDiv>
}

function NewVersion({ data, onAddVersion }: { data: PackVersion[], onAddVersion: () => void }) {
    const [addNewVersion, setAddNewVersion] = useState(false)
    const [error, setError] = useState('')
    const versionName = useRef<HTMLInputElement>(null);

    const addVersion = () => {
        // console.log(versionName)
        if (versionName.current == null)
            return
        const name = versionName.current.value
        // console.log(name)
        setError('')

        if (name === undefined || name === '') {
            return setError('Name cannot be empty')
        }
        if (valid(name) == null) {
            return setError('Version name is not valid SemVer')
        }
        if (data.findIndex(d => d.name === name) != -1) {
            return setError(`${name} has already been added`)
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

        // console.log(data)
        setAddNewVersion(false)
        onAddVersion()
    }

    const toggleDisplay = () => {
        setError('')
        setAddNewVersion(true)
    }

    if (addNewVersion) {
        return <div style={{ position: 'fixed', top: 0, left: 0, display: 'flex', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.5', zIndex: 100 }}>
            <div className="container" style={{ alignItems: 'center', padding: '1rem', backgroundColor: 'var(--background)', border: '0.125rem solid var(--border)', borderRadius: 'var(--defaultBorderRadius)', gap: '0.5rem' }}>
                <IconInput icon={EditSvg} placeholder='Version Number...' inputRef={versionName} onMouseEnter={() => versionName.current?.select()} onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        addVersion()
                    }
                }} />
                {error && <label style={{ color: 'var(--badAccent)' }}>{error}</label>}
                <div className='container' style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                    <IconTextButton icon={Cross} text={"Cancel"} className='invalidButtonLike' style={{}} onClick={() => setAddNewVersion(false)} />
                    <IconTextButton icon={Plus} text={"Add"} className='accentedButtonLike' style={{}} onClick={addVersion} />
                </div>
            </div>
        </div>
    }

    return <div>
        <button className='compactButton' style={{ background: 'none' }} onClick={() => toggleDisplay()}>+ New</button>
    </div>

}

function RenderDependencies({ dependencies, onRemoveDependency }: { dependencies: PackDependency[], onRemoveDependency: () => void }) {
    const [elements, setElements] = useState<JSX.Element[]>([]);

    const getDeps = async () => {
        // console.log(dependencies)
        dependencies.sort((a, b) => a.id.localeCompare(b.id))
        let elements: JSX.Element[] = []
        for (let i = 0; i < dependencies.length; i++) {
            const d = dependencies[i]

            const metaData = await (await fetch(import.meta.env.VITE_API_SERVER + `/packs/${d.id}/meta`)).json()

            elements.push(<div className='container' key={d.id} style={{ flexDirection: 'row', width: '100%', gap: '0.5rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4" fill="none">
                    <circle cx="2" cy="2" r="2" fill="var(--foreground)" />
                </svg>
                <label key={"id" + d.id + d.version}>{metaData.rawId} v{d.version}</label>
                <div style={{ flexGrow: 1 }} />
                <button key={"btn" + d.id + d.version} className='buttonLike invalidButtonLike' onClick={() => {
                    dependencies.splice(i, 1)
                    onRemoveDependency()
                }}>
                    <Trash fill="var(--disturbing)" />
                </button>
            </div>)
        }

        setElements(elements)
    }

    useEffect(() => { getDeps() }, [dependencies.flatMap(d => d.id + d.version).join('')])

    return <div className="container" style={{ alignItems: 'start', width: '100%', gap: '1rem' }}>
        {elements}
    </div>
}

function RenderContributors({ contributors, owner, onRemoveContributor }: { contributors: string[], owner: string, onRemoveContributor: () => void }) {
    const [elements, setElements] = useState<JSX.Element[]>([]);

    const getDeps = async () => {
        let elements: JSX.Element[] = []

        for (let i = 0; i < contributors.length; i++) {
            const contributor = contributors[i]
            const userData: UserData = await (await fetch(import.meta.env.VITE_API_SERVER + `/users/${contributor}`)).json()

            elements.push(<div className='container' key={contributor} style={{ flexDirection: 'row', width: '100%', gap: '0.5rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4" fill="none">
                    <circle cx="2" cy="2" r="2" fill="var(--foreground)" />
                </svg>
                <label key={"name" + contributor}>{userData.displayName}</label>
                <div style={{ flexGrow: 1 }} />
                {contributor !== owner && <button key={"btn" + contributor} className='buttonLike invalidButtonLike' onClick={() => {
                    contributors.splice(i, 1)
                    onRemoveContributor()
                }}>
                    <Trash fill="var(--disturbing)" />
                </button>}
            </div>)
        }

        setElements(elements)
    }

    useEffect(() => { getDeps() }, [...contributors])

    return <div className="container" style={{ alignItems: 'start', width: '100%', gap: '1rem' }}>
        {elements}
    </div>
}

function NewDependency({ dependencies, onAddDependency }: { dependencies: PackDependency[], onAddDependency: () => void }) {
    const idRef = useRef<HTMLInputElement>(null)
    const versionRef = useRef<HTMLInputElement>(null)

    return <EditorDiv style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconInput icon={Folder} inputRef={idRef} style={{ width: '100%', color: 'white' }} placeholder='dependency' />
        <IconInput inputRef={versionRef} style={{ width: 'fit-content', color: 'white' }} placeholder='version' />
        <button className='buttonLike accentedButtonLike' onClick={async () => {
            if (idRef.current == null || versionRef.current == null)
                return

            const rawId = idRef.current.value
            const version = versionRef.current.value

            const metaDataResponse = await fetch(import.meta.env.VITE_API_SERVER + `/packs/${rawId}/meta`)
            if (!metaDataResponse.ok)
                alert('Invalid pack id!')
            const metaData = await metaDataResponse.json()

            if (rawId === '' || version === '') return

            const existingDependency = dependencies.find(d => d.id === metaData.docId)
            if (existingDependency)
                existingDependency.version = version
            else
                dependencies.push({ id: metaData.docId, version: version })

            idRef.current.value = ''
            versionRef.current.value = ''

            onAddDependency()
        }}>
            <Plus />
        </button>
    </EditorDiv>
}

interface SavingState {
    mode: 'off' | 'saving' | 'saved' | 'error'
    error?: {
        error: string,
        statusCode: number,
        message: string
    }
}

function SavingModal({ state, changeState }: { state: SavingState, changeState: (state: SavingState) => void }) {
    const modalContainer = useRef<HTMLDivElement>(null)
    const modalBody = useRef<HTMLDivElement>(null)


    const closeModal = (initialDelay: number) => setTimeout(async () => {
        const delay = (delay: number) => new Promise((resolve) => { setTimeout(resolve, delay) })

        // Have to reset these first for some reason
        modalBody.current?.style.setProperty('animation', '')
        modalContainer.current?.style.setProperty('animation', '')
        await delay(10)
        modalBody.current?.style.setProperty('animation', 'slideInContent 0.6s reverse')
        modalContainer.current?.style.setProperty('animation', 'fadeInBackground 1s ease-in-out reverse')
        await delay(0.6 * 1000 - 10)
        changeState({ mode: 'off' })

    }, initialDelay)

    useEffect(() => {
        if (state.mode === 'saved') {
            var timeout = closeModal(2000)
        }
        return () => {
            clearTimeout(timeout)
        }
    }, [state])

    if (state.mode === 'off')
        return <div style={{ display: 'none', position: 'absolute' }} />



    return <div style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', fontSize: '1.125rem', justifyContent: 'center', alignItems: 'center', color: 'var(--goodAccent)', backgroundColor: 'rgba(0,0,0,0.5)', animation: 'fadeInBackground 1s ease-in-out', zIndex: 10 }} ref={modalContainer}>
        <div className='container' style={{ backgroundColor: 'var(--section)', border: '0.125rem solid var(--border)', width: '100%', maxWidth: 384, aspectRatio: '2 / 1', padding: 16, borderRadius: 'var(--defaultBorderRadius)', gap: 16, animation: 'slideInContent 1s', transition: 'transform 0.6s cubic-bezier(0.87, 0, 0.13, 1)' }} ref={modalBody}>

            {state.mode === 'saving' && <div>
                <h3 style={{ margin: 0 }}>Saving pack...</h3>
                <Spinner />
            </div>}
            {state.mode === 'saved' && <div>
                <label style={{ margin: 0, fontSize: '2rem', color: 'var(--success)' }}>Pack saved!</label>
            </div>}
            {state.mode === 'error' && <div className='container' style={{ alignItems: 'center', height: '100%' }}>
                <h3 style={{ margin: 0, width: '100%', textAlign: 'center' }}>An error occured</h3>
                <label style={{ color: 'var(--subText)', width: '100%', textAlign: 'center' }}>
                    {state.error?.error}
                    <label style={{ color: 'var(--badAccent)' }}> {state.error?.statusCode}</label>
                </label>
                <p style={{ flexGrow: 1, width: '100%' }}>
                    {state.error?.message.replace('body/data/', '')}
                </p>
                <button className='buttonLike invalidButtonLike' onClick={() => closeModal(0)}>
                    Close
                </button>
            </div>}
        </div>
    </div>
}
function AddContributor({ contributors, setContributors, owner }: { contributors: string[], setContributors: (c: string[]) => void, owner: string }) {
    const [contributorToAdd, setContributorToAdd] = useState<string>('')
    return <div className='container' style={{ width: '100%', gap: '1.5rem' }}>
        <div className='container' style={{ flexDirection: 'row', justifyContent: 'start', width: '100%', gap: '1rem', fontWeight: 600 }}>
            <Account />Contributors
        </div>
        <div className='container' style={{ width: '100%', flexDirection: 'row', gap: '0.5rem' }}>
            <IconInput icon={Account} placeholder='Username/UID' style={{ width: '100%' }} onChange={(e) => setContributorToAdd(e.currentTarget.value)} />
            <button className='buttonLike accentedButtonLike' onClick={async () => {
                const response = await fetch(import.meta.env.VITE_API_SERVER + `/users/${contributorToAdd}`)
                if (!response.ok)
                    return alert('Could not find user ' + contributorToAdd)

                const { uid } = await response.json()

                setContributors([...contributors, uid])

            }} disabled={contributorToAdd === ''}><Plus /></button>
        </div>
        <RenderContributors contributors={contributors} owner={owner} onRemoveContributor={() => setContributors([...contributors])} />
    </div>
}

export function GalleryManager({ display }: { display: { gallery?: string[] } }) {
    const [selectedImage, setSelectedImage] = useState(0)
    const [images, setImages] = useState<string[]>([])

    useEffect(() => {
        setImages(display.gallery ?? [])
    }, [...(display.gallery ?? [])])

    const fileUploadRef = useRef<HTMLInputElement>(null);

    async function OnFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.currentTarget.files?.item(0)

        // console.log(file);
        if (file === undefined || file == null)
            return

        if (file.size > 1024 * 1024)
            return alert('Selected image exceeds 1MB')

        const result = await new Promise<string>((resolve) => {
            const fileReader = new FileReader()
            fileReader.readAsDataURL(file);
            fileReader.onloadend = () => {
                resolve(fileReader.result as string)
            }
        })

        if (display.gallery === undefined)
            display.gallery = []

        display.gallery.push(result)
        setImages([...display.gallery])
        setSelectedImage(display.gallery.length - 1)
    }

    return <div className='container' style={{ gap: '1rem', width: '100%' }}>
        <input ref={fileUploadRef} type="file" accept='image/png, image/jpeg' hidden onChange={OnFileUpload} />
        {display.gallery && display.gallery.length >= 1 && <div style={{ width: '100%', position: 'relative' }}>
            <img style={{ width: '100%', borderRadius: 'var(--defaultBorderRadius)' }} src={images[selectedImage]} />
            <button className='buttonLike' style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', padding: '0.5rem' }} onClick={() => {
                display.gallery?.splice(selectedImage, 1)
                setImages([...(display.gallery ?? [])])
                setSelectedImage(selectedImage > 0 ? selectedImage - 1 : 0)
            }}>
                <Trash style={{ width: '1rem', height: '1rem', fill: 'var(--text)' }} />
            </button>
        </div>}
        <div className='container' style={{ flexDirection: 'row', width: '100%', gap: '0.5rem' }}>
            {images.map((g, idx) =>
                <img key={`gImg${idx}`} src={g} className='galleryImageButton' onClick={() => setSelectedImage(idx)} />
            )}
            <span className="buttonLike" style={{ background: images.length > 0 ? 'none' : undefined, width: images.length == 0 ? '100%' : undefined }} onClick={() => {
                fileUploadRef.current?.click()
            }}><Plus />{images.length === 0 ? 'Upload image' : ''}</span>
        </div>
    </div>
}

export default function Edit() {
    const user = useFirebaseUser()
    const navigate = useNavigate()
    const { pack, new: isNew } = useQueryParams()
    const [packData, setPackData] = useState<PackData>()
    const [versions, setVersions] = useState<PackVersion[]>([])
    const [categories, setCategories] = useState<string[]>([])

    const [metaData, setMetaData] = useState<PackMetaData>()
    const [contributors, setContributors] = useState<string[]>([])
    const [contributorToAdd, setContributorToAdd] = useState<string>('')

    const [selectedVersion, setSelectedVersion] = useState(0)
    const [mcVersions, setMCVersions] = useState<string[]>([])
    const [supportedVersions, setSupportedVersions] = useState<MinecraftVersion[] | undefined>([])
    const [savingState, setSavingState] = useState<SavingState>({ mode: 'off' })
    const saveTextRef = useRef<HTMLDivElement>(null)
    let deleteConfirmation = 0;

    useEffect(() => {
        if (packData && packData.versions[selectedVersion])
            packData.versions[selectedVersion].dependencies ??= []
        if (packData && !packData.display.urls)
            packData.display.urls = {}
        setSupportedVersions(packData?.versions[selectedVersion]?.supports ?? [])
    }, [packData, selectedVersion])

    async function onLoad() {
        if (user == null) return

        const versions: string[] = await (await fetch(import.meta.env.VITE_API_SERVER + `/supported-versions`)).json()
        setMCVersions(versions)

        if (isNew) {
            setPackData({
                id: '',
                display: {
                    name: '',
                    description: '',
                    webPage: '',
                    icon: '',
                    hidden: false
                },
                versions: [],
                categories: []
            })
            return
        }

        const data: PackData = await (await fetch(import.meta.env.VITE_API_SERVER + `/packs/${pack}`, { cache: 'no-cache' })).json()
        data.versions.sort((a, b) => compare(coerce(a.name) ?? '', coerce(b.name) ?? ''))

        data.versions.forEach(v => {
            v.dependencies ??= []
        })

        const metaData: PackMetaData = await (await fetch(import.meta.env.VITE_API_SERVER + `/packs/${pack}/meta`, { cache: 'no-cache' })).json()

        setPackData(data)
        setMetaData(metaData)
        setContributors([...metaData.contributors])
        setVersions(data.versions)
        setCategories(data.categories)

    }
    useEffect(() => { onLoad() }, [pack, user])

    if (user == null) return <div className='container' style={{ height: '100%' }}>
        <h1>You must be signed in to create/edit a pack</h1>
        <div className='container' style={{ gap: '1rem', flexDirection: 'row' }}>
            <IconTextButton icon={Account} text={"Login"} href="/account" className="accentedButtonLike" />
            <IconTextButton icon={Home} text={"Go Home"} href="/" />
        </div>
    </div>
    if (packData === undefined) return <div className="container" style={{ width: '100%', height: '100vh', boxSizing: 'border-box' }}>
        <Spinner />
    </div>

    const updateVersions = () => { setVersions(Object.create(packData.versions)) }
    const savePack = async () => {
        // console.log(packData)

        setSavingState({ mode: 'saving' })


        if (!isNew) {
            var resp = await fetch(import.meta.env.VITE_API_SERVER + `/packs/${pack}?token=${await user.getIdToken()}`, { method: 'PATCH', cache: 'no-cache', body: JSON.stringify({ data: packData }), headers: { "Content-Type": "application/json" } })
        } else {
            var resp = await fetch(import.meta.env.VITE_API_SERVER + `/packs?token=${await user.getIdToken()}&id=${packData.id}`, {
                method: 'POST', body: JSON.stringify({ data: packData }), headers: {
                    "Content-Type": "application/json"
                }
            })
        }

        if (metaData && contributors !== metaData.contributors) {

            if (!contributors.includes(metaData.owner))
                contributors.push(metaData.owner)

            const newContributors = contributors.filter(c => !metaData.contributors.includes(c))
            const delContributors = metaData.contributors.filter(c => !contributors.includes(c))


            const uid = !isNew ? pack : packData.id

            if (newContributors.length > 0)
                await fetch(import.meta.env.VITE_API_SERVER + `/packs/${uid}/contributors?token=${await user.getIdToken()}&` + newContributors.map(c => "contributors=" + c).join('&'), { method: 'POST' })
            if (delContributors.length > 0)
                await fetch(import.meta.env.VITE_API_SERVER + `/packs/${uid}/contributors?token=${await user.getIdToken()}&` + delContributors.map(c => "contributors=" + c).join('&'), { method: 'DELETE' })

        }


        if (resp.status !== HTTPResponses.OK && resp.status !== HTTPResponses.CREATED) {
            const error = await resp.json()

            setSavingState({ mode: 'error', error: error })
        } else {
            setSavingState({ mode: 'saved' })
        }
    }
    const Divider = () => <div style={{ height: '0.25rem', background: 'var(--highlight)', width: '100%' }} />


    const NavigatorColumn = () => <div className='container' style={{ width: '100%', alignItems: 'end', justifyContent: 'start' }}>
        {/* <div className='container' style={{position: 'fixed', alignItems: 'start', paddingRight: '4rem'}}>
            <a>Basic Information</a>
            <a>Versions</a>
            <a>Pack Controls</a>
        </div> */}
    </div>

    const CenterColumn = () => <div className='editorContainer'>
        <div className='container' style={{ width: '100%', gap: '1rem', alignItems: 'start' }}>
            <div className="container" style={{ fontWeight: 600, flexDirection: 'row', gap: '1rem' }}>
                <TextSvg /> Basic information
            </div>
            <StringInput reference={packData} attr={'id'} disabled={!isNew} svg={Star}
                description='Unique ID that others can reference your pack by' />
            <ImageURLInput description='URL to the icon of the pack' reference={packData.display} attr={'icon'} width={64} height={64} placeholder='icon_url' svg={At} />
            <DropdownSelectionInput
                description='Choose categories that fit your pack'
                reference={packData} attr={'categories'} placeholder={'Categories'}
                options={packCategories} onChange={() => { setCategories(Object.create(packData.categories)) }} />
            <StringInput reference={packData.display} attr={'name'} svg={Jigsaw}
                description='Name of the pack' />
            <MarkdownURLInput description='URL to the ReadME of the pack' reference={packData.display} attr={'webPage'} placeholder='readme_url' />
            <StringInput reference={packData.display.urls ?? {}} attr={'discord'} placeholder='discord_url' svg={Globe} description='URL to your discord' />
            <StringInput reference={packData.display.urls ?? {}} attr={'homepage'} placeholder='official_site_url' svg={Globe} description='URL to your official site' />
            <StringInput reference={packData.display.urls ?? {}} attr={'source'} placeholder='source_url' svg={Globe} description='URL to your source code' />
            <StringInput reference={packData.display} attr={'description'} svg={TextSvg}
                description='Short description of the pack' multiline />
            <div className='container' style={{ width: '100%', flexDirection: 'column', gap: 8, alignItems: 'start' }}>
                <ChooseBox placeholder='Visibility' choices={[
                    { content: 'Public', value: 'false' },
                    { content: 'Unlisted', value: 'true' }]
                } onChange={(v) => packData.display.hidden = v === 'true' ? true : false} defaultValue={packData.display.hidden ? 'true' : 'false'} />
                <span style={{ color: 'var(--border)' }}>How should the pack appear in browse</span>
            </div>

        </div>
        <Divider />
        <div className='container' style={{ width: '100%', gap: '1rem', alignItems: 'start' }}>
            <div className="container" style={{ fontWeight: 600, flexDirection: 'row', gap: '1rem' }}>
                <Folder /> Gallery
            </div>
            <GalleryManager display={packData.display} />
        </div>
        <Divider />
        <div className='container' style={{ width: '100%', gap: '1rem' }}>
            <div className='container' style={{ flexDirection: 'row', marginBottom: '-1rem', justifyContent: 'space-between', width: '100%' }}>
                <div className="container" style={{ fontWeight: 600, flexDirection: 'row', gap: '1rem' }}>
                    <Folder /> Versions
                </div>
                <NewVersion data={packData.versions} onAddVersion={() => {
                    setVersions(Object.create(packData.versions));
                    setSelectedVersion(packData.versions.length - 1)
                }} />
            </div>
            {versions.length != 0 && <EditorDiv style={{ flexDirection: 'row' }}>
                <Selection values={versions.map(v => v.name)} onChange={setSelectedVersion} defaultValue={selectedVersion} />
            </EditorDiv>}
            <EditorDiv style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                {versions.length > 0 && <div className='container' style={{ width: '100%', gap: '1.5rem' }}>
                    <DownloadURLInput reference={packData.versions[selectedVersion]?.downloads} attr='datapack' placeholder='datapack_url' description='Raw URL to the download for the datapack' />
                    <DownloadURLInput reference={packData.versions[selectedVersion]?.downloads} attr='resourcepack' placeholder='resourcepack_url' description='Raw URL to the download for the resourcepack' />
                    <DropdownSelectionInput reference={packData.versions[selectedVersion]} attr='supports' placeholder='Supports' description='Supported Minecraft Versions' options={mcVersions} onChange={() => {

                        const s = packData.versions[selectedVersion].supports
                        s.sort((a, b) => compare(coerce(a) ?? '', coerce(b) ?? ''))
                        setSupportedVersions([...s])
                    }} />
                    <NewDependency dependencies={versions[selectedVersion].dependencies} onAddDependency={updateVersions} />
                    <RenderDependencies dependencies={versions[selectedVersion].dependencies} onRemoveDependency={updateVersions} />
                </div>}
            </EditorDiv>
        </div>
        <Divider />
        {user.uid === metaData?.owner && <AddContributor contributors={contributors} setContributors={setContributors} owner={metaData.owner} />}
        {user.uid === metaData?.owner && <Divider />}
        <div className='container' style={{ flexDirection: 'row', width: '100%', gap: '1rem' }}>
            <IconTextButton className='buttonLike invalidButtonLike' text='Cancel' icon={Cross} onClick={() => {
                navigate(-1)
            }} />
            <IconTextButton className='buttonLike successButtonLike' text='Save' icon={Check} onClick={savePack} />
        </div>
    </div >



    return <div className="container" style={{ width: '100%', height: '100%', flexDirection: 'row', alignItems: 'start', justifyContent: 'center', boxSizing: 'border-box' }}>
        <div className='editorOrganizer'>
            <NavigatorColumn />
            <CenterColumn />
        </div>
        <SavingModal state={savingState} changeState={setSavingState} />
    </div >
}

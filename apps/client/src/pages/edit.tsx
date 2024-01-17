import { CategoryBar, CategoryChoice, ChooseBox, IconInput, IconTextButton, MarkdownRenderer, Modal, PackCard, Spinner } from 'components'
import { Trash, Globe, Plus, Picture, Check, Jigsaw, Text as TextSvg, At, Refresh, File, Account, Home, Github, YouTube, Discord, ColorPicker, Cross } from 'components/svg'
import { PackData, PackDependency, PackGalleryImage, PackMetaData, PackVersion, UserData, packCategories, supportedMinecraftVersions } from 'data-types'
import { useFirebaseUser, useQueryParams } from 'hooks'
import React, { CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { coerce, compare, satisfies, inc, valid } from 'semver'
import { gzip } from 'pako'
import './edit.css'
import { Buffer } from 'buffer'
import { sanitize } from 'formatters'

function EditorDiv({ children, style, ...props }: { children: any, style?: CSSProperties, [key: string]: any }) {
    return <div className='container' style={{ alignItems: 'start', gap: 8, width: '100%', ...style }} {...props}>{children}</div>
}

const prettyString = (s: string) => (s[0].toUpperCase() + s.substring(1)).match(/[A-Z][a-z]+/g)?.join(' ') ?? s

const validUrlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/g

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




interface ImageURLInputProps extends EditorInputProps {
    width: number | string,
    height: number | string
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

export function GalleryManager({ display }: { display: { gallery?: PackGalleryImage[] } }) {
    const [selectedImage, setSelectedImage] = useState(0)
    const [images, setImages] = useState<PackGalleryImage[]>([])

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

    return <>
        <input ref={fileUploadRef} type="file" accept='image/png, image/jpeg' hidden onChange={OnFileUpload} />
        {display.gallery && display.gallery.length >= 1 && <div style={{ width: '100%', position: 'relative' }}>
            <img style={{ width: '100%', borderRadius: 'var(--defaultBorderRadius)' }} src={((g: PackGalleryImage) => typeof (g) === 'object' ? g.content : g)(images[selectedImage])} />
            <button className='buttonLike' style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', padding: '0.5rem' }} onClick={() => {
                display.gallery?.splice(selectedImage, 1)
                setImages([...(display.gallery ?? [])])
                setSelectedImage(selectedImage > 0 ? selectedImage - 1 : 0)
            }}>
                <Trash style={{ width: '1rem', height: '1rem', fill: 'var(--text)' }} />
            </button>
        </div>}
        <div className='uploaded' style={{ gridColumn: images.length == 0 ? '1/3' : undefined }}>
            {images.map((g, idx) =>
                <img key={`gImg${idx}`} src={typeof (g) === 'object' ? g.content : g} className='galleryImageButton' onClick={() => setSelectedImage(idx)} />
            )}
            <span className="buttonLike galleryUploadImage" style={{ background: images.length > 0 ? 'none' : undefined, width: images.length == 0 ? '100%' : undefined }} onClick={() => {
                fileUploadRef.current?.click()
            }}><Plus />{images.length === 0 ? 'Upload gallery image' : ''}</span>
        </div>
    </>
}
function getPropertyByPath(obj: any, path: string) {
    const properties = path.split('/'); // Split the path string into an array of property names

    let currentObj = obj;
    for (let prop of properties) {
        if (currentObj && currentObj.hasOwnProperty(prop)) {
            currentObj = currentObj[prop]; // Access the property in the object
        } else {
            return undefined; // Property not found
        }
    }
    return currentObj; // Return the final property value
}

function setPropertyByPath(obj: any, path: string, data: any) {
    const properties = path.split('/'); // Split the path string into an array of property names
    const target = properties.pop();

    if (!target)
        return


    let currentObj = obj;
    for (let prop of properties) {
        if (currentObj && currentObj.hasOwnProperty(prop)) {
            currentObj = currentObj[prop]; // Access the property in the object
        } else if (!currentObj.hasOwnProperty(prop)) {
            currentObj[prop] = {}
            currentObj = currentObj[prop]
        }
    }

    if (typeof (currentObj) === 'object')
        currentObj[target] = data;
}

let depUidToRaw: Record<string, string> = {}
let initialContributors: string[] = []

export default function Edit() {
    const user = useFirebaseUser()
    const { pack: packIdParam, new: isNew, tab: currentTab } = useQueryParams()

    const navigate = useNavigate()

    const [tab, setTab] = useState<string>((currentTab ?? 'project-details') as string)
    const [packData, setPackData] = useState<PackData>()
    const [packMetaData, setPackMetaData] = useState<PackMetaData>();

    const [versions, setVersions] = useState<PackVersion[]>([])
    const [selectedVersion, setSelectedVersion] = useState<PackVersion>()

    const updateVersions = () => {
        let versions = [...packData?.versions ?? []]
            .sort((a, b) => compare(a.name, b.name))

        setVersions(versions)
    }
    // const selectedVersion = useSignal('')
    // const selectedVersion = { value: '' }

    // const [selectedVersion, setSelectedVersion] = useState('')


    const [savingState, setSavingState] = useState<SavingState>({ mode: 'off' })
    const [readme, setReadme] = useState('')



    // useEffect(() => {
    //     if (!packData)
    //         return;
    //     let v = packData.versions.find(v => v.name === selectedVersion.value)

    //     if (v) {
    //         v.dependencies ??= []
    //     }
    //     if (!packData.display.urls)
    //         packData.display.urls = {}

    // }, [packData])

    useEffect(() => {
        loadReadme()
    }, [packData])


    useEffect(() => {
        updateVersions()
        setSelectedVersion(packData?.versions[0])
    }, [packData])

    async function loadReadme() {
        if (!packData?.display.webPage)
            return

        const response = await fetch(packData.display.webPage)

        if (!response.ok) {
            setReadme('<span style="color: red;">Failed to load readme!</span>')
            return
        }
        const newReadme = await response.text()
        setReadme(newReadme)
    }

    async function onLoad() {
        if (user == null) return

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
            setPackMetaData({
                contributors: [user.uid],
                owner: user.uid,
                stats: {
                    downloads: {
                        today: 0,
                        total: 0
                    },
                    added: 0,
                },
                docId: '',
                rawId: ''
            })
            return
        }

        const data: PackData = await (await fetch(import.meta.env.VITE_API_SERVER + `/packs/${packIdParam}`, { cache: 'no-cache' })).json()
        data.versions.sort((a, b) => compare(coerce(a.name) ?? '', coerce(b.name) ?? ''))

        data.versions.forEach(v => {
            v.name = valid(v.name) ? v.name : (coerce(v.name) ?? '0.0.0') as string
            v.dependencies ??= []
        })

        const metaData: PackMetaData = await (await fetch(import.meta.env.VITE_API_SERVER + `/packs/${packIdParam}/meta`, { cache: 'no-cache' })).json()

        data.id = metaData.rawId

        setPackData(data)
        initialContributors = [...metaData.contributors]
        setPackMetaData(metaData)
    }
    useEffect(() => { onLoad() }, [packIdParam, user])

    async function savePack() {
        if (packData === undefined)
            return;

        setSavingState({ mode: 'saving' })

        const token = await user?.getIdToken()

        const packId = isNew ? packData.id : packIdParam

        const uri = isNew ?
            `/packs?id=${packId}&token=${token}`
            : `/packs/${packId}?token=${token}`

        console.log(uri)
        const body = gzip(JSON.stringify({
            data: packData
        }))
        console.log(body.byteLength);

        const mainSaveResp = await fetch(
            import.meta.env.VITE_API_SERVER + uri,
            {
                method: isNew ? 'POST' : 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Encoding': 'gzip'
                },
                body: body,

            }
        )

        if (!mainSaveResp.ok) {
            setSavingState({
                mode: 'error',
                error: await mainSaveResp.json()
            })
            return
        }

        if (packMetaData && packMetaData.owner === user?.uid && packMetaData.contributors !== initialContributors) {
            const newContributors = packMetaData.contributors.filter(c => !initialContributors.includes(c))

            const postContributorsResp = await fetch(
                import.meta.env.VITE_API_SERVER
                + `/packs/${packId}/contributors?token=${token}&contributors=`
                + newContributors.join('&contributors='),
                {
                    method: 'POST'
                }
            )

            if (!postContributorsResp.ok) {
                setSavingState({
                    mode: 'error',
                    error: await postContributorsResp.json()
                })
                return
            }

            const removedContributors = initialContributors.filter(c => !packMetaData.contributors.includes(c))

            const delContributorsResp = await fetch(
                import.meta.env.VITE_API_SERVER
                + `/packs/${packId}/contributors?token=${token}&contributors=`
                + removedContributors.join('&contributors='),
                {
                    method: 'DELETE'
                }
            )

            if (!delContributorsResp.ok) {
                setSavingState({
                    mode: 'error',
                    error: await delContributorsResp.json()
                })
                return
            }
        }


        setSavingState({ mode: 'saved' })
    }

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

    function TextInput({ area, path, icon, placeholder, onChange, dataRef, validate }: {
        area: string,
        path: string,
        icon: any,
        placeholder: string,
        dataRef?: any
        validate?: (v: string) => string | undefined,
        onChange?: (e: React.FormEvent<HTMLInputElement>) => void,
    }) {
        const [error, setError] = useState<string>()

        return <div className='inputField' style={{
            gridArea: area,
            position: 'relative'
        }}>
            <IconInput className={error ? 'invalidInput' : ''} style={{ width: '100%', zIndex: error ? 2 : undefined }} id={path} icon={icon} placeholder={placeholder} defaultValue={getPropertyByPath(dataRef ?? packData, path)} onChange={e => {
                const value = e.currentTarget.value

                const error = validate && value !== '' && value !== undefined ? validate(value) : undefined
                if (error !== undefined) {
                    setError(error)
                    return
                } else {
                    setError(undefined)
                }

                setPropertyByPath(dataRef ?? packData, path, value)
                if (onChange)
                    onChange(e)
            }} />

            <div className="container" style={{
                position: 'absolute',
                right: error ? 0 : undefined,
                left: error ? 'calc(100% - var(--defaultBorderRadius)' : 0,
                width: 'max-content',
                height: '100%',
                backgroundColor: 'var(--disturbing)',
                paddingLeft: 'calc(var(--defaultBorderRadius) + 1rem)',
                paddingRight: '1rem',
                borderRadius: '0 var(--defaultBorderRadius) var(--defaultBorderRadius) 0',
                zIndex: error ? 1 : -1,
                transition: ['right', 'left', 'opacity'].map(v => `${v} 0.3s ease-in-out`).join(', '),
                transitionDelay: error ? undefined : '0.1s',
                overflow: 'hidden',
                opacity: error ? 1 : 0
            }}>
                <span style={{ zIndex: 2 }}>{error}</span>
            </div>
        </div>
    }

    const LargeTextInput = ({ area, path, placeholder }: { area: string, path: string, placeholder: string }) =>
        <textarea id={path} placeholder={placeholder} className='input inputField' style={{
            gridArea: area, height: '100%', resize: 'none'
        }} defaultValue={getPropertyByPath(packData, path)} onChange={e => {
            e.currentTarget.value = e.currentTarget.value.replace('\n', '')
            setPropertyByPath(packData, path, e.currentTarget.value)
        }} />



    function Dependencies({ version }: { version: PackVersion }) {
        const [dependencies, setDependencies] = useState<PackDependency[]>(version.dependencies)

        async function getResolvedDep(id: string, version: string): Promise<PackDependency> {
            // Grab the cached value if present
            if (id in depUidToRaw)
                return {
                    id: depUidToRaw[id],
                    version: version
                }


            const resp = await fetch(import.meta.env.VITE_API_SERVER + `/packs/${id}/meta`);
            const data: PackMetaData = await resp.json()

            depUidToRaw[id] = data.rawId

            return {
                id: data.rawId,
                version: version
            }
        }

        async function getDependencies() {

            const resolvedDependencies = await Promise.all(
                version.dependencies.map(d => getResolvedDep(d.id, d.version))
            )

            setDependencies(resolvedDependencies.sort((a, b) => a.id.localeCompare(b.id)))
        }

        useMemo(() => {
            getDependencies()
        }, [version.dependencies.length])

        return <div className='dependencies'>
            <IconInput className='inputField' id="new_dep_id" icon={At} placeholder='Dependency ID' onChange={(v) => {
                v.currentTarget.parentElement!.classList.remove('invalidInput')
            }} />
            <IconInput className='inputField' id="new_dep_version" icon={ColorPicker} placeholder='Version ID' onChange={(v) => {
                v.currentTarget.parentElement!.classList.remove('invalidInput')
            }} />
            <button style={{ backgroundColor: 'transparent' }}>
                <Trash />
            </button>

            {dependencies.map((d, i) => <>
                <IconInput className='inputField' key={"dep_" + i + "_id"} icon={At} placeholder='Dependency ID' value={d.id} disabled />
                <IconInput className='inputField' key={"dep_" + i + "_ve"} icon={At} placeholder='Version ID' value={d.version} onChange={(v) => {
                    version.dependencies[i].version = v.currentTarget.value
                }} />
                <button key={"dep_" + i + "_de"} style={{ backgroundColor: 'transparent' }} onClick={() => {
                    version.dependencies.splice(i)
                }}>
                    <Trash />
                </button>
            </>)}

            <div className='container' style={{ width: '100%', gridColumn: '1/4' }}>
                <IconTextButton icon={Plus} text="Add" reverse style={{ backgroundColor: 'transparent' }} onClick={async () => {
                    const idElement = document.getElementById("new_dep_id")! as HTMLInputElement
                    const id = idElement.value
                    const versionElement = document.getElementById("new_dep_version")! as HTMLInputElement
                    const versionName = versionElement.value

                    if (id === '' || versionName === '')
                        return

                    const packDataResp = await fetch(import.meta.env.VITE_API_SERVER + `/packs/${id}`)
                    if (!packDataResp.ok) {
                        idElement.parentElement!.classList.add('invalidInput')
                        return alert(`Invalid pack id ${id}`)
                    }
                    const packData: PackData = await packDataResp.json()

                    const versions = packData.versions.map(v => v.name).filter(v => satisfies(v, versionName))

                    if (versions.length === 0) {
                        versionElement.parentElement!.classList.add('invalidInput')
                        return alert(`Invalid version ${versionName}, does not exist on pack ${id}`)
                    }

                    const metaDataResp = await fetch(import.meta.env.VITE_API_SERVER + `/packs/${id}/meta`)
                    const metaData: PackMetaData = await metaDataResp.json()


                    version.dependencies.push({
                        id: metaData.docId,
                        version: versionName
                    })

                    idElement.value = ''
                    versionElement.value = ''
                }} />
            </div>
        </div>
    }

    function VersionInfo({ version }: { version?: PackVersion }) {

        if (version === undefined) return <div className='container' style={{ gridColumn: '1/3' }}>
            No versions
        </div>

        return <>
            <TextInput dataRef={version} area='name' path="name" icon={At} placeholder='Version x.y.z' validate={(newName) => {
                if ((packData?.versions.filter(v => v.name === newName) ?? []).length > 1)
                    return 'Duplicate version!'
                if (valid(newName) == null)
                    return 'Invalid SemVer!'

                return undefined
            }} />
            <ChooseBox
                style={{ gridArea: 'supports' }}
                placeholder='Supported Versions'
                choices={supportedMinecraftVersions.map(version => ({ value: version, content: version }))}
                onChange={(v) => {
                    version.supports = typeof v === 'string' ? [v] : v
                }}
                defaultValue={version.supports ?? []}
                multiselect />
            <TextInput dataRef={version} area='datapack' path="downloads/datapack" icon={Globe} placeholder='Datapack URL' validate={(url) => !validUrlRegex.test(url) ? 'Invalid url' : undefined} />
            <TextInput dataRef={version} area='resourcepack' path="downloads/resourcepack" icon={Globe} placeholder='Resourcepack URL (Optional)' validate={(url) => !validUrlRegex.test(url) ? 'Invalid url' : undefined} />
            <span style={{ fontWeight: 500, gridArea: 'dependencyHeader', width: '100%' }}>Dependencies:</span>
            <Dependencies version={version} />
        </>
    }

    const closeGithubModal = () => document
        .getElementById("githubImportModal")!
        .style
        .setProperty('display', 'none')

    function updateValue(path: string, content: string) {
        const input = document.getElementById(path) as HTMLInputElement | null
        if (input != null) {
            input.value = content
            input.src = content
            console.log(input)
        }

        setPropertyByPath(packData, path, content)
    }

    const ProjectDetails = () => <div className='editProjectDetails'>
        <div className='main'>
            {/* <StringInput reference={packData} attr={'id'} disabled={!isNew} svg={Star}
                description='Unique ID that others can reference your pack by' /> */}
            <TextInput area="id" path="id" icon={At} placeholder='Project id' />
            <div className='iconGrid'>
                <Modal style={{ gridArea: 'icon', cursor: 'pointer' }} offset="1rem" trigger={
                    <div style={{ gridArea: 'icon', width: '8rem', height: '8rem', borderRadius: 'var(--defaultBorderRadius)', backgroundColor: 'var(--bold)', border: '0.125rem solid var(--border)', overflow: 'hidden' }}>
                        <img id="display/icon/img" src={packData.display.icon} style={{ width: '100%', height: '100%', display: packData.display.icon ? 'initial' : 'none' }} onError={(e) => { e.currentTarget.style.setProperty('display', 'none') }} />
                    </div>}
                    content={() => <>
                        <TextInput area="" path="display/icon" icon={Picture} placeholder='Project icon' onChange={(v) => {
                            const img = document.getElementById("display/icon/img")! as HTMLImageElement

                            img.setAttribute('src', v.currentTarget.value)
                            img.style.setProperty('display', 'initial')
                        }} />
                    </>}
                />
                <TextInput area="name" path="display/name" icon={Jigsaw} placeholder='Project name' />
                <LargeTextInput area="description" path="display/description" placeholder='Short project description' />
            </div>
            <IconTextButton icon={Github} className='inputField' style={{ gridArea: 'import' }} text="Import from github" reverse onClick={() => document.getElementById("githubImportModal")?.style.setProperty('display', 'flex')} />
            <div id="githubImportModal" className="container" style={{ display: 'none', position: 'fixed', top: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.25)', width: '100%', height: '100%', zIndex: 10 }}>
                <div style={{ width: 'min-content' }}>
                    <div className='container' style={{ gap: '1rem', backgroundColor: 'var(--section)', padding: '1rem', borderRadius: 'calc(var(--defaultBorderRadius) * 1.5)', border: '0.125rem solid var(--border)' }}>
                        <IconInput id="githubUrl" type="url" icon={Globe} placeholder='Github URL' />
                        <div className='container' style={{ flexDirection: 'row', gap: '1rem' }}>
                            <IconTextButton className="invalidButtonLike" icon={Cross} text={"Cancel"} onClick={closeGithubModal} />
                            <IconTextButton className="successButtonLike" icon={Check} text={"Confirm"} onClick={async () => {
                                const url = (document.getElementById("githubUrl") as HTMLInputElement).value
                                const match = /https:\/\/(?:www.)?github.com\/([^\/]+)\/([^\/]+)/g.exec(url)

                                if (match == null) {
                                    alert('Invalid github url!')
                                    return
                                }

                                const [_, owner, repo] = match

                                let resp = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`)

                                if (!resp.ok) {
                                    return alert('Failed to fetch files in github repo!\nUrl may be invalid or the repo is private')
                                }

                                let files: { name: string, path: string, download_url: string, type: string }[] = await resp.json()
                                let rootReadme = files.find(f => f.name.toLowerCase() === "readme.md")?.download_url;

                                for (let file of files) {
                                    if (file.name === 'pack.png' || file.name === 'icon.png') {
                                        updateValue("display/icon", file.download_url)

                                        const img = document.getElementById('display/icon/img')! as HTMLInputElement

                                        img.src = file.download_url
                                        img.style.setProperty('display', null)

                                        break
                                    }

                                    if (file.type === 'dir') {
                                        files.push(...(await (await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`)).json()))
                                    }
                                }


                                if (rootReadme)
                                    updateValue("display/webPage", rootReadme)

                                resp = await fetch(`https://api.github.com/repos/${owner}/${repo}`)

                                if (!resp.ok) {
                                    return alert('Failed to fetch info about github repo!\nUrl may be invalid or the repo is private')
                                }

                                const repoInfo: { name: string, description: string, homepage: string } = await resp.json()
                                const name = repoInfo.name.replace(/([a-z])([A-Z])/g, '$1 $2')

                                updateValue("id", sanitize(name))
                                updateValue("display/name", name)
                                updateValue("display/description", repoInfo.description)
                                updateValue("display/urls/source", `https://github.com/${owner}/${repo}`)
                                updateValue("display/urls/homepage", repoInfo.homepage)

                                closeGithubModal()
                            }} />
                        </div>
                    </div>
                </div>
            </div>
            <ChooseBox style={{ gridArea: 'visibility' }} placeholder='Visibility' choices={[
                { content: 'Public', value: 'false' },
                { content: 'Unlisted', value: 'true' }]
            } onChange={(v) => packData.display.hidden = v === 'true' ? true : false} defaultValue={packData.display.hidden ? 'true' : 'false'} />
            <TextInput area="website" path="display/urls/homepage" icon={Globe} placeholder='Project website' />
            <TextInput area="sourceCode" path="display/urls/source" icon={Github} placeholder='Source code' />
            <TextInput area="video" path="display/urls/video" icon={YouTube} placeholder='YouTube showcase' />
            <TextInput area="discord" path="display/urls/discord" icon={Discord} placeholder='Discord server' />
        </div>
        <div className='categories'>
            <span style={{ gridColumn: '1/3', width: '100%', textAlign: 'center', fontWeight: 500 }}>Categories</span>
            {packCategories.map(c => <span
                className={`categoryChoice ${packData.categories.includes(c) ? 'selected' : ''}`}
                key={"categoryChoice" + c.replace(' ', '')}
                onClick={(e) => {
                    if (packData.categories.includes(c)) {
                        e.currentTarget.classList.remove('selected')
                        packData.categories = packData.categories.filter(cat => cat != c)
                    } else {
                        e.currentTarget.classList.add('selected')
                        packData.categories.push(c)
                    }
                }}>
                {c}
                <Check />
            </span>
            )}
        </div>
        <div className='gallery'>
            <GalleryManager display={packData.display} />
        </div>
        <div className='readme'>
            <div className='container' style={{ flexDirection: 'row', backgroundColor: 'var(--section)', padding: '1rem', gap: '1rem' }}>
                <TextInput area="" placeholder='Link to README.md' icon={Globe} path="display/webPage" />
                <IconTextButton reverse className="accentedButtonLike" icon={Refresh} text="Update preview" onClick={loadReadme} />
            </div>
            <div style={{ backgroundColor: 'var(--bold)', padding: '0rem 1rem 1rem 1rem', height: '100%', margin: 0, overflow: 'hidden' }}>
                <MarkdownRenderer>
                    {readme}
                </MarkdownRenderer>
            </div>
        </div>
    </div >

    function VersionSelect({ packData }: { packData: PackData }) {

        const select = (version: PackVersion) => {
            const matches = packData.versions.filter(v => v.name === selectedVersion?.name)

            if (matches.length > 1)
                return alert('Resolve version name conflict!')

            if (selectedVersion !== undefined && valid(selectedVersion?.name) == null)
                return alert('Selected version name is not valid SemVer')

            setSelectedVersion(version)
        }

        return <>
            {[...versions].sort((a, b) => compare(a.name, b.name)).map((v, i) => <span className={`versionChoice ${(v === selectedVersion) ? 'selected' : ''}`} key={v.name} onClick={(e) => {
                if (!(e.target instanceof HTMLSpanElement))
                    return
                select(v)
            }}>
                <span id={`packVersionOption${v.name}`}>{v.name}</span>
                {versions.length > 1 && <div id="trashButton" className="container" style={{
                    position: 'absolute', right: '0.75rem', top: 0,
                    height: '100%',
                    transition: 'all 0.2s ease-in-out'
                }}>
                    <button style={{ backgroundColor: 'transparent', width: '2rem', height: '2rem', padding: 0 }} onClick={(e) => {
                        e.preventDefault()
                        const idx = packData.versions.findIndex(version => version === v)
                        packData.versions.splice(idx, 1)

                        if (selectedVersion === v) {
                            setSelectedVersion(packData.versions[packData.versions.length === idx ? idx - 1 : idx])
                        }

                        updateVersions()
                    }}>
                        <Trash />
                    </button>
                </div>}
            </span>)}

            {versions.length > 0 && <div style={{ flexGrow: 1 }} />}

            <div className='container' style={{ width: '100%' }}>
                <IconTextButton icon={Plus} text="Add" reverse style={{ backgroundColor: 'transparent' }} onClick={() => {
                    const nextVersion = inc([...versions].sort((a, b) => compare(a.name, b.name)).at(-1)?.name ?? '0.0.0', 'patch') ?? ''
                    packData.versions.push({
                        name: nextVersion,
                        downloads: {},
                        dependencies: [],
                        supports: []
                    })
                    updateVersions()
                    // setVersions(packData.versions.map(v => v.name))
                }} />
            </div>
        </>
    }

    const Versions = () => <div className='editVersions'>
        <div className='versionSelect'>
            <VersionSelect packData={packData} />
        </div>
        <div className='versionInfo'>
            <VersionInfo version={selectedVersion} />
        </div>
    </div >

    function Management() {
        const [contributors, setContributors] = useState<{ name: string, id: string }[]>()
        const [showConfirmDeletion, setShowConfirmDeletion] = useState(false)

        async function getPrettyNames() {
            if (!packMetaData)
                return

            async function fetchName(id: string) {
                const resp = await fetch(import.meta.env.VITE_API_SERVER + `/users/${id}`)
                return { id: id, name: (await resp.json()).displayName }
            }

            const contributors = await Promise.all(packMetaData.contributors.filter(c => c !== '').map(c => fetchName(c)))
            setContributors(contributors)
        }

        useEffect(() => {
            getPrettyNames()
        }, [packMetaData?.contributors])

        return <div className='editManagement'>
            <div className='container' style={{ width: 'min-content', backgroundColor: 'var(--bold)', padding: '1rem', gap: '1rem', borderRadius: 'calc(var(--defaultBorderRadius) * 1.5)' }}>
                <div className='container' style={{ flexDirection: 'row', gap: '1rem' }}>
                    <IconInput id="contributorId" icon={Account} placeholder='Contributor' />
                    <button style={{ backgroundColor: 'transparent' }} onClick={async () => {
                        const input = document.getElementById("contributorId")! as HTMLInputElement
                        if (input.value === '')
                            return

                        const userResp = await fetch(import.meta.env.VITE_API_SERVER + `/users/${input.value}`)

                        if (!userResp.ok)
                            return

                        const user: UserData = await userResp.json()

                        if (packMetaData?.contributors.includes(user.uid))
                            return;

                        packMetaData?.contributors.push(user.uid)
                        setContributors([...(contributors ?? []), {
                            id: user.uid,
                            name: user.displayName
                        }])

                        input.value = ""
                    }}>
                        <Plus />
                    </button>
                </div>

                {contributors?.sort((a, b) => a.id === packMetaData?.owner ? -1 : a.name.localeCompare(b.name)).map((c, i) => <div className='container' key={c.id} style={{ flexDirection: 'row', width: '100%' }}>
                    <span>
                        {c.name}
                        {c.id === packMetaData?.owner && <span style={{ opacity: 0.3, paddingLeft: '1rem' }}>(Owner)</span>}
                    </span>
                    <div style={{ flexGrow: 1 }} />
                    <button style={{ backgroundColor: 'transparent' }} disabled={c.id === packMetaData?.owner} onClick={() => {
                        const curContributors = packMetaData?.contributors
                        curContributors?.splice(curContributors.findIndex(id => id === c.id), 1)

                        contributors.splice(i, 1)
                        setContributors([...contributors])
                    }}>
                        <Cross />
                    </button>
                </div>)}
            </div>
            {!isNew && <>
                {!showConfirmDeletion && <IconTextButton className='buttonLike invalidButtonLike' text={"Delete Pack"} icon={Trash} onClick={(e) => {
                    alert('This action is irreversible, type the pack id to confirm.')
                    setShowConfirmDeletion(true)
                }} />}
                {showConfirmDeletion && <div className="container" style={{ flexDirection: 'row', gap: '1rem'}}>
                    <IconInput id="confirmationId" icon={At} placeholder='Project id' />
                    <a className='buttonLike invalidButtonLike' onClick={async () => {
                        const input = document.getElementById("confirmationId")! as HTMLInputElement

                        if (input.value != packData?.id)
                            return;

                        const deleteResp = await fetch(
                            import.meta.env.VITE_API_SERVER
                            + `/packs/${packIdParam}?token=${await user?.getIdToken()}`,
                            {
                                method: 'DELETE'
                            }
                        )
                        
                        if (deleteResp.ok) {
                            alert('Pack has been deleted.')
                            navigate('/' + user?.uid);
                        } else {
                            alert('Failed to delete pack.')
                        }
                    }}>
                        <Trash />
                    </a>
                </div>}
            </>}
        </div>
    }


    return <div className="container" style={{ width: '100%', height: '100%', flexDirection: 'column', alignItems: 'start', justifyContent: 'center', boxSizing: 'border-box', gap: '4rem' }}>
        <CategoryBar defaultValue={(currentTab ?? 'project-details') as string} onChange={v => {
            setTab(v);
            // navigate(`?tab=${v}${pack != null ? '&pack=' + pack : ''}${isNew != null ? '&new=' + isNew : ''}`)
        }}>
            <CategoryChoice text='Details' icon={<TextSvg />} value='project-details' />
            <CategoryChoice text='Versions' icon={<File />} value='versions' />
            <CategoryChoice text='Management' icon={<Account />} value='management' hidden={user.uid !== packMetaData?.owner} />
        </CategoryBar>
        <div className='editorOrganizer'>
            {tab === 'project-details' && <ProjectDetails />}
            {tab === 'versions' && <Versions />}
            {tab === 'management' && <Management />}
        </div>
        <div className='container' style={{ flexDirection: 'row', width: '100%', gap: '1rem' }}>
            <IconTextButton className='buttonLike invalidButtonLike' text='Cancel' icon={Cross} onClick={() => {
                navigate(-1)
            }} />
            <IconTextButton className='buttonLike successButtonLike' text='Save' icon={Check} onClick={savePack} />
        </div>
        <SavingModal state={savingState} changeState={setSavingState} />
    </div >

}

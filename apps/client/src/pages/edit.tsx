import { e } from '@tauri-apps/api/event-2a9960e7'
import { ErrorPage, Spinner } from 'components'
import { PackData } from 'data-types'
import { useFirebaseUser, useQueryParams } from 'hooks'
import React, { useEffect, useState } from 'react'

interface InputWithTooltipProps {
    tooltip: any,
    offset?: number,
    [key: string]: any
}
function Tooltip({ tooltip, offset, ...props }: InputWithTooltipProps) {
    const [mouseOver, setMouseOver] = useState<number[] | undefined>(undefined)

    return <div className="container" style={{ width: '100%', flexDirection: 'row', justifyContent: 'start' }} onMouseOver={(e) => { if (mouseOver === undefined) setMouseOver([e.clientX, e.clientY]) }} onMouseOut={() => setMouseOver(undefined)}>
        <div className="container" style={{ width: '100%', ...props.style }}>{props.children}</div>
        {(mouseOver && tooltip !== undefined) && <div style={{ position: 'absolute', top: mouseOver[1], left: mouseOver[0], backgroundColor: 'var(--accent)', color: 'var(--buttonText)', border: `4px solid var(--backgroundAccent)`, borderRadius: 24, padding: 8 }}>
            {tooltip}
        </div>}
    </div>


}

function Visibility({ data }: any) {
    return <div className='container' style={{ justifyContent: 'left', alignItems: 'start', gap: 8 }}>
        {
            [
                ['Show in Browse', 'Public'],
                ['Show in search and user page', 'Unlisted'],
                ['Hidden everywhere', 'Private']
            ].map((pair => <Tooltip tooltip={pair[0]} style={{ justifyContent: 'start' }}>
                <div className='container' style={{ flexDirection: 'row', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
                    <input style={{ width: '100%', maxWidth: '512px' }}
                        type="radio" name="visibility" id={pair[1].toLowerCase()} defaultChecked={data.visibility === pair[1].toLowerCase()} onChange={(e) => data.visibility = pair[1].toLowerCase()}
                    /><label>{pair[1]}</label>
                </div>
            </Tooltip>))
        }
    </div>
}

interface EditorProps {
    data: any,
    title: string,
    map: {
        [key: string]: {
            type: 'string'
            description: string
            preview?: () => JSX.Element | JSX.Element[]
        } | {
            type: 'enum',
            options: { description: string, value: string }[]

        }
    }
}

function Editor({ data, map, title }: EditorProps) {
    const pretty = (s: string) => (s[0].toUpperCase() + s.substring(1)).match(/[A-Z][a-z]+/g)?.join(' ') ?? s

    return <div className="container" style={{ alignItems: 'center', backgroundColor: 'var(--backgroundAccent)', padding: 24, borderRadius: 24, width: '100%', maxWidth: '526px' }}>
        <h2>{title}</h2>
        <form className='container' style={{ gap: 16, width: '100%', alignItems: 'start' }}>
            {Object.keys(map).map(attr => {
                const field = map[attr]
                switch (field.type) {
                    case 'string':
                        return <Tooltip offset={0} tooltip={field.description}>
                            <h3 style={{ textAlign: 'left', width: '100%', marginBottom: 4, marginTop: 4 }}>{pretty(attr)}</h3>
                            <div className='container' style={{ width: '100%', gap: 8, alignItems: 'start' }}>
                                <input type="text" placeholder={pretty(attr) + '...'} onChange={(e) => data[attr] = e.currentTarget.value} value={data[attr]} style={{ width: '100%', maxWidth: 512 }} />
                                {field.preview && field.preview()}
                            </div>
                        </Tooltip>
                    case 'enum':
                        return <div className="container" style={{ gap: 8 }}>
                            <h3 style={{ textAlign: 'left', width: '100%', marginBottom: 4, marginTop: 4 }}>{pretty(attr)}</h3>
                            {field.options.map((o) => <Tooltip tooltip={o.description} style={{ alignItems: 'start', width: 200 }}>
                                <div className='container' style={{ flexDirection: 'row', backgroundColor: 'var(--background)', width: '100%', justifyContent: 'left', borderRadius: 24, padding: 8 }}>
                                    <input type="radio" name={attr} value={o.value} onChange={(e) => data[attr] = e.currentTarget.value} defaultChecked={data[attr] === o.value} />
                                    <label>{pretty(o.value)}</label>
                                </div>
                            </Tooltip>)}
                        </div>
                }
            })}
        </form>
    </div>
}

export default function Edit() {
    const user = useFirebaseUser()
    const { pack } = useQueryParams()
    const [packData, setPackData] = useState<PackData>()


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
            <Editor data={packData.display} title={'Display'} map={{
                'visibility': {
                    type: 'enum',
                    options: [
                        { value: 'public', description: 'Shown in browse' },
                        { value: 'unlisted', description: 'Shown on user pages and when searched' },
                        { value: 'private', description: 'Hidden everywhere' }
                    ]
                },
                'name': { type: 'string', description: 'Name of the pack' },
                'description': { type: 'string', description: 'Short description of the pack' },
                'icon': { type: 'string', description: 'URL to the icon of the pack', preview: () => <img src={packData.display.icon} style={{ width: 64, height: 64, backgroundColor: 'var(--background)', borderRadius: 24, padding: 8 }} /> },
                'webPage': { type: 'string', description: 'URL to the ReadME, must be a raw link' }
            }} />
            <div className='container' style={{width: '100%', maxWidth: 526, gap: 24}}>
                <Editor data={packData.display} title={'Versions'} map={{
                    'visibility': {
                        type: 'enum',
                        options: [
                            { value: '0.0.1', description: 'Shown in browse' },
                            { value: '0.0.2', description: 'Shown on user pages and when searched' },
                            { value: '0.0.3', description: 'Hidden everywhere' }
                        ]
                    },
                }} />
                <Editor data={packData.display} title={'0.0.1'} map={{
                    'datapack': { type: 'string', description: 'Name of the pack' },
                    'resourcepack': { type: 'string', description: 'Short description of the pack' },
                    'dependencies': { type: 'string', description: '' }
                }} />
            </div>

        </div>
    </div>
}
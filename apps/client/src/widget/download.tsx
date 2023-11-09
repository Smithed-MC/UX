import { PackVersionDownload } from "components";
import { PackData, PackEntry } from 'data-types';
import React from "react";
import './download.css'
import semver from 'semver'

interface DownloadProps {
    style?: React.CSSProperties
    packData: PackData,
    id: string
}

export default function Download({style, packData, id, ...props}: DownloadProps) {
    const versions = packData.versions.sort((a,b) => semver.compare(semver.coerce(a.name) ?? '', semver.coerce(b.name) ?? ''))
    // console.log(versions)
    return <div className="downloadRoot" {...props} style={{animation: 'pullIn 1s', gap: 16, width: '100%', boxSizing: 'border-box', maxWidth: 320, ...style}}>
        <label style={{fontSize: '2rem', textDecoration: 'underline'}}>Downloads</label>
        <a className="button downloadButton" style={{fontSize: '1rem', maxWidth: 196, width: '100%'}} rel="nofollow" href={import.meta.env.VITE_API_SERVER + `/download?pack=${id}`}>Download Latest</a>
        <div className="container" style={{width: '100%', gap: 16, flexDirection: 'column-reverse'}}>
            {versions.map(v => <PackVersionDownload key={v.name} version={v} packId={id}/>)}
        </div>
    </div>
}
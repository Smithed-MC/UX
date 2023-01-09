import { PackVersionDownload } from "components";
import { PackData, PackEntry } from "data-types";
import React from "react";
import './download.css'
import semver from 'semver'

interface DownloadProps {
    style?: React.CSSProperties
    packData: PackData,
    id: string
}

export default function Download({style, packData, id, ...props}: DownloadProps) {
    return <div className="downloadRoot" {...props} style={{animation: 'pullIn 1s', gap: 16, width: '100%', boxSizing: 'border-box', maxWidth: 320, ...style}}>
        <label style={{fontSize: 32, textDecoration: 'underline'}}>Downloads</label>
        <a className="button downloadButton" style={{fontSize: 16, maxWidth: 196, width: '100%'}} href={`https://api.smithed.dev/download?pack=${id}`}>Download Latest</a>
        {packData.versions.sort((a,b) => -semver.compare(semver.coerce(a.name) ?? '', semver.coerce(b.name) ?? '')).map(v => <PackVersionDownload version={v} packId={id}/>)}
    </div>
}
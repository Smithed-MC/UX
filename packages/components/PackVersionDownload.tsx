import { PackVersion } from '@smithed-mc/data-types';
import React from "react";
import DownloadButton from "./DownloadButton";
import semver from 'semver'
interface PackVersionDownloadProps {
    version: PackVersion,
    packId: string
}

export default function PackVersionDownload({ version, packId }: PackVersionDownloadProps) {
    return <div className="container" style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', maxWidth: 256 }}>
        <div className="container" style={{ alignItems: 'start' }}>
            <label style={{ fontSize: '1.5rem' }}>{version.name}</label>
            <div className="container" style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 4}}>
                {version.supports.sort((a,b) => semver.compare(semver.coerce(a) ?? '', semver.coerce(b) ?? '')).map(v => <div style={{ backgroundColor: 'var(--background)', padding: 8, borderRadius: 'var(--defaultBorderRadius)' }}>
                    {v}
                </div>)}
            </div>

        </div>
        <DownloadButton link={`https://api.smithed.dev/v2/download?pack=${packId}@${encodeURIComponent(version.name)}`} />
    </div>
} 
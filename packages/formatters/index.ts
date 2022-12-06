export function formatDownloads(downloads: number) {
    if (downloads < 1e3) return downloads
    if (downloads < 1e5) return (downloads / 1e3).toFixed(1) + 'k'
    if (downloads < 1e7) return (downloads / 1e5).toFixed(1) + 'm'
}
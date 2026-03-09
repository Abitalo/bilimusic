import type { CSSProperties, ReactNode } from 'react'
import type { Track } from '../types'
import './TrackList.css'

interface TrackTableProps {
    tracks: Track[]
    metaLabel: string
    getMeta: (track: Track) => string
    onTrackClick: (track: Track, index: number) => void
    renderAction?: (track: Track, index: number) => ReactNode
    className?: string
    style?: CSSProperties
}

export default function TrackTable({
    tracks,
    metaLabel,
    getMeta,
    onTrackClick,
    renderAction,
    className,
    style,
}: TrackTableProps) {
    const hasAction = Boolean(renderAction)

    return (
        <div className={['app-track-list', className].filter(Boolean).join(' ')} style={style}>
            <div className="app-track-header-row">
                <div className="app-track-col-index">#</div>
                <div className="app-track-col-title">标题</div>
                <div className="app-track-col-duration">{metaLabel}</div>
                {hasAction ? <div className="app-track-col-action" /> : null}
            </div>
            {tracks.map((track, index) => (
                <div
                    key={`${track.bvid}-${track.addedAt}-${index}`}
                    className="app-track-row"
                    onClick={() => onTrackClick(track, index)}
                >
                    <div className="app-track-col-index">{index + 1}</div>
                    <div className="app-track-col-title">
                        <img src={track.cover} alt={track.title} className="app-track-cover" crossOrigin="anonymous" />
                        <div className="app-track-title-text">
                            <span className="app-track-name">{track.title}</span>
                            <span className="app-track-artist">{track.artist}</span>
                        </div>
                    </div>
                    <div className="app-track-col-duration">{getMeta(track)}</div>
                    {hasAction ? <div className="app-track-col-action">{renderAction?.(track, index)}</div> : null}
                </div>
            ))}
        </div>
    )
}

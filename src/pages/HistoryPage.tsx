import { useAppStore } from '../hooks/useAppStore'
import PageState from '../components/PageState'
import TrackTable from '../components/TrackTable'
import type { Track } from '../types'
import { formatDuration } from '../utils/tracks'
import './LibraryPage.css'

interface HistoryPageProps {
    onPlayTrack: (t: Track) => void
}

export default function HistoryPage({ onPlayTrack }: HistoryPageProps) {
    const { history, isHydrated } = useAppStore()

    if (!isHydrated) {
        return (
            <div className="history-page">
                <PageState title="正在加载播放历史..." compact />
            </div>
        )
    }

    return (
        <div className="history-page">
            <div className="page-header">
                <h2 className="page-title">
                    <span className="title-icon">🕐</span>
                    播放历史
                </h2>
            </div>

            {history.length === 0 ? (
                <PageState
                    title="暂无播放记录"
                    description="播放歌曲后会自动记录在这里。"
                    icon={<span style={{ fontSize: '48px' }}>🕐</span>}
                />
            ) : (
                <TrackTable
                    tracks={history}
                    metaLabel="时长"
                    getMeta={(track) => formatDuration(track.duration)}
                    onTrackClick={(track) => onPlayTrack(track)}
                    style={{ marginTop: '20px' }}
                />
            )}
        </div>
    )
}

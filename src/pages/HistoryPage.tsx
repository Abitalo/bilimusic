import { useAppStore } from '../hooks/useAppStore'
import './LibraryPage.css'
import './PlaylistPage.css' // Reuse list styling

export default function HistoryPage() {
    const { history } = useAppStore()

    const formatDuration = (seconds: number) => {
        if (!seconds) return '0:00'
        const m = Math.floor(seconds / 60)
        const s = Math.floor(seconds % 60)
        return `${m}:${s.toString().padStart(2, '0')}`
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
                <div className="empty-state">
                    <span className="empty-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>🕐</span>
                    <h3>暂无播放记录</h3>
                    <p>播放歌曲后会自动记录在这里</p>
                </div>
            ) : (
                <div className="track-list" style={{ marginTop: '20px' }}>
                    <div className="track-header-row">
                        <div className="col-index">#</div>
                        <div className="col-title">标题</div>
                        <div className="col-duration">时间</div>
                    </div>
                    {history.map((track, idx) => (
                        <div key={`${track.bvid}-${track.addedAt}-${idx}`} className="track-row">
                            <div className="col-index">{idx + 1}</div>
                            <div className="col-title">
                                <img src={track.cover} alt={track.title} className="tiny-cover" crossOrigin="anonymous" />
                                <div className="title-text">
                                    <span className="track-name">{track.title}</span>
                                    <span className="track-artist">{track.artist}</span>
                                </div>
                            </div>
                            <div className="col-duration">{formatDuration(track.duration)}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

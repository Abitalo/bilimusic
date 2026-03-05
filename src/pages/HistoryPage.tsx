import './LibraryPage.css'

export default function HistoryPage() {
    return (
        <div className="history-page">
            <h2 className="page-title">播放历史</h2>
            <div className="empty-state">
                <span className="empty-icon">🕐</span>
                <h3>暂无播放记录</h3>
                <p>播放歌曲后会自动记录在这里</p>
            </div>
        </div>
    )
}

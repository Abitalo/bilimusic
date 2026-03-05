import { NavLink } from 'react-router-dom'
import { Library as LibraryIcon, PlusCircle, ListMusic } from 'lucide-react'
import { useAppStore } from '../hooks/useAppStore'
import './LibraryPage.css'

export default function LibraryPage() {
    const { playlists, createPlaylist } = useAppStore()

    const handleCreate = () => {
        const title = prompt('请输入新播放列表名称：')
        if (title && title.trim()) {
            createPlaylist(title.trim())
        }
    }

    return (
        <div className="library-page">
            <div className="page-header">
                <h2 className="page-title">
                    <LibraryIcon size={28} className="title-icon" />
                    收藏库
                </h2>
                <button className="create-btn" onClick={handleCreate}>
                    <PlusCircle size={20} />
                    <span>新建列表</span>
                </button>
            </div>

            {playlists.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon"><ListMusic size={64} /></span>
                    <h3>暂无播放列表</h3>
                    <p>点击右上角或侧边栏创建你的第一个播放列表</p>
                </div>
            ) : (
                <div className="playlist-grid">
                    {playlists.map(pl => (
                        <NavLink to={`/playlist/${pl.id}`} key={pl.id} className="playlist-card">
                            <div className="playlist-cover">
                                {pl.cover ? (
                                    <img src={pl.cover} alt={pl.name} crossOrigin="anonymous" />
                                ) : (
                                    <div className="cover-placeholder"><ListMusic size={40} /></div>
                                )}
                                <div className="play-overlay">▶</div>
                            </div>
                            <div className="playlist-info">
                                <h3>{pl.name}</h3>
                                <p>{pl.tracks.length} 首歌曲</p>
                            </div>
                        </NavLink>
                    ))}
                </div>
            )}
        </div>
    )
}

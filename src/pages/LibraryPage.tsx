import { NavLink } from 'react-router-dom'
import { Library as LibraryIcon, PlusCircle, ListMusic } from 'lucide-react'
import { useDialog } from '../hooks/useDialog'
import PageState from '../components/PageState'
import { useAppStore } from '../hooks/useAppStore'
import './LibraryPage.css'

export default function LibraryPage() {
    const { playlists, createPlaylist, isHydrated } = useAppStore()
    const { prompt } = useDialog()

    const handleCreate = async () => {
        const title = await prompt({
            title: '新建播放列表',
            description: '给这个播放列表起一个名字，之后你可以继续往里面添加歌曲。',
            confirmText: '创建',
            cancelText: '取消',
            placeholder: '例如：深夜循环',
            inputLabel: '播放列表名称',
            validate: (value) => value ? undefined : '请输入播放列表名称。',
        })
        if (title) {
            await createPlaylist(title)
        }
    }

    if (!isHydrated) {
        return (
            <div className="library-page">
                <PageState title="正在加载收藏库..." compact />
            </div>
        )
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
                <PageState
                    title="暂无播放列表"
                    description="点击右上角或侧边栏，创建你的第一个播放列表。"
                    icon={<ListMusic size={64} />}
                />
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

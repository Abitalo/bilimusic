import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Trash2, ListMusic } from 'lucide-react'
import { useDialog } from '../hooks/useDialog'
import { useAppStore } from '../hooks/useAppStore'
import type { Track } from '../types'
import PageState from '../components/PageState'
import TrackTable from '../components/TrackTable'
import { formatDuration } from '../utils/tracks'
import './PlaylistPage.css'

interface PlaylistPageProps {
    onPlayTrack: (track: Track, queue?: Track[]) => void
}

export default function PlaylistPage({ onPlayTrack }: PlaylistPageProps) {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { confirm } = useDialog()
    const { playlists, deletePlaylist, removeTrackFromPlaylist, isHydrated } = useAppStore()

    const playlist = useMemo(() => playlists.find(p => p.id === id), [playlists, id])

    if (!isHydrated) {
        return (
            <div className="playlist-page">
                <PageState title="正在加载播放列表..." compact />
            </div>
        )
    }

    if (!playlist) {
        return (
            <div className="playlist-page not-found">
                <PageState
                    title="找不到该播放列表"
                    description="它可能已经被删除，或者当前链接已经失效。"
                    action={<button className="back-btn" onClick={() => navigate('/library')}>返回收藏库</button>}
                />
            </div>
        )
    }

    const handlePlayAll = () => {
        if (playlist.tracks.length > 0) {
            handlePlayTrack(playlist.tracks[0], playlist.tracks)
        }
    }

    const handleDelete = async () => {
        const approved = await confirm({
            title: '删除播放列表',
            description: `确定要删除“${playlist.name}”吗？删除后不会自动恢复。`,
            confirmText: '删除',
            cancelText: '取消',
            tone: 'danger',
        })
        if (approved) {
            await deletePlaylist(playlist.id)
            navigate('/library')
        }
    }

    const handleDeleteTrack = async (trackBvid: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const approved = await confirm({
            title: '移出列表',
            description: '确定要把这首歌从当前播放列表中移除吗？',
            confirmText: '移除',
            cancelText: '取消',
            tone: 'danger',
        })
        if (approved) {
            await removeTrackFromPlaylist(playlist.id, trackBvid)
        }
    }

    const handlePlayTrack = (targetTrack: Track, queue?: Track[]) => {
        onPlayTrack(targetTrack, queue)
    }

    return (
        <div className="playlist-page">
            <div className="playlist-header">
                <div className="header-cover">
                    {playlist.cover ? (
                        <img src={playlist.cover} alt={playlist.name} crossOrigin="anonymous" />
                    ) : (
                        <div className="cover-empty"><ListMusic size={60} /></div>
                    )}
                </div>
                <div className="header-info">
                    <span className="type-badge">播放列表</span>
                    <h1 className="title">{playlist.name}</h1>
                    <p className="meta">{playlist.tracks.length} 首歌曲 • 创建于 {new Date(playlist.createdAt).toLocaleDateString()}</p>

                    <div className="action-buttons">
                        <button
                            className="primary-btn play-all-btn"
                            onClick={handlePlayAll}
                            disabled={playlist.tracks.length === 0}
                        >
                            <Play fill="currentColor" size={20} />
                            <span>播放全部</span>
                        </button>
                        <button className="secondary-btn" onClick={handleDelete} title="删除列表">
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="tracks-container">
                {playlist.tracks.length === 0 ? (
                    <PageState
                        title="这个列表还是空的"
                        description="去搜索页添加几首歌后，这里会变成你的播放入口。"
                        action={<button className="go-search-btn" onClick={() => navigate('/search')}>去搜索添加歌曲</button>}
                    />
                ) : (
                    <TrackTable
                        tracks={playlist.tracks}
                        metaLabel="时长"
                        getMeta={(track) => formatDuration(track.duration)}
                        onTrackClick={(track) => handlePlayTrack(track, playlist.tracks)}
                        renderAction={(track) => (
                            <button
                                className="remove-track-btn"
                                onClick={(e) => handleDeleteTrack(track.bvid, e)}
                                title="移出列表"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    />
                )}
            </div>
        </div>
    )
}

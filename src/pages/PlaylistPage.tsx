import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Trash2, ListMusic } from 'lucide-react'
import { useAppStore } from '../hooks/useAppStore'
import type { Track } from '../types'
import './PlaylistPage.css'

interface PlaylistPageProps {
    onPlayTrack: (track: Track, queue?: Track[]) => void
}

export default function PlaylistPage({ onPlayTrack }: PlaylistPageProps) {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { playlists, deletePlaylist, removeTrackFromPlaylist } = useAppStore()

    const playlist = useMemo(() => playlists.find(p => p.id === id), [playlists, id])

    if (!playlist) {
        return (
            <div className="playlist-page not-found">
                <h2>找不到该播放列表</h2>
                <button className="back-btn" onClick={() => navigate('/library')}>返回收藏库</button>
            </div>
        )
    }

    const handlePlayAll = () => {
        if (playlist.tracks.length > 0) {
            handlePlayTrack(playlist.tracks[0], playlist.tracks)
        }
    }

    const handleDelete = async () => {
        if (confirm(`确定要删除 "${playlist.name}" 吗？`)) {
            await deletePlaylist(playlist.id)
            navigate('/library')
        }
    }

    const handleDeleteTrack = async (trackBvid: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm('确定要从列表中移除这首歌曲吗？')) {
            await removeTrackFromPlaylist(playlist.id, trackBvid)
        }
    }

    const handlePlayTrack = async (targetTrack: Track, queue?: Track[]) => {
        let playableTrack = { ...targetTrack }
        if (!playableTrack.cid) {
            try {
                const detailRes = await (window as any).ipcRenderer.invoke('get-video-detail', playableTrack.bvid)
                let cid = detailRes?.data?.cid || detailRes?.data?.pages?.[0]?.cid
                if (!cid) {
                    const pageListRes = await (window as any).ipcRenderer.invoke('get-page-list', playableTrack.bvid)
                    cid = pageListRes?.data?.[0]?.cid
                }
                if (cid) {
                    playableTrack.cid = cid
                } else {
                    alert('播放失败: 由于B站接口限制，该结果无法播放。')
                    return
                }
            } catch (err) {
                console.error('Failed to get cid for playback', err)
                return
            }
        }
        onPlayTrack(playableTrack, queue)
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
                    <div className="empty-tracks">
                        <p>这个列表还是空的</p>
                        <button className="go-search-btn" onClick={() => navigate('/search')}>去搜索添加歌曲</button>
                    </div>
                ) : (
                    <div className="track-list">
                        <div className="track-header-row">
                            <div className="col-index">#</div>
                            <div className="col-title">标题</div>
                            <div className="col-duration">时长</div>
                            <div className="col-action"></div>
                        </div>
                        {playlist.tracks.map((track, idx) => (
                            <div
                                key={`${track.bvid}-${idx}`}
                                className="track-row"
                                onClick={() => handlePlayTrack(track, playlist.tracks)}
                            >
                                <div className="col-index">{idx + 1}</div>
                                <div className="col-title">
                                    <img src={track.cover} alt="" className="tiny-cover" crossOrigin="anonymous" />
                                    <div className="title-text">
                                        <span className="track-name">{track.title}</span>
                                        <span className="track-artist">{track.artist}</span>
                                    </div>
                                </div>
                                <div className="col-duration">
                                    {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                                </div>
                                <div className="col-action">
                                    <button
                                        className="remove-track-btn"
                                        onClick={(e) => handleDeleteTrack(track.bvid, e)}
                                        title="移出列表"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

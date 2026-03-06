import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Heart, MoreVertical, Play, ChevronRight } from 'lucide-react'
import { useAppStore } from '../hooks/useAppStore'
import type { Track, SearchResult } from '../types'
import './SearchPage.css'

interface SearchPageProps {
    onPlayTrack: (track: Track, queue?: Track[]) => void
    onPlayNext: (track: Track) => void
}

// Parse "MM:SS" or "H:MM:SS" duration string to seconds
function parseDuration(dur: string): number {
    const parts = dur.split(':').map(Number)
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    return 0
}

// Strip HTML tags from search result titles
function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '')
}

export default function SearchPage({ onPlayTrack, onPlayNext }: SearchPageProps) {
    const [searchParams] = useSearchParams()
    const query = searchParams.get('q') || ''
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const doSearch = useCallback(async (keyword: string) => {
        if (!keyword) return
        setLoading(true)
        setError('')
        try {
            const data = await (window as any).ipcRenderer.invoke('search-video', keyword)
            if (data.code === 0) {
                const videoResults = data.data?.result?.find((r: any) => r.result_type === 'video')
                const items: SearchResult[] = (videoResults?.data || []).map((item: any) => ({
                    bvid: item.bvid,
                    aid: item.aid,
                    title: stripHtml(item.title),
                    author: item.author,
                    pic: item.pic?.startsWith('//') ? `https:${item.pic}` : item.pic,
                    duration: item.duration,
                    play: item.play,
                    description: item.description
                }))
                setResults(items)
            } else {
                setError(data.message || '搜索失败')
            }
        } catch (err: any) {
            setError(err?.message || '搜索请求异常')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        doSearch(query)
    }, [query, doSearch])

    const { playlists, addTrackToPlaylist, toggleLikeTrack, isTrackLiked } = useAppStore()

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, track: SearchResult | null } | null>(null)
    const [showSubMenu, setShowSubMenu] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setContextMenu(null)
                setShowSubMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('scroll', () => { setContextMenu(null); setShowSubMenu(false) }, true)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('scroll', () => { setContextMenu(null); setShowSubMenu(false) }, true)
        }
    }, [])

    const handlePlay = async (item: SearchResult, idx: number) => {
        try {
            let detailRes = await (window as any).ipcRenderer.invoke('get-video-detail', item.bvid)
            let cid = detailRes?.data?.cid || detailRes?.data?.pages?.[0]?.cid

            if (!cid) {
                // strict fallback: try pagelist if view API was blocked
                const pageListRes = await (window as any).ipcRenderer.invoke('get-page-list', item.bvid)
                cid = pageListRes?.data?.[0]?.cid
            }

            if (!cid) {
                console.error('播放失败: 无法获取视频详情或 cid', detailRes)
                alert('播放失败: 由于B站接口限制或番剧限制，该结果无法播放。')
                return
            }

            const track: Track = {
                bvid: item.bvid,
                cid,
                title: item.title,
                artist: item.author,
                cover: item.pic,
                duration: parseDuration(item.duration),
                addedAt: Date.now()
            }

            const queue: Track[] = results.map(r => ({
                bvid: r.bvid,
                cid: 0,
                title: r.title,
                artist: r.author,
                cover: r.pic,
                duration: parseDuration(r.duration),
                addedAt: Date.now()
            }))
            queue[idx] = track

            onPlayTrack(track, queue)
        } catch (err) {
            console.error('Play error:', err)
        }
    }

    const handlePlayNextWrapper = (item: SearchResult) => {
        const track: Track = {
            bvid: item.bvid,
            cid: 0,
            title: item.title,
            artist: item.author,
            cover: item.pic,
            duration: parseDuration(item.duration),
            addedAt: Date.now()
        }
        onPlayNext(track)
        setContextMenu(null)
    }

    const handleContextMenu = (e: React.MouseEvent, item: SearchResult) => {
        e.preventDefault()
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            track: item
        })
        setShowSubMenu(false)
    }

    const toTrack = (item: SearchResult): Track => ({
        bvid: item.bvid,
        cid: 0,
        title: item.title,
        artist: item.author,
        cover: item.pic,
        duration: parseDuration(item.duration),
        addedAt: Date.now()
    })

    return (
        <div className="search-page">
            {query && <h2 className="search-heading">搜索结果: <span className="search-keyword">{query}</span></h2>}

            {loading && (
                <div className="search-loading">
                    <div className="spinner" />
                    <span>搜索中...</span>
                </div>
            )}

            {error && <div className="search-error">⚠️ {error}</div>}

            {!loading && results.length > 0 && (
                <div className="track-list">
                    {/* Header Row */}
                    <div className="track-list-header">
                        <div className="header-index">#</div>
                        <div className="header-title">标题</div>
                        <div className="header-plays">播放量</div>
                        <div className="header-duration">时长</div>
                        {/* Space for actions */}
                        <div style={{ width: '60px' }}></div>
                    </div>

                    {results.map((item, idx) => {
                        const liked = isTrackLiked(item.bvid)
                        return (
                            <div
                                key={item.bvid}
                                className="track-item"
                                onClick={() => handlePlay(item, idx)}
                                onContextMenu={(e) => handleContextMenu(e, item)}
                            >
                                <div className="track-index">
                                    <span className="idx-num">{idx + 1}</span>
                                    <Play size={14} className="idx-play" fill="currentColor" />
                                </div>
                                <img
                                    className="track-cover"
                                    src={item.pic}
                                    alt={item.title}
                                    loading="lazy"
                                    crossOrigin="anonymous"
                                />
                                <div className="track-info">
                                    <div className="track-title">{item.title}</div>
                                    <div className="track-artist">{item.author}</div>
                                </div>
                                <div className="track-plays">{item.play >= 10000 ? `${(item.play / 10000).toFixed(1)}万` : item.play}</div>

                                <button
                                    className="track-like-btn"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleLikeTrack(toTrack(item))
                                    }}
                                >
                                    <Heart size={18} className={liked ? 'liked' : ''} />
                                </button>
                                <div className="track-duration">{item.duration}</div>

                                <button className="track-more-btn" onClick={(e) => {
                                    e.stopPropagation()
                                    handleContextMenu(e, item)
                                }}>
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}

            {!loading && !error && query && results.length === 0 && (
                <div className="search-empty">没有找到相关结果</div>
            )}

            {/* Context Menu */}
            {contextMenu && contextMenu.track && (
                <div
                    className="context-menu"
                    ref={menuRef}
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="context-menu-item" onClick={() => {
                        const idx = results.findIndex(r => r.bvid === contextMenu.track!.bvid)
                        handlePlay(contextMenu.track!, Math.max(0, idx))
                        setContextMenu(null)
                    }}>
                        播放
                    </div>
                    <div className="context-menu-item" onClick={() => handlePlayNextWrapper(contextMenu.track!)}>
                        下一首播放
                    </div>
                    <div className="context-menu-divider" />

                    <div
                        className="context-menu-item has-submenu"
                        onMouseEnter={() => setShowSubMenu(true)}
                        onMouseLeave={() => setShowSubMenu(false)}
                    >
                        添加到播放列表
                        <ChevronRight size={14} />

                        {showSubMenu && (
                            <div className="context-submenu">
                                {playlists.length === 0 ? (
                                    <div className="submenu-empty">暂无播放列表</div>
                                ) : (
                                    playlists.map(pl => (
                                        <div
                                            key={pl.id}
                                            className="context-menu-item"
                                            onClick={() => {
                                                addTrackToPlaylist(pl.id, toTrack(contextMenu.track!))
                                                setContextMenu(null)
                                                setShowSubMenu(false)
                                            }}
                                        >
                                            {pl.id === 'liked' ? '我喜欢的音乐' : pl.name}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

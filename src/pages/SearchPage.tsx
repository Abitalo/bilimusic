import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAppStore } from '../hooks/useAppStore'
import type { Track, SearchResult } from '../types'
import './SearchPage.css'

interface SearchPageProps {
    onPlayTrack: (track: Track, queue?: Track[]) => void
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

export default function SearchPage({ onPlayTrack }: SearchPageProps) {
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

    const { playlists, addTrackToPlaylist } = useAppStore()
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpenId(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handlePlay = async (item: SearchResult, idx: number) => {
        // First we need the cid for this video
        try {
            // Get video detail to find cid
            const detailRes = await (window as any).ipcRenderer.invoke('get-video-detail', item.bvid)
            const cid = detailRes?.data?.cid || detailRes?.data?.pages?.[0]?.cid
            if (!cid) {
                console.error('Cannot find cid for', item.bvid)
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

            // Build queue from all results
            const queue: Track[] = results.map(r => ({
                bvid: r.bvid,
                cid: 0, // will be fetched lazily
                title: r.title,
                artist: r.author,
                cover: r.pic,
                duration: parseDuration(r.duration),
                addedAt: Date.now()
            }))
            queue[idx] = track // ensure clicked one has correct cid

            onPlayTrack(track, queue)
        } catch (err) {
            console.error('Play error:', err)
        }
    }

    return (
        <div className="search-page">
            {query && <h2 className="search-heading">搜索: <span className="search-keyword">{query}</span></h2>}

            {loading && (
                <div className="search-loading">
                    <div className="spinner" />
                    <span>搜索中...</span>
                </div>
            )}

            {error && <div className="search-error">⚠️ {error}</div>}

            {!loading && results.length > 0 && (
                <div className="track-list">
                    {results.map((item, idx) => (
                        <div
                            key={item.bvid}
                            className="track-item"
                            onClick={() => handlePlay(item, idx)}
                        >
                            <div className="track-index">{idx + 1}</div>
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
                            <div className="track-duration">{item.duration}</div>
                            <div className="track-plays">▶ {item.play >= 10000 ? `${(item.play / 10000).toFixed(1)}万` : item.play}</div>

                            <div className="track-action-wrapper">
                                <button
                                    className="track-action"
                                    title="添加到播放列表"
                                    onClick={e => {
                                        e.stopPropagation();
                                        setMenuOpenId(menuOpenId === item.bvid ? null : item.bvid)
                                    }}
                                >
                                    <Plus size={20} />
                                </button>

                                {menuOpenId === item.bvid && (
                                    <div className="playlist-menu" ref={menuRef}>
                                        <div className="menu-header">添加到播放列表</div>
                                        {playlists.length === 0 ? (
                                            <div className="menu-empty">暂无播放列表，请在侧边栏新建</div>
                                        ) : (
                                            playlists.map(pl => (
                                                <div
                                                    key={pl.id}
                                                    className="menu-item"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addTrackToPlaylist(pl.id, {
                                                            bvid: item.bvid,
                                                            cid: 0,
                                                            title: item.title,
                                                            artist: item.author,
                                                            cover: item.pic,
                                                            duration: parseDuration(item.duration),
                                                            addedAt: Date.now()
                                                        });
                                                        setMenuOpenId(null);
                                                    }}
                                                >
                                                    {pl.name}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && !error && query && results.length === 0 && (
                <div className="search-empty">没有找到相关结果</div>
            )}
        </div>
    )
}

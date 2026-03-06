import { useState, useEffect } from 'react'
import { Play } from 'lucide-react'
import type { Track } from '../types'
import './HomePage.css'

interface FeedItem {
    bvid: string
    title: string
    author: string
    pic: string
    duration: number
    play: number
}

interface HomePageProps {
    onPlayTrack: (t: Track) => void
}

export default function HomePage({ onPlayTrack }: HomePageProps) {
    const [feed, setFeed] = useState<FeedItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadFeed = async () => {
            try {
                const res = await (window as any).ipcRenderer.invoke('get-recommend-feed')
                const items: FeedItem[] = []

                // Parse dynamic/region format
                if (res?.data?.archives) {
                    res.data.archives.forEach((a: any) => {
                        items.push({
                            bvid: a.bvid,
                            title: a.title,
                            author: a.owner?.name || '未知UP主',
                            pic: a.pic,
                            duration: a.duration || 0,
                            play: a.stat?.view || 0
                        })
                    })
                } else if (res?.data?.item) {
                    // Parse top rcmd format
                    res.data.item.forEach((a: any) => {
                        items.push({
                            bvid: a.bvid,
                            title: a.title,
                            author: a.owner?.name || '未知UP主',
                            pic: a.pic,
                            duration: a.duration || 0,
                            play: a.stat?.view || 0
                        })
                    })
                }
                setFeed(items)
            } catch (err) {
                console.error('Failed to load feed', err)
            } finally {
                setLoading(false)
            }
        }
        loadFeed()
    }, [])

    const handlePlayCard = async (item: FeedItem) => {
        try {
            const detailRes = await (window as any).ipcRenderer.invoke('get-video-detail', item.bvid)
            let cid = detailRes?.data?.cid || detailRes?.data?.pages?.[0]?.cid
            if (!cid) {
                const pageListRes = await (window as any).ipcRenderer.invoke('get-page-list', item.bvid)
                cid = pageListRes?.data?.[0]?.cid
            }
            if (!cid) {
                alert('播放失败: 无法获取该推荐视频的 cid。')
                return
            }

            const track: Track = {
                bvid: item.bvid,
                cid,
                title: item.title,
                artist: item.author,
                cover: item.pic,
                duration: item.duration || 0,
                addedAt: Date.now()
            }

            onPlayTrack(track)
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div className="home-page">
            <h2 className="home-greeting">为您推荐</h2>

            {loading ? (
                <div className="home-loading">
                    <div className="spinner"></div>
                </div>
            ) : feed.length === 0 ? (
                <div className="home-empty">暂无推荐内容</div>
            ) : (
                <div className="feed-grid">
                    {feed.map(item => (
                        <div key={item.bvid} className="feed-card" onClick={() => handlePlayCard(item)}>
                            <div className="feed-cover-container">
                                <img src={item.pic} alt={item.title} className="feed-cover" crossOrigin="anonymous" />
                                <button className="feed-play-btn">
                                    <Play size={24} fill="currentColor" />
                                </button>
                            </div>
                            <h3 className="feed-title">{item.title}</h3>
                            <p className="feed-author">{item.author}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

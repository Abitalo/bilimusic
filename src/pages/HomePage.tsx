import { useState, useEffect } from 'react'
import { Play } from 'lucide-react'
import type { Track } from '../types'
import { getRendererApi } from '../utils/ipc'
import { feedItemToTrack, type FeedCardItem, recommendResponseToFeed } from '../utils/tracks'
import './HomePage.css'

interface HomePageProps {
    onPlayTrack: (t: Track) => void
}

export default function HomePage({ onPlayTrack }: HomePageProps) {
    const [feed, setFeed] = useState<FeedCardItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isCancelled = false

        async function loadFeed() {
            try {
                const response = await getRendererApi().getRecommendFeed()
                if (isCancelled) {
                    return
                }

                if (response.code === 0 && 'data' in response) {
                    setFeed(recommendResponseToFeed(response))
                } else {
                    setFeed([])
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Failed to load feed', error)
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false)
                }
            }
        }

        void loadFeed()

        return () => {
            isCancelled = true
        }
    }, [])

    const handlePlayCard = (item: FeedCardItem) => {
        onPlayTrack(feedItemToTrack(item))
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

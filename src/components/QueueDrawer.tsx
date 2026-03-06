
import { Play, Trash2, X } from 'lucide-react'
import type { Track } from '../types'
import './QueueDrawer.css'

interface QueueDrawerProps {
    isOpen: boolean
    onClose: () => void
    queue: Track[]
    queueIndex: number
    onJumpTo: (index: number) => void
    onRemove: (index: number) => void
}

export default function QueueDrawer({ isOpen, onClose, queue, queueIndex, onJumpTo, onRemove }: QueueDrawerProps) {
    if (!isOpen) return null

    return (
        <div className="queue-overlay" onClick={onClose}>
            <div className="queue-drawer" onClick={e => e.stopPropagation()}>
                <div className="queue-header">
                    <h3>当前播放队列</h3>
                    <button className="queue-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {queue.length === 0 ? (
                    <div className="queue-empty">队列是空的</div>
                ) : (
                    <div className="queue-list">
                        {queue.map((track, idx) => (
                            <div key={`${track.bvid}-${idx}`} className={`queue-item ${idx === queueIndex ? 'active' : ''}`}>
                                <img src={track.cover} alt={track.title} className="queue-cover" crossOrigin="anonymous" />
                                <div className="queue-info">
                                    <div className="queue-title">{track.title}</div>
                                    <div className="queue-artist">{track.artist}</div>
                                </div>
                                <div className="queue-actions">
                                    <button className="q-action-btn" title="播放此曲目" onClick={() => onJumpTo(idx)}>
                                        <Play size={16} />
                                    </button>
                                    <button className="q-action-btn" title="从队列中移除" onClick={() => onRemove(idx)}>
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

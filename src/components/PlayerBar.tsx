import { useState, useRef, useEffect } from 'react'
import {
    SkipBack,
    Play,
    Pause,
    SkipForward,
    Shuffle,
    Volume2,
    VolumeX,
    Volume1,
    ListMusic
} from 'lucide-react'
import type { Track } from '../types'
import './PlayerBar.css'

interface PlayerBarProps {
    currentTrack: Track | null
    isPlaying: boolean
    onPlayPause: () => void
    onNext: () => void
    onPrev: () => void
    audioRef: React.RefObject<HTMLAudioElement | null>
    isShuffle: boolean
    onToggleShuffle: () => void
    onToggleDrawer: () => void
}

export default function PlayerBar({
    currentTrack,
    isPlaying,
    onPlayPause,
    onNext,
    onPrev,
    audioRef,
    isShuffle,
    onToggleShuffle,
    onToggleDrawer
}: PlayerBarProps) {
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(0.8)
    const progressRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const onTimeUpdate = () => setCurrentTime(audio.currentTime)
        const onDurationChange = () => setDuration(audio.duration || 0)
        const onVolumeChange = () => setVolume(audio.volume)

        audio.addEventListener('timeupdate', onTimeUpdate)
        audio.addEventListener('durationchange', onDurationChange)
        audio.addEventListener('volumechange', onVolumeChange)

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate)
            audio.removeEventListener('durationchange', onDurationChange)
            audio.removeEventListener('volumechange', onVolumeChange)
        }
    }, [audioRef])

    const formatTime = (s: number) => {
        if (!s || isNaN(s)) return '0:00'
        const m = Math.floor(s / 60)
        const sec = Math.floor(s % 60)
        return `${m}:${sec.toString().padStart(2, '0')}`
    }

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const bar = progressRef.current
        if (!bar || !audioRef.current) return
        const rect = bar.getBoundingClientRect()
        const pct = (e.clientX - rect.left) / rect.width
        audioRef.current.currentTime = pct * duration
    }

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value)
        setVolume(v)
        if (audioRef.current) audioRef.current.volume = v
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    // Volume Icon logic
    let VolIcon = Volume2
    if (volume === 0) VolIcon = VolumeX
    else if (volume < 0.5) VolIcon = Volume1

    return (
        <footer className="player-bar">
            {/* Progress bar at very top edge */}
            <div
                className="progress-bar-container"
                ref={progressRef}
                onClick={handleProgressClick}
            >
                <div className="progress-bar-track">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${progress}%` }}
                    />
                    <div className="progress-bar-thumb" />
                </div>
            </div>

            <div className="player-content">
                {/* Left: Track Info */}
                <div className="player-track-info">
                    {currentTrack ? (
                        <>
                            <img
                                className="player-cover"
                                src={currentTrack.cover}
                                alt={currentTrack.title}
                                crossOrigin="anonymous"
                            />
                            <div className="player-track-text">
                                <div className="player-track-title">{currentTrack.title}</div>
                                <div className="player-track-artist">{currentTrack.artist}</div>
                            </div>
                        </>
                    ) : (
                        <div className="player-track-text">
                            <div className="player-track-title empty">未在播放</div>
                        </div>
                    )}
                </div>

                {/* Center: Controls */}
                <div className="player-controls-container">
                    <div className="player-controls">
                        <button
                            className={`ctrl-btn ${isShuffle ? 'active-green' : ''}`}
                            onClick={onToggleShuffle}
                            title="随机播放"
                        >
                            <Shuffle size={18} />
                        </button>
                        <button className="ctrl-btn" onClick={onPrev} title="上一首">
                            <SkipBack size={20} fill="currentColor" />
                        </button>
                        <button className="play-btn" onClick={onPlayPause} title={isPlaying ? '暂停' : '播放'}>
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />}
                        </button>
                        <button className="ctrl-btn" onClick={onNext} title="下一首">
                            <SkipForward size={20} fill="currentColor" />
                        </button>
                        <span style={{ width: 34 }}></span> {/* Spacer to keep play button centered */}
                    </div>
                    <div className="time-display-wrapper">
                        <span className="time-display">{formatTime(currentTime)}</span>
                        <div className="time-display-divider">/</div>
                        <span className="time-display">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="player-actions">
                    <button className="action-icn-btn" title="播放队列" onClick={onToggleDrawer}>
                        <ListMusic size={18} />
                    </button>
                    <div className="player-volume">
                        <VolIcon size={18} className="volume-icon" />
                        <input
                            type="range"
                            className="volume-slider"
                            min={0}
                            max={1}
                            step={0.01}
                            value={volume}
                            onChange={handleVolumeChange}
                        />
                    </div>
                </div>
            </div>
        </footer>
    )
}

import { useState, useRef, useCallback } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import PlayerBar from './components/PlayerBar'
import QueueDrawer from './components/QueueDrawer'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import LibraryPage from './pages/LibraryPage'
import HistoryPage from './pages/HistoryPage'
import PlaylistPage from './pages/PlaylistPage'
import { useDialog } from './hooks/useDialog'
import { useAppStore } from './hooks/useAppStore'
import type { Track } from './types'
import { resolvePlaybackSource } from './services/playback'
import './App.css'

function App() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [queue, setQueue] = useState<Track[]>([])
  const [queueIndex, setQueueIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const { addToHistory } = useAppStore()
  const { alert } = useDialog()

  const playTrack = useCallback(async (track: Track) => {
    try {
      const audioElement = audioRef.current
      if (!audioElement) return

      const { track: playableTrack, src } = await resolvePlaybackSource(track)
      audioElement.pause()
      audioElement.src = src
      audioElement.currentTime = 0
      setCurrentTrack(playableTrack)
      await audioElement.play()
      await addToHistory(playableTrack)
    } catch (err) {
      console.error('Error playing track:', err)
      void alert({
        title: '播放失败',
        description: err instanceof Error ? err.message : '播放失败，请稍后重试。',
      })
    }
  }, [addToHistory, alert])

  const handlePlayTrack = useCallback((track: Track, newQueue?: Track[]) => {
    if (newQueue) {
      setQueue(newQueue)
      const idx = newQueue.findIndex(t => t.bvid === track.bvid)
      setQueueIndex(idx >= 0 ? idx : 0)
    }
    playTrack(track)
  }, [playTrack])

  const handlePlayNext = useCallback((track: Track) => {
    if (queue.length === 0) {
      handlePlayTrack(track, [track])
      return
    }
    const newQueue = [...queue]
    // Insert after current index
    newQueue.splice(queueIndex + 1, 0, track)
    setQueue(newQueue)
  }, [queue, queueIndex, handlePlayTrack])

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return
    if (audioRef.current.paused) {
      audioRef.current.play()
      setIsPlaying(true)
    } else {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [])

  const handleNext = useCallback(() => {
    if (queue.length === 0) return
    let nextIdx = (queueIndex + 1) % queue.length
    if (isShuffle && queue.length > 1) {
      let randomIdx = queueIndex
      while (randomIdx === queueIndex) {
        randomIdx = Math.floor(Math.random() * queue.length)
      }
      nextIdx = randomIdx
    }
    setQueueIndex(nextIdx)
    playTrack(queue[nextIdx])
  }, [queue, queueIndex, playTrack, isShuffle])

  const handlePrev = useCallback(() => {
    if (queue.length === 0) return
    const prevIdx = queueIndex <= 0 ? queue.length - 1 : queueIndex - 1
    setQueueIndex(prevIdx)
    playTrack(queue[prevIdx])
  }, [queue, queueIndex, playTrack])

  const handleEnded = useCallback(() => {
    handleNext()
  }, [handleNext])

  const handleJumpToQueue = useCallback((idx: number) => {
    if (idx >= 0 && idx < queue.length) {
      setQueueIndex(idx)
      playTrack(queue[idx])
    }
  }, [queue, playTrack])

  const handleRemoveFromQueue = useCallback((idx: number) => {
    const newQueue = [...queue]
    newQueue.splice(idx, 1)

    if (newQueue.length === 0) {
      setQueue(newQueue)
      setQueueIndex(-1)
      setCurrentTrack(null)
      setIsPlaying(false)
      if (audioRef.current) audioRef.current.pause()
      return
    }

    if (idx < queueIndex) {
      setQueue(newQueue)
      setQueueIndex(queueIndex - 1)
    } else if (idx === queueIndex) {
      setQueue(newQueue)
      const nextIdx = idx >= newQueue.length ? 0 : idx
      setQueueIndex(nextIdx)
      playTrack(newQueue[nextIdx])
    } else {
      setQueue(newQueue)
    }
  }, [queue, queueIndex, playTrack])

  return (
    <HashRouter>
      <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="drag-region" />
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <main className="main-content">
          <TopBar />
          <div className="page-container">
            <Routes>
              <Route path="/" element={<HomePage onPlayTrack={handlePlayTrack} />} />
              <Route path="/search" element={<SearchPage onPlayTrack={handlePlayTrack} onPlayNext={handlePlayNext} />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/playlist/:id" element={<PlaylistPage onPlayTrack={handlePlayTrack} />} />
              <Route path="/history" element={<HistoryPage onPlayTrack={handlePlayTrack} />} />
            </Routes>
          </div>
        </main>

        <PlayerBar
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrev={handlePrev}
          audioRef={audioRef}
          isShuffle={isShuffle}
          onToggleShuffle={() => setIsShuffle(!isShuffle)}
          onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
        />

        <QueueDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          queue={queue}
          queueIndex={queueIndex}
          onJumpTo={handleJumpToQueue}
          onRemove={handleRemoveFromQueue}
        />

        <audio
          ref={audioRef}
          onEnded={handleEnded}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      </div>
    </HashRouter>
  )
}

export default App

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
import { useAppStore } from './hooks/useAppStore'
import type { Track } from './types'
import './App.css'

const AUDIO_PROXY_PORT = 48261

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

  const playTrack = useCallback(async (track: Track) => {
    try {
      // Ensure we have the cid
      let cid = track.cid
      if (!cid) {
        const detail = await (window as any).ipcRenderer.invoke('get-video-detail', track.bvid)
        const resolvedCid = detail?.data?.cid || detail?.data?.pages?.[0]?.cid
        if (!resolvedCid) {
          console.error('No cid found for', track.bvid)
          return
        }
        cid = resolvedCid
        track = { ...track, cid }
      }

      // Get audio URL
      const playData = await (window as any).ipcRenderer.invoke('get-play-url', track.bvid, cid)
      const dashAudio = playData?.data?.dash?.audio
      if (!dashAudio || dashAudio.length === 0) {
        console.error('No audio stream found', playData)
        return
      }

      // Pick the highest quality audio
      const audioUrl = dashAudio[0].baseUrl || dashAudio[0].base_url
      if (!audioUrl) {
        console.error('No valid audio URL found', dashAudio[0])
        return
      }

      // Route through local proxy to bypass Referer checks
      const proxiedUrl = `http://127.0.0.1:${AUDIO_PROXY_PORT}/?url=${encodeURIComponent(audioUrl)}`

      if (audioRef.current) {
        audioRef.current.src = proxiedUrl
        audioRef.current.play()
        setIsPlaying(true)
        setCurrentTrack(track)

        // Add to history
        addToHistory(track)
      }
    } catch (err) {
      console.error('Error playing track:', err)
    }
  }, [])

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

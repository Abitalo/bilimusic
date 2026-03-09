import { createContext } from 'react'
import type { Playlist, Track } from '../types'

export interface AppStoreValue {
    playlists: Playlist[]
    history: Track[]
    isHydrated: boolean
    createPlaylist: (name: string) => Promise<Playlist>
    deletePlaylist: (id: string) => Promise<void>
    addTrackToPlaylist: (playlistId: string, track: Track) => Promise<void>
    removeTrackFromPlaylist: (playlistId: string, bvid: string) => Promise<void>
    addToHistory: (track: Track) => Promise<void>
    toggleLikeTrack: (track: Track) => Promise<void>
    isTrackLiked: (bvid: string) => boolean
}

export const AppStoreContext = createContext<AppStoreValue | null>(null)

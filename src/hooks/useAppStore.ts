import { useState, useEffect } from 'react'
import type { Track } from '../types'

export interface Playlist {
    id: string
    name: string
    cover?: string
    tracks: Track[]
    createdAt: number
    updatedAt: number
}

export function useAppStore() {
    const [playlists, setPlaylists] = useState<Playlist[]>([])
    const [history, setHistory] = useState<Track[]>([])

    // Load from store on mount
    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const pl = await (window as any).ipcRenderer.invoke('store-get', 'playlists')
            setPlaylists(pl || [])

            const hist = await (window as any).ipcRenderer.invoke('store-get', 'history')
            setHistory(hist || [])
        } catch (err) {
            console.error('Failed to load store data', err)
        }
    }

    const createPlaylist = async (name: string) => {
        const newList: Playlist = {
            id: Date.now().toString(),
            name,
            tracks: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
        const newPlaylists = [...playlists, newList]
        setPlaylists(newPlaylists)
        await (window as any).ipcRenderer.invoke('store-set', 'playlists', newPlaylists)
        return newList
    }

    const deletePlaylist = async (id: string) => {
        const newPlaylists = playlists.filter(p => p.id !== id)
        setPlaylists(newPlaylists)
        await (window as any).ipcRenderer.invoke('store-set', 'playlists', newPlaylists)
    }

    const addTrackToPlaylist = async (playlistId: string, track: Track) => {
        const newPlaylists = playlists.map(p => {
            if (p.id === playlistId) {
                // Prevent exact duplicates
                if (!p.tracks.find(t => t.bvid === track.bvid)) {
                    return {
                        ...p,
                        tracks: [...p.tracks, track],
                        updatedAt: Date.now(),
                        cover: p.cover || track.cover // use first track cover as default
                    }
                }
            }
            return p
        })
        setPlaylists(newPlaylists)
        await (window as any).ipcRenderer.invoke('store-set', 'playlists', newPlaylists)
    }

    const addToHistory = async (track: Track) => {
        setHistory(prev => {
            const filtered = prev.filter(t => t.bvid !== track.bvid)
            const newHistory = [track, ...filtered].slice(0, 100) // Keep last 100
                ; (window as any).ipcRenderer.invoke('store-set', 'history', newHistory)
            return newHistory
        })
    }

    return {
        playlists,
        history,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        addToHistory
    }
}

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
            let loadedPlaylists: Playlist[] = pl || []

            // Ensure 'liked' playlist exists (Built-in Liked Songs)
            if (!loadedPlaylists.find(p => p.id === 'liked')) {
                const likedList: Playlist = {
                    id: 'liked',
                    name: '我喜欢的音乐',
                    tracks: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                }
                loadedPlaylists = [likedList, ...loadedPlaylists]
                await (window as any).ipcRenderer.invoke('store-set', 'playlists', loadedPlaylists)
            }

            setPlaylists(loadedPlaylists)

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

    const isTrackLiked = (bvid: string) => {
        const likedList = playlists.find(p => p.id === 'liked')
        return likedList?.tracks.some(t => t.bvid === bvid) || false
    }

    const toggleLikeTrack = async (track: Track) => {
        const likedList = playlists.find(p => p.id === 'liked')
        if (!likedList) return

        const isLiked = likedList.tracks.some(t => t.bvid === track.bvid)
        const newPlaylists = playlists.map(p => {
            if (p.id === 'liked') {
                const newTracks = isLiked
                    ? p.tracks.filter(t => t.bvid !== track.bvid)
                    : [...p.tracks, track]

                return {
                    ...p,
                    tracks: newTracks,
                    updatedAt: Date.now(),
                    cover: isLiked ? p.cover : (p.cover || track.cover)
                }
            }
            return p
        })
        setPlaylists(newPlaylists)
        await (window as any).ipcRenderer.invoke('store-set', 'playlists', newPlaylists)
    }

    return {
        playlists,
        history,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        addToHistory,
        toggleLikeTrack,
        isTrackLiked
    }
}

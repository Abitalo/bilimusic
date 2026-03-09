import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { LIKED_PLAYLIST_ID } from '../../shared/models'
import type { Playlist, Track } from '../types'
import { AppStoreContext } from './app-store-context'
import { getRendererApi } from '../utils/ipc'

function coverFromTracks(tracks: Track[]) {
    return tracks[0]?.cover
}

export function AppStoreProvider({ children }: PropsWithChildren) {
    const [playlists, setPlaylists] = useState<Playlist[]>([])
    const [history, setHistory] = useState<Track[]>([])
    const [isHydrated, setIsHydrated] = useState(false)

    const persistPlaylists = useCallback(async (nextPlaylists: Playlist[]) => {
        try {
            await getRendererApi().savePlaylists(nextPlaylists)
        } catch (error) {
            console.error('Failed to persist playlists', error)
        }
    }, [])

    const persistHistory = useCallback(async (nextHistory: Track[]) => {
        try {
            await getRendererApi().saveHistory(nextHistory)
        } catch (error) {
            console.error('Failed to persist history', error)
        }
    }, [])

    useEffect(() => {
        let isCancelled = false

        async function hydrateStore() {
            try {
                const snapshot = await getRendererApi().loadAppState()
                if (isCancelled) return

                setPlaylists(snapshot.playlists)
                setHistory(snapshot.history)
            } catch (error) {
                console.error('Failed to load store data', error)
            } finally {
                if (!isCancelled) {
                    setIsHydrated(true)
                }
            }
        }

        void hydrateStore()

        return () => {
            isCancelled = true
        }
    }, [])

    const createPlaylist = useCallback(async (name: string) => {
        const now = Date.now()
        const newPlaylist: Playlist = {
            id: now.toString(),
            name,
            tracks: [],
            createdAt: now,
            updatedAt: now,
        }

        setPlaylists((prevPlaylists) => {
            const nextPlaylists = [...prevPlaylists, newPlaylist]
            void persistPlaylists(nextPlaylists)
            return nextPlaylists
        })

        return newPlaylist
    }, [persistPlaylists])

    const deletePlaylist = useCallback(async (id: string) => {
        if (id === LIKED_PLAYLIST_ID) {
            return
        }

        setPlaylists((prevPlaylists) => {
            const nextPlaylists = prevPlaylists.filter((playlist) => playlist.id !== id)
            void persistPlaylists(nextPlaylists)
            return nextPlaylists
        })
    }, [persistPlaylists])

    const addTrackToPlaylist = useCallback(async (playlistId: string, track: Track) => {
        setPlaylists((prevPlaylists) => {
            let hasChanged = false
            const nextPlaylists = prevPlaylists.map((playlist) => {
                if (playlist.id !== playlistId || playlist.tracks.some((item) => item.bvid === track.bvid)) {
                    return playlist
                }

                hasChanged = true
                const nextTracks = [...playlist.tracks, track]
                return {
                    ...playlist,
                    tracks: nextTracks,
                    updatedAt: Date.now(),
                    cover: playlist.cover || coverFromTracks(nextTracks),
                }
            })

            if (hasChanged) {
                void persistPlaylists(nextPlaylists)
            }

            return hasChanged ? nextPlaylists : prevPlaylists
        })
    }, [persistPlaylists])

    const removeTrackFromPlaylist = useCallback(async (playlistId: string, bvid: string) => {
        setPlaylists((prevPlaylists) => {
            let hasChanged = false
            const nextPlaylists = prevPlaylists.map((playlist) => {
                if (playlist.id !== playlistId) {
                    return playlist
                }

                const nextTracks = playlist.tracks.filter((track) => track.bvid !== bvid)
                if (nextTracks.length === playlist.tracks.length) {
                    return playlist
                }

                hasChanged = true
                return {
                    ...playlist,
                    tracks: nextTracks,
                    updatedAt: Date.now(),
                    cover: coverFromTracks(nextTracks),
                }
            })

            if (hasChanged) {
                void persistPlaylists(nextPlaylists)
            }

            return hasChanged ? nextPlaylists : prevPlaylists
        })
    }, [persistPlaylists])

    const addToHistory = useCallback(async (track: Track) => {
        setHistory((prevHistory) => {
            const filteredHistory = prevHistory.filter((item) => item.bvid !== track.bvid)
            const nextHistory = [track, ...filteredHistory].slice(0, 100)
            void persistHistory(nextHistory)
            return nextHistory
        })
    }, [persistHistory])

    const toggleLikeTrack = useCallback(async (track: Track) => {
        setPlaylists((prevPlaylists) => {
            let hasChanged = false
            const nextPlaylists = prevPlaylists.map((playlist) => {
                if (playlist.id !== LIKED_PLAYLIST_ID) {
                    return playlist
                }

                const isLiked = playlist.tracks.some((item) => item.bvid === track.bvid)
                const nextTracks = isLiked
                    ? playlist.tracks.filter((item) => item.bvid !== track.bvid)
                    : [...playlist.tracks, track]

                hasChanged = true
                return {
                    ...playlist,
                    tracks: nextTracks,
                    updatedAt: Date.now(),
                    cover: coverFromTracks(nextTracks),
                }
            })

            if (hasChanged) {
                void persistPlaylists(nextPlaylists)
            }

            return hasChanged ? nextPlaylists : prevPlaylists
        })
    }, [persistPlaylists])

    const isTrackLiked = useCallback((bvid: string) => {
        const likedPlaylist = playlists.find((playlist) => playlist.id === LIKED_PLAYLIST_ID)
        return likedPlaylist?.tracks.some((track) => track.bvid === bvid) ?? false
    }, [playlists])

    const value = useMemo(() => ({
        playlists,
        history,
        isHydrated,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        addToHistory,
        toggleLikeTrack,
        isTrackLiked,
    }), [
        playlists,
        history,
        isHydrated,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        addToHistory,
        toggleLikeTrack,
        isTrackLiked,
    ])

    return (
        <AppStoreContext.Provider value={value}>
            {children}
        </AppStoreContext.Provider>
    )
}

import type { Playlist } from './models'
import { LIKED_PLAYLIST_ID } from './models'

export function createLikedPlaylist(timestamp = Date.now()): Playlist {
    return {
        id: LIKED_PLAYLIST_ID,
        name: '我喜欢的音乐',
        tracks: [],
        createdAt: timestamp,
        updatedAt: timestamp,
    }
}

export function ensureSystemPlaylists(playlists: Playlist[]): Playlist[] {
    const liked = playlists.find((playlist) => playlist.id === LIKED_PLAYLIST_ID)
    const userPlaylists = playlists.filter((playlist) => playlist.id !== LIKED_PLAYLIST_ID)

    return [liked ?? createLikedPlaylist(), ...userPlaylists]
}

import Store from 'electron-store'
import type { AppStateSnapshot, Playlist, Track } from '../shared/models'
import { ensureSystemPlaylists } from '../shared/playlist-utils'

interface StoreSchema {
    bili_cookie?: string
    playlists: Playlist[]
    history: Track[]
}

const store = new Store<StoreSchema>({
    defaults: {
        playlists: [],
        history: [],
    },
})

export function getStoredCookie() {
    return store.get('bili_cookie') ?? ''
}

export function setStoredCookie(cookie: string) {
    store.set('bili_cookie', cookie)
}

export function clearStoredCookie() {
    store.delete('bili_cookie')
}

export function loadAppState(): AppStateSnapshot {
    return {
        playlists: ensureSystemPlaylists(store.get('playlists') ?? []),
        history: store.get('history') ?? [],
    }
}

export function savePlaylists(playlists: Playlist[]) {
    store.set('playlists', ensureSystemPlaylists(playlists))
}

export function saveHistory(history: Track[]) {
    store.set('history', history)
}

export default store

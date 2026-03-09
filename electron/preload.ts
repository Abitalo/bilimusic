import { contextBridge, ipcRenderer } from 'electron'
import type { BiliMusicApi } from '../shared/ipc'
import type { Playlist, Track } from '../shared/models'

const bridgeApi: BiliMusicApi = {
    loadAppState() {
        return ipcRenderer.invoke('app:load-state')
    },
    savePlaylists(playlists: Playlist[]) {
        return ipcRenderer.invoke('app:save-playlists', playlists)
    },
    saveHistory(history: Track[]) {
        return ipcRenderer.invoke('app:save-history', history)
    },
    clearAppData() {
        return ipcRenderer.invoke('app:clear-data')
    },
    searchVideos(keyword: string, page = 1) {
        return ipcRenderer.invoke('bili:search-videos', keyword, page)
    },
    getPlayUrl(bvid: string, cid: number) {
        return ipcRenderer.invoke('bili:get-play-url', bvid, cid)
    },
    getVideoDetail(bvid: string) {
        return ipcRenderer.invoke('bili:get-video-detail', bvid)
    },
    getPageList(bvid: string) {
        return ipcRenderer.invoke('bili:get-page-list', bvid)
    },
    getRecommendFeed() {
        return ipcRenderer.invoke('bili:get-recommend-feed')
    },
    getLoginQrCode() {
        return ipcRenderer.invoke('auth:get-login-qrcode')
    },
    pollLoginQrCode(key: string) {
        return ipcRenderer.invoke('auth:poll-login-qrcode', key)
    },
    getUserInfo() {
        return ipcRenderer.invoke('auth:get-user-info')
    },
    logout() {
        return ipcRenderer.invoke('auth:logout')
    },
}

contextBridge.exposeInMainWorld('biliMusic', bridgeApi)

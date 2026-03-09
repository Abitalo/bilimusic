import { ipcMain } from 'electron'
import type { Playlist, Track } from '../shared/models'
import { getLoginUrl, getPageList, getPlayUrl, getRecommendFeed, getUserInfo, getVideoDetail, logout, pollLogin, searchBilibili } from './bilibili-api'
import { loadAppState, saveHistory, savePlaylists } from './store'

function toErrorResponse(error: unknown) {
    return {
        code: -1,
        message: error instanceof Error ? error.message : 'Unknown error',
    }
}

export function setupIpcHandlers() {
    ipcMain.handle('app:load-state', () => {
        return loadAppState()
    })

    ipcMain.handle('app:save-playlists', (_, playlists: Playlist[]) => {
        try {
            savePlaylists(playlists)
            return true
        } catch (error) {
            console.error('SavePlaylists error:', error)
            return false
        }
    })

    ipcMain.handle('app:save-history', (_, history: Track[]) => {
        try {
            saveHistory(history)
            return true
        } catch (error) {
            console.error('SaveHistory error:', error)
            return false
        }
    })

    ipcMain.handle('bili:search-videos', async (_, keyword: string, page = 1) => {
        try {
            return await searchBilibili(keyword, page)
        } catch (error) {
            console.error('Search error:', error)
            return toErrorResponse(error)
        }
    })

    ipcMain.handle('bili:get-play-url', async (_, bvid: string, cid: number) => {
        try {
            return await getPlayUrl(bvid, cid)
        } catch (error) {
            console.error('PlayUrl error:', error)
            return toErrorResponse(error)
        }
    })

    ipcMain.handle('bili:get-video-detail', async (_, bvid: string) => {
        try {
            return await getVideoDetail(bvid)
        } catch (error) {
            console.error('VideoDetail error:', error)
            return toErrorResponse(error)
        }
    })

    ipcMain.handle('bili:get-page-list', async (_, bvid: string) => {
        try {
            return await getPageList(bvid)
        } catch (error) {
            console.error('PageList error:', error)
            return toErrorResponse(error)
        }
    })

    ipcMain.handle('bili:get-recommend-feed', async () => {
        try {
            return await getRecommendFeed()
        } catch (error) {
            console.error('RecommendFeed error:', error)
            return toErrorResponse(error)
        }
    })

    ipcMain.handle('auth:get-login-qrcode', async () => {
        try {
            return await getLoginUrl()
        } catch (error) {
            console.error('GetLoginQrCode error:', error)
            return toErrorResponse(error)
        }
    })

    ipcMain.handle('auth:poll-login-qrcode', async (_, key: string) => {
        try {
            return await pollLogin(key)
        } catch (error) {
            console.error('PollLoginQrCode error:', error)
            return toErrorResponse(error)
        }
    })

    ipcMain.handle('auth:get-user-info', async () => {
        try {
            return await getUserInfo()
        } catch (error) {
            console.error('GetUserInfo error:', error)
            return toErrorResponse(error)
        }
    })

    ipcMain.handle('auth:logout', () => {
        return logout()
    })
}

import { ipcMain } from 'electron';
import { searchBilibili, getPlayUrl, getVideoDetail, getLoginUrl, pollLogin, getUserInfo, logout } from './bilibili-api';
import store from './store';

function getErrorMessage(err: unknown) {
    return err instanceof Error ? err.message : 'Unknown error'
}

export function setupIpcHandlers() {
    ipcMain.handle('search-video', async (_, keyword: string, page = 1) => {
        try {
            return await searchBilibili(keyword, page);
        } catch (err: unknown) {
            console.error('Search error:', err);
            return { code: -1, message: getErrorMessage(err) };
        }
    });

    ipcMain.handle('get-play-url', async (_, bvid: string, cid: number) => {
        try {
            return await getPlayUrl(bvid, cid);
        } catch (err: unknown) {
            console.error('PlayUrl error:', err);
            return { code: -1, message: getErrorMessage(err) };
        }
    });

    ipcMain.handle('get-video-detail', async (_, bvid: string) => {
        try {
            return await getVideoDetail(bvid);
        } catch (err: any) {
            console.error('VideoDetail error:', err);
            return { code: -1, message: err?.message };
        }
    });

    // Login
    ipcMain.handle('get-login-qrcode', async () => {
        try { return await getLoginUrl(); } catch (err: any) { return { code: -1, message: err?.message }; }
    });

    ipcMain.handle('poll-login-qrcode', async (_, key: string) => {
        try { return await pollLogin(key); } catch (err: any) { return { code: -1, message: err?.message }; }
    });

    ipcMain.handle('get-user-info', async () => {
        try { return await getUserInfo(); } catch (err: any) { return { code: -1, message: err?.message }; }
    });

    ipcMain.handle('logout', () => {
        return logout();
    });

    // Store (for playlists, history, etc)
    ipcMain.handle('store-get', (_, key: string) => {
        return store.get(key);
    });

    ipcMain.handle('store-set', (_, key: string, value: any) => {
        store.set(key, value);
        return true;
    });

    ipcMain.handle('store-delete', (_, key: string) => {
        store.delete(key);
        return true;
    });
}

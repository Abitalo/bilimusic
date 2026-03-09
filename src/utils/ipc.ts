import type { BiliMusicApi } from '../../shared/ipc'

export function getRendererApi(): BiliMusicApi {
    const bridge = window.biliMusic
    if (!bridge) {
        throw new Error('Electron bridge unavailable. Please restart the app.')
    }
    return bridge
}

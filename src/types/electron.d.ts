import type { BiliMusicApi } from '../../shared/ipc'

declare global {
    interface Window {
        biliMusic?: BiliMusicApi
    }
}

export {}

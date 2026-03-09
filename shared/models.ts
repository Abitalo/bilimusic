export const LIKED_PLAYLIST_ID = 'liked'

export interface Track {
    bvid: string
    cid?: number
    title: string
    artist: string
    cover: string
    duration: number
    addedAt: number
}

export interface Playlist {
    id: string
    name: string
    cover?: string
    tracks: Track[]
    createdAt: number
    updatedAt: number
}

export interface SearchResult {
    bvid: string
    aid: number
    title: string
    author: string
    pic: string
    duration: string
    play: number
    description: string
}

export interface AppStateSnapshot {
    playlists: Playlist[]
    history: Track[]
}

export interface ApiSuccess {
    code: 0
    message: string
}

export interface ApiFailure {
    code: number
    message: string
}

export interface AudioStream {
    baseUrl?: string
    base_url?: string
}

export interface BiliPlayUrlResponse {
    code: number
    message?: string
    data?: {
        dash?: {
            audio?: AudioStream[]
        }
    }
}

export interface BiliVideoPage {
    cid: number
}

export interface BiliVideoDetailResponse {
    code: number
    message?: string
    data?: {
        cid?: number
        pages?: BiliVideoPage[]
    }
}

export interface BiliPageListResponse {
    code: number
    message?: string
    data?: BiliVideoPage[]
}

export interface BiliSearchVideoItem {
    bvid: string
    aid: number
    title: string
    author: string
    pic: string
    duration: string
    play: number
    description: string
}

export interface BiliSearchResultGroup {
    result_type: string
    data?: BiliSearchVideoItem[]
}

export interface BiliSearchResponse {
    code: number
    message?: string
    data?: {
        result?: BiliSearchResultGroup[]
    }
}

export interface BiliRecommendItem {
    bvid: string
    title: string
    pic: string
    duration?: number
    owner?: {
        name?: string
    }
    stat?: {
        view?: number
    }
}

export interface BiliRecommendResponse {
    code: number
    message?: string
    data?: {
        archives?: BiliRecommendItem[]
        item?: BiliRecommendItem[]
    }
}

export interface LoginQrCodeResponse {
    code: number
    message?: string
    data?: {
        url: string
        qrcode_key: string
    }
}

export interface LoginPollResponse {
    code: number
    message?: string
    data?: {
        code: number
    }
}

export interface UserInfo {
    isLogin: boolean
    face?: string
    uname?: string
}

export interface UserInfoResponse {
    code: number
    message?: string
    data?: UserInfo
}

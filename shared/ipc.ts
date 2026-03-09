import type {
    ApiFailure,
    ApiSuccess,
    AppStateSnapshot,
    BiliPageListResponse,
    BiliPlayUrlResponse,
    BiliRecommendResponse,
    BiliSearchResponse,
    BiliVideoDetailResponse,
    LoginPollResponse,
    LoginQrCodeResponse,
    Playlist,
    Track,
    UserInfoResponse,
} from './models'

export interface BiliMusicApi {
    loadAppState(): Promise<AppStateSnapshot>
    savePlaylists(playlists: Playlist[]): Promise<boolean>
    saveHistory(history: Track[]): Promise<boolean>
    clearAppData(): Promise<boolean>
    searchVideos(keyword: string, page?: number): Promise<BiliSearchResponse | ApiFailure>
    getPlayUrl(bvid: string, cid: number): Promise<BiliPlayUrlResponse | ApiFailure>
    getVideoDetail(bvid: string): Promise<BiliVideoDetailResponse | ApiFailure>
    getPageList(bvid: string): Promise<BiliPageListResponse | ApiFailure>
    getRecommendFeed(): Promise<BiliRecommendResponse | ApiFailure>
    getLoginQrCode(): Promise<LoginQrCodeResponse | ApiFailure>
    pollLoginQrCode(key: string): Promise<LoginPollResponse | ApiFailure>
    getUserInfo(): Promise<UserInfoResponse | ApiFailure>
    logout(): Promise<ApiSuccess | ApiFailure>
}

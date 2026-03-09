import type { BiliPageListResponse, BiliPlayUrlResponse, BiliVideoDetailResponse, Track } from '../types'
import { getRendererApi } from '../utils/ipc'

const AUDIO_PROXY_PORT = 48261
const cidCache = new Map<string, number>()
const audioUrlCache = new Map<string, string>()

function getAudioCacheKey(track: Track) {
    return `${track.bvid}:${track.cid}`
}

function extractCidFromDetail(response: BiliVideoDetailResponse) {
    return response.data?.cid ?? response.data?.pages?.[0]?.cid
}

function extractCidFromPageList(response: BiliPageListResponse) {
    return response.data?.[0]?.cid
}

function extractAudioUrl(response: BiliPlayUrlResponse) {
    const audioStream = response.data?.dash?.audio?.[0]
    return audioStream?.baseUrl ?? audioStream?.base_url
}

function toProxyUrl(audioUrl: string) {
    return `http://127.0.0.1:${AUDIO_PROXY_PORT}/?url=${encodeURIComponent(audioUrl)}`
}

export async function ensureTrackCid(track: Track): Promise<Track> {
    if (track.cid) {
        cidCache.set(track.bvid, track.cid)
        return track
    }

    const cachedCid = cidCache.get(track.bvid)
    if (cachedCid) {
        return { ...track, cid: cachedCid }
    }

    const api = getRendererApi()
    const detailResponse = await api.getVideoDetail(track.bvid)
    const detailCid = detailResponse.code === 0 && 'data' in detailResponse
        ? extractCidFromDetail(detailResponse)
        : undefined

    if (detailCid) {
        cidCache.set(track.bvid, detailCid)
        return { ...track, cid: detailCid }
    }

    const pageListResponse = await api.getPageList(track.bvid)
    const pageListCid = pageListResponse.code === 0 && 'data' in pageListResponse
        ? extractCidFromPageList(pageListResponse)
        : undefined

    if (!pageListCid) {
        throw new Error('播放失败：无法解析该内容的音频轨道。')
    }

    cidCache.set(track.bvid, pageListCid)
    return { ...track, cid: pageListCid }
}

export async function resolvePlaybackSource(track: Track) {
    const playableTrack = await ensureTrackCid(track)
    const cacheKey = getAudioCacheKey(playableTrack)
    const cachedAudioUrl = audioUrlCache.get(cacheKey)

    if (cachedAudioUrl) {
        return {
            track: playableTrack,
            src: toProxyUrl(cachedAudioUrl),
        }
    }

    const response = await getRendererApi().getPlayUrl(playableTrack.bvid, playableTrack.cid!)
    if (response.code !== 0 || !('data' in response)) {
        throw new Error(response.message || '播放失败：无法获取音频流。')
    }

    const audioUrl = extractAudioUrl(response)
    if (!audioUrl) {
        throw new Error('播放失败：当前内容没有可用音频流。')
    }

    audioUrlCache.set(cacheKey, audioUrl)

    return {
        track: playableTrack,
        src: toProxyUrl(audioUrl),
    }
}

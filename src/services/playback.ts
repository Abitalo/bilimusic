import type { BiliPlayUrlResponse, Track } from '../types'
import { getRendererApi } from '../utils/ipc'

const AUDIO_PROXY_PORT = 48261
const cidCache = new Map<string, number>()
const audioUrlCache = new Map<string, string>()

function getAudioCacheKey(track: Track) {
    return `${track.bvid}:${track.cid}`
}

function extractAudioUrl(response: BiliPlayUrlResponse) {
    const audioStream = response.data?.dash?.audio?.[0]
    return audioStream?.baseUrl ?? audioStream?.base_url
}

function toProxyUrl(audioUrl: string) {
    return `http://127.0.0.1:${AUDIO_PROXY_PORT}/?url=${encodeURIComponent(audioUrl)}`
}

interface EnsuredTrackMeta {
    track: Track
    additionalTracks?: Track[]
}

export async function ensureTrackCid(track: Track): Promise<EnsuredTrackMeta> {
    if (track.cid) {
        cidCache.set(track.bvid, track.cid)
        return { track }
    }

    const api = getRendererApi()
    const detailResponse = await api.getVideoDetail(track.bvid)
    let pages = ('data' in detailResponse) ? detailResponse.data?.pages : undefined

    if (!pages || pages.length === 0) {
        const pageListResponse = await api.getPageList(track.bvid)
        pages = ('data' in pageListResponse) ? pageListResponse.data : undefined
    }

    if (!pages || pages.length === 0) {
        throw new Error('播放失败：无法解析该内容的音频轨道。')
    }

    const detailCid = pages[0].cid
    cidCache.set(track.bvid, detailCid)
    const playableTrack = { ...track, cid: detailCid }

    if (pages.length > 1) {
        playableTrack.title = `${track.title} (P${pages[0].page || 1} ${pages[0].part || ''})`
        if (pages[0].duration) {
            playableTrack.duration = pages[0].duration
        }
    }

    const additionalTracks: Track[] = []
    if (pages.length > 1) {
        for (let i = 1; i < pages.length; i++) {
            const p = pages[i]
            additionalTracks.push({
                ...track,
                id: `${track.id}_p${p.page || i + 1}`,
                cid: p.cid,
                title: `${track.title} (P${p.page || i + 1} ${p.part || ''})`,
                duration: p.duration || track.duration
            })
        }
    }

    return { track: playableTrack, additionalTracks }
}

export async function resolvePlaybackSource(track: Track) {
    const { track: playableTrack, additionalTracks } = await ensureTrackCid(track)
    const cacheKey = getAudioCacheKey(playableTrack)
    const cachedAudioUrl = audioUrlCache.get(cacheKey)

    if (cachedAudioUrl) {
        return {
            track: playableTrack,
            src: toProxyUrl(cachedAudioUrl),
            additionalTracks
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
        additionalTracks
    }
}

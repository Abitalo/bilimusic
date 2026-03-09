import type { BiliRecommendItem, BiliRecommendResponse, BiliSearchResponse, SearchResult, Track } from '../types'

export interface FeedCardItem {
    bvid: string
    title: string
    author: string
    pic: string
    duration: number
    play: number
}

interface TrackSeed {
    bvid: string
    cid?: number
    title: string
    artist: string
    cover: string
    duration: number
    addedAt?: number
}

export function parseDurationLabel(duration: string): number {
    const parts = duration.split(':').map(Number)
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    return 0
}

export function formatDuration(seconds: number): string {
    if (!seconds || Number.isNaN(seconds)) return '0:00'

    const minutes = Math.floor(seconds / 60)
    const remainder = Math.floor(seconds % 60)
    return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

export function stripHtmlTags(html: string) {
    return html.replace(/<[^>]*>/g, '')
}

export function normalizeCoverUrl(url: string) {
    return url.startsWith('//') ? `https:${url}` : url
}

export function createTrack(seed: TrackSeed): Track {
    return {
        ...seed,
        addedAt: seed.addedAt ?? Date.now(),
    }
}

export function searchResponseToResults(response: BiliSearchResponse): SearchResult[] {
    const videoResults = response.data?.result?.find((group) => group.result_type === 'video')

    return (videoResults?.data ?? []).map((item) => ({
        bvid: item.bvid,
        aid: item.aid,
        title: stripHtmlTags(item.title),
        author: item.author,
        pic: normalizeCoverUrl(item.pic),
        duration: item.duration,
        play: item.play,
        description: item.description,
    }))
}

export function searchResultToTrack(result: SearchResult, addedAt = Date.now()): Track {
    return createTrack({
        bvid: result.bvid,
        title: result.title,
        artist: result.author,
        cover: result.pic,
        duration: parseDurationLabel(result.duration),
        addedAt,
    })
}

export function buildTrackQueue(results: SearchResult[], addedAt = Date.now()) {
    return results.map((result) => searchResultToTrack(result, addedAt))
}

function toFeedCardItem(item: BiliRecommendItem): FeedCardItem {
    return {
        bvid: item.bvid,
        title: item.title,
        author: item.owner?.name || '未知UP主',
        pic: normalizeCoverUrl(item.pic),
        duration: item.duration || 0,
        play: item.stat?.view || 0,
    }
}

export function recommendResponseToFeed(response: BiliRecommendResponse): FeedCardItem[] {
    const archives = response.data?.archives?.map(toFeedCardItem) ?? []
    if (archives.length > 0) {
        return archives
    }

    return response.data?.item?.map(toFeedCardItem) ?? []
}

export function feedItemToTrack(item: FeedCardItem, addedAt = Date.now()): Track {
    return createTrack({
        bvid: item.bvid,
        title: item.title,
        artist: item.author,
        cover: item.pic,
        duration: item.duration,
        addedAt,
    })
}

export interface Track {
    bvid: string;
    cid: number;
    title: string;
    artist: string;
    cover: string;
    duration: number;
    addedAt: number;
}

export interface SearchResult {
    bvid: string;
    aid: number;
    title: string;
    author: string;
    pic: string;
    duration: string;
    play: number;
    description: string;
}

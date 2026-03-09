import axios from 'axios'
import md5 from 'md5'
import { clearStoredCookie, getStoredCookie, setStoredCookie } from './store'

const md5Hash = (str: string) => md5(str)

const mixinKeyEncTab = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
    33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
    61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
    36, 20, 34, 44, 52
]

// Re-construct the mixin key based on img_key and sub_key
const getMixinKey = (orig: string) => mixinKeyEncTab.map((n) => orig[n]).join('').slice(0, 32)

// We'll cache the keys for 6 hours
let wbiKeys: { imgUrl: string, subUrl: string, imgKey: string, subKey: string, fetchTime: number } | null = null

// Base Axios instance
export const biliClient = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com'
    }
})

// Helper to inject cookies
export const setCookieInClient = (cookie: string) => {
    biliClient.defaults.headers['Cookie'] = cookie
    setStoredCookie(cookie)
}

// Initialize cookie from store
const storedCookie = getStoredCookie()
if (storedCookie) {
    biliClient.defaults.headers['Cookie'] = storedCookie
}

// Extract img_key and sub_key from url
const extKey = (url: string) => url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'))

// Get Wbi keys from nav endpoint
export async function getWbiKeys() {
    if (wbiKeys && (Date.now() - wbiKeys.fetchTime < 1000 * 60 * 60 * 6)) {
        return { imgKey: wbiKeys.imgKey, subKey: wbiKeys.subKey }
    }

    const res = await biliClient.get('https://api.bilibili.com/x/web-interface/nav')
    const { img_url, sub_url } = res.data.data.wbi_img

    wbiKeys = {
        imgUrl: img_url,
        subUrl: sub_url,
        imgKey: extKey(img_url),
        subKey: extKey(sub_url),
        fetchTime: Date.now()
    }

    return { imgKey: wbiKeys.imgKey, subKey: wbiKeys.subKey }
}

// Encrypt payload with Wbi signature
export async function encWbi(params: Record<string, string | number>) {
    const { imgKey, subKey } = await getWbiKeys()
    const mixinKey = getMixinKey(imgKey + subKey)
    const currTime = Math.round(Date.now() / 1000)
    const chrFilter = /[!'()*]/g

    Object.assign(params, { wts: currTime })

    const query = Object
        .keys(params)
        .sort()
        .map(key => {
            const value = params[key].toString().replace(chrFilter, '');
            return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        })
        .join('&');

    const wbiSign = md5Hash(query + mixinKey)
    return `${query}&w_rid=${wbiSign}`
}

export async function searchBilibili(keyword: string, page = 1) {
    const queryStr = await encWbi({
        keyword,
        search_type: 'video',
        page,
        page_size: 20
    })

    const res = await biliClient.get(`https://api.bilibili.com/x/web-interface/wbi/search/all/v2?${queryStr}`)
    return res.data
}

export async function getPlayUrl(bvid: string, cid: number, qn = 16) {
    // qn 16 is lowest (good for pure audio stream testing when not logged in), audio streams usually depend on fnval
    // DASH format fnval = 16 or 80
    const res = await biliClient.get(`https://api.bilibili.com/x/player/wbi/playurl`, {
        params: {
            bvid,
            cid,
            qn,
            fnval: 16,
            fnver: 0,
            fourk: 1
        }
    })
    return res.data
}

export async function getVideoDetail(bvid: string) {
    // Some videos are heavily protected, try WBI endpoint first
    try {
        const queryStr = await encWbi({ bvid })
        const res = await biliClient.get(`https://api.bilibili.com/x/web-interface/wbi/view?${queryStr}`)
        if (res.data.code === 0) return res.data
    } catch (error) {
        console.warn('WBI video detail lookup failed, falling back to legacy endpoint.', error)
    }

    // Fallback to normal view API, or we could also try pagelist since we mostly just want cid
    const res = await biliClient.get('https://api.bilibili.com/x/web-interface/view', {
        params: { bvid }
    })
    return res.data
}

// Just in case view API fails completely, exporting pagelist to easily get cid
export async function getPageList(bvid: string) {
    const res = await biliClient.get('https://api.bilibili.com/x/player/pagelist', {
        params: { bvid }
    })
    return res.data
}

export async function getLoginUrl() {
    const res = await biliClient.get('https://passport.bilibili.com/x/passport-login/web/qrcode/generate')
    return res.data
}

export async function pollLogin(qrcodeKey: string) {
    const res = await biliClient.get('https://passport.bilibili.com/x/passport-login/web/qrcode/poll', {
        params: { qrcode_key: qrcodeKey }
    })

    if (res.data.data && res.data.data.code === 0) {
        // Successful login, extract set-cookie headers
        const setCookieHeaders = res.headers['set-cookie']
        if (setCookieHeaders) {
            const cookies = setCookieHeaders.map((cookie) => cookie.split(';')[0]).join('; ')
            setCookieInClient(cookies)
        }
    }
    return res.data
}

export async function getUserInfo() {
    const res = await biliClient.get('https://api.bilibili.com/x/web-interface/nav')
    return res.data
}

export function logout() {
    biliClient.defaults.headers['Cookie'] = ''
    clearStoredCookie()
    return { code: 0, message: 'Success' }
}

export async function getRecommendFeed() {
    // Attempt to get dynamic region 3 (music) or top rcmd based on Bilibili dynamic feed api
    try {
        const res = await biliClient.get('https://api.bilibili.com/x/web-interface/dynamic/region', {
            params: { ps: 12, rid: 3 }
        })
        if (res.data.code === 0 && res.data.data?.archives) {
            return res.data
        }
    } catch (error) {
        console.warn('Primary recommend feed lookup failed, falling back to top recommendations.', error)
    }

    // Fallback to top recommend feed
    const res = await biliClient.get('https://api.bilibili.com/x/web-interface/index/top/rcmd', {
        params: { fresh_type: 3, version: 1, ps: 12 }
    })
    return res.data
}

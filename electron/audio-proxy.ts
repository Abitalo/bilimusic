import { createServer } from 'node:http'
import https from 'node:https'

const ALLOWED_HOST_SUFFIXES = ['bilivideo.com', 'hdslb.com', 'akamaized.net', 'mcdn.bilivideo.cn']

function isAllowedProxyTarget(targetUrl: URL) {
    if (targetUrl.protocol !== 'https:') {
        return false
    }

    const hostname = targetUrl.hostname.toLowerCase()
    return ALLOWED_HOST_SUFFIXES.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`))
}

// Create a local HTTP server to proxy Bilibili audio streams
// This bypasses CORS and allows us to inject the required Referer headers
export const startAudioProxy = (port = 48261) => {
    const server = createServer((req, res) => {
        // Expect URL format: /?url=ENCODED_AUDIO_URL
        const urlParam = new URL(req.url || '', `http://${req.headers.host}`).searchParams.get('url')

        if (!urlParam) {
            res.writeHead(400)
            res.end('Missing url parameter')
            return
        }

        let targetUrl: URL
        try {
            targetUrl = new URL(decodeURIComponent(urlParam))
        } catch {
            res.writeHead(400)
            res.end('Invalid target url')
            return
        }

        if (!isAllowedProxyTarget(targetUrl)) {
            res.writeHead(403)
            res.end('Blocked proxy target')
            return
        }

        // Stream the audio from Bilibili
        const proxyReq = https.get(targetUrl, {
            headers: {
                'Referer': 'https://www.bilibili.com',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                // Forward range headers so seeking works!
                ...(req.headers.range ? { 'Range': req.headers.range } : {})
            }
        }, (proxyRes) => {
            // Forward the Bilibili response headers to our frontend
            res.writeHead(proxyRes.statusCode || 200, proxyRes.headers)
            proxyRes.pipe(res)
        })

        // Let the browser handle the connection lifecycle via range requests
        // rather than enforcing a strict socket idle timeout.
        proxyReq.on('error', (err) => {
            console.error('Audio proxy error:', err)
            if (!res.headersSent) {
                res.writeHead(500)
                res.end('Proxy error')
            }
        })

        // If the frontend aborts the request, we abort the proxy
        req.on('close', () => {
            proxyReq.destroy()
        })
    })

    server.listen(port, '127.0.0.1', () => {
        console.log(`Audio proxy listening on 127.0.0.1:${port}`)
    })

    return server
}

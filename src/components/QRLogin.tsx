import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './QRLogin.css'

interface QRLoginProps {
    onClose: () => void
    onSuccess: () => void
}

export default function QRLogin({ onClose, onSuccess }: QRLoginProps) {
    const [qrUrl, setQrUrl] = useState('')
    const [qrKey, setQrKey] = useState('')
    const [statusMsg, setStatusMsg] = useState('正在获取二维码...')
    const [error, setError] = useState(false)
    const pollTimer = useRef<any>(null)

    useEffect(() => {
        // Generate QR code
        const ipc = (window as any).ipcRenderer
        if (!ipc) {
            setStatusMsg('IPC 不可用，请重启应用')
            setError(true)
            return
        }

        ipc.invoke('get-login-qrcode').then((res: any) => {
            if (res?.data?.url) {
                setQrUrl(res.data.url)
                setQrKey(res.data.qrcode_key)
                setStatusMsg('请使用 Bilibili 手机客户端扫码')
            } else {
                setStatusMsg('获取二维码失败，请重试')
                setError(true)
            }
        }).catch((err: any) => {
            console.error('QR code error:', err)
            setStatusMsg('网络异常：' + (err?.message || '未知错误'))
            setError(true)
        })

        return () => {
            if (pollTimer.current) clearInterval(pollTimer.current)
        }
    }, [])

    useEffect(() => {
        if (!qrKey) return

        const ipc = (window as any).ipcRenderer
        if (!ipc) return

        // Poll status every 3 seconds
        pollTimer.current = setInterval(async () => {
            try {
                const res = await ipc.invoke('poll-login-qrcode', qrKey)
                const code = res?.data?.code

                /* 
                  B站扫码状态码：
                  0: 成功
                  86038: 二维码失效
                  86090: 二维码已扫码未确认
                  86101: 未扫码
                */
                if (code === 0) {
                    setStatusMsg('登录成功！')
                    if (pollTimer.current) clearInterval(pollTimer.current)
                    setTimeout(onSuccess, 1500)
                } else if (code === 86038) {
                    setStatusMsg('二维码已失效，请刷新重新获取')
                    if (pollTimer.current) clearInterval(pollTimer.current)
                } else if (code === 86090) {
                    setStatusMsg('已扫码，请在手机端确认登录')
                }
            } catch (err) {
                console.error('Polling error', err)
            }
        }, 3000)

        return () => {
            if (pollTimer.current) clearInterval(pollTimer.current)
        }
    }, [qrKey, onSuccess])

    // Use a public QR code API to render the image (avoids react-qr-code crash)
    const qrImageUrl = qrUrl
        ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUrl)}`
        : ''

    const modal = (
        <div className="qr-modal-overlay" onClick={onClose}>
            <div className="qr-modal-content" onClick={e => e.stopPropagation()}>
                <button className="qr-close-btn" onClick={onClose}>✕</button>
                <h2 className="qr-title">登录 Bilibili</h2>

                <div className="qr-wrapper">
                    {qrImageUrl ? (
                        <img
                            src={qrImageUrl}
                            alt="Login QR Code"
                            width={180}
                            height={180}
                            style={{ display: 'block' }}
                        />
                    ) : (
                        <div className="qr-placeholder">
                            {error ? '⚠️' : '⏳'}
                        </div>
                    )}
                </div>

                <p className="qr-status">{statusMsg}</p>
                <p className="qr-hint">登录后可解锁高音质音频，并使用云端收藏功能</p>
            </div>
        </div>
    )

    return createPortal(modal, document.body)
}

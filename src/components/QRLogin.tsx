import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'react-qr-code'
import { getRendererApi } from '../utils/ipc'
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
    const pollTimer = useRef<number | null>(null)

    const clearPollTimer = () => {
        if (pollTimer.current !== null) {
            window.clearInterval(pollTimer.current)
            pollTimer.current = null
        }
    }

    useEffect(() => {
        let isCancelled = false

        async function loadQrCode() {
            try {
                const response = await getRendererApi().getLoginQrCode()
                if (isCancelled) return

                if (response.code === 0 && 'data' in response && response.data?.url) {
                    setQrUrl(response.data.url)
                    setQrKey(response.data.qrcode_key)
                    setStatusMsg('请使用 Bilibili 手机客户端扫码')
                    setError(false)
                } else {
                    setStatusMsg(response.message || '获取二维码失败，请重试')
                    setError(true)
                }
            } catch (err) {
                if (!isCancelled) {
                    console.error('QR code error:', err)
                    setStatusMsg(err instanceof Error ? `网络异常：${err.message}` : '网络异常：未知错误')
                    setError(true)
                }
            }
        }

        void loadQrCode()

        return () => {
            isCancelled = true
            clearPollTimer()
        }
    }, [])

    useEffect(() => {
        if (!qrKey) return

        let isCancelled = false

        // Poll status every 3 seconds
        pollTimer.current = window.setInterval(async () => {
            try {
                const response = await getRendererApi().pollLoginQrCode(qrKey)
                if (isCancelled) return

                const code = 'data' in response ? response.data?.code : undefined

                /* 
                  B站扫码状态码：
                  0: 成功
                  86038: 二维码失效
                  86090: 二维码已扫码未确认
                  86101: 未扫码
                */
                if (code === 0) {
                    setStatusMsg('登录成功！')
                    clearPollTimer()
                    window.setTimeout(onSuccess, 1500)
                } else if (code === 86038) {
                    setStatusMsg('二维码已失效，请刷新重新获取')
                    clearPollTimer()
                } else if (code === 86090) {
                    setStatusMsg('已扫码，请在手机端确认登录')
                }
            } catch (err) {
                console.error('Polling error', err)
            }
        }, 3000)

        return () => {
            isCancelled = true
            clearPollTimer()
        }
    }, [qrKey, onSuccess])

    const modal = (
        <div className="qr-modal-overlay" onClick={onClose}>
            <div className="qr-modal-content" onClick={e => e.stopPropagation()}>
                <button className="qr-close-btn" onClick={onClose}>✕</button>
                <h2 className="qr-title">登录 Bilibili</h2>

                <div className="qr-wrapper">
                    {qrUrl ? (
                        <QRCode
                            value={qrUrl}
                            size={180}
                            bgColor="transparent"
                            fgColor="#000000"
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

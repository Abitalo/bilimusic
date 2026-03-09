import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Settings } from 'lucide-react'
import type { UserInfo } from '../types'
import { getRendererApi } from '../utils/ipc'
import QRLogin from './QRLogin'
import './TopBar.css'

export default function TopBar() {
    const [query, setQuery] = useState('')
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
    const navigate = useNavigate()

    const checkLoginStatus = useCallback(async () => {
        try {
            const response = await getRendererApi().getUserInfo()
            if (response.code === 0 && 'data' in response && response.data?.isLogin) {
                setUserInfo(response.data)
            } else {
                setUserInfo(null)
            }
        } catch (error) {
            console.error('Failed to fetch user info:', error)
            setUserInfo(null)
        }
    }, [])

    useEffect(() => {
        let isCancelled = false

        void getRendererApi().getUserInfo()
            .then((response) => {
                if (isCancelled) return
                if (response.code === 0 && 'data' in response && response.data?.isLogin) {
                    setUserInfo(response.data)
                } else {
                    setUserInfo(null)
                }
            })
            .catch((error) => {
                if (!isCancelled) {
                    console.error('Failed to fetch user info:', error)
                    setUserInfo(null)
                }
            })

        return () => {
            isCancelled = true
        }
    }, [])

    const handleSearch = (e: FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`)
        }
    }

    return (
        <header className="topbar">
            <div className="topbar-left">
                {/* Spacer for macOS traffic lights */}
            </div>

            <form className="search-form" onSubmit={handleSearch}>
                <div className="search-wrapper">
                    <span className="search-icon"><Search size={20} /></span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="搜索 Bilibili 音乐、视频..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    {query && (
                        <button
                            type="button"
                            className="search-clear"
                            onClick={() => setQuery('')}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </form>

            <div className="topbar-actions">
                <button className="action-btn" title="通知"><Bell size={20} /></button>
                <button className="action-btn" title="设置"><Settings size={20} /></button>
                {userInfo ? (
                    <div className="user-profile">
                        <img src={userInfo.face} alt="Avatar" className="user-avatar" crossOrigin="anonymous" />
                    </div>
                ) : (
                    <button className="login-btn" onClick={() => setIsLoginModalOpen(true)}>登录</button>
                )}
            </div>

            {isLoginModalOpen && (
                <QRLogin
                    onClose={() => setIsLoginModalOpen(false)}
                    onSuccess={() => {
                        setIsLoginModalOpen(false)
                        void checkLoginStatus()
                    }}
                />
            )}
        </header>
    )
}

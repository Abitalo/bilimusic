import { useCallback, useEffect, useState, useRef } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Settings, Sun, Moon, LogOut, Trash2 } from 'lucide-react'
import type { UserInfo } from '../types'
import { getRendererApi } from '../utils/ipc'
import { useDialog } from '../hooks/useDialog'
import QRLogin from './QRLogin'
import './TopBar.css'

export default function TopBar() {
    const [query, setQuery] = useState('')
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        return (localStorage.getItem('bili_theme') as 'dark' | 'light') || 'dark'
    })

    const settingsRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()
    const { confirm } = useDialog()

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('bili_theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(t => t === 'dark' ? 'light' : 'dark')
    }

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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSearch = (e: FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`)
        }
    }

    const handleLogout = async () => {
        setIsSettingsOpen(false)
        const confirmed = await confirm({
            title: '退出登录',
            description: '退出后将丢失登录凭证，但会保留您的本地播放列表，是否继续？',
            confirmText: '退出登录',
            cancelText: '取消',
            tone: 'danger'
        })
        if (!confirmed) return

        const res = await getRendererApi().logout()
        if (res.code === 0) {
            setUserInfo(null)
        }
    }

    const handleClearData = async () => {
        setIsSettingsOpen(false)
        const step1 = await confirm({
            title: '清除所有数据',
            description: '这将永久清除您的所有本地播放列表和历史播放记录。您确定要这么做吗？',
            confirmText: '继续清除',
            cancelText: '取消',
            tone: 'danger'
        })
        if (!step1) return

        const step2 = await confirm({
            title: '最终确认',
            description: '清除数据操作不可逆，请确认是否清空所有播放状态与列表。',
            confirmText: '确认清空',
            cancelText: '保持现状',
            tone: 'danger'
        })
        if (!step2) return

        await getRendererApi().clearAppData()
        window.location.reload()
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
                <button className="action-btn" title={theme === 'dark' ? '切换日间模式' : '切换夜间模式'} onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div className="settings-wrapper" ref={settingsRef}>
                    <button className="action-btn" title="设置" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
                        <Settings size={20} />
                    </button>
                    {isSettingsOpen && (
                        <div className="settings-dropdown">
                            {userInfo && (
                                <button className="settings-item" onClick={handleLogout}>
                                    <LogOut size={16} />
                                    <span>退出登录</span>
                                </button>
                            )}
                            <button className="settings-item danger" onClick={handleClearData}>
                                <Trash2 size={16} />
                                <span>清除所有数据</span>
                            </button>
                        </div>
                    )}
                </div>
                {userInfo ? (
                    <div className="user-profile">
                        <img src={userInfo.face} alt="Avatar" className="user-avatar" crossOrigin="anonymous" title={userInfo.uname} />
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

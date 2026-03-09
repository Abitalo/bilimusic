import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Search, Library, Clock, PlusCircle, List, Trash2, Heart, Menu } from 'lucide-react'
import { useDialog } from '../hooks/useDialog'
import { useAppStore } from '../hooks/useAppStore'
import homeLogo from '../assets/home_logo.png'
import './Sidebar.css'

// Updated navItems to use lucide-react icons
const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/search', label: '搜索', icon: Search },
  { path: '/library', label: '收藏库', icon: Library },
  { path: '/history', label: '播放历史', icon: Clock },
]

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { playlists, createPlaylist, deletePlaylist } = useAppStore()
  const { confirm } = useDialog()
  const [isCreating, setIsCreating] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPlaylistName.trim()) {
      await createPlaylist(newPlaylistName.trim())
      setNewPlaylistName('')
      setIsCreating(false)
    }
  }

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className="collapse-btn" onClick={onToggle}>
          <Menu size={20} />
        </button>
        {!isCollapsed && (
          <div className="logo">
            <div className="logo-art">
              <img src={homeLogo} alt="BiliMusic" className="logo-image" />
            </div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {!isCollapsed && <div className="nav-section-title">菜单</div>}
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="sidebar-divider" />

        <div className="nav-section">
          <div className="section-header">
            {!isCollapsed && <span className="nav-section-title">我的播放列表</span>}
            <button
              className="add-list-btn"
              title="新建列表"
              onClick={() => {
                if (isCollapsed) onToggle()
                setIsCreating(true)
              }}
            >
              <PlusCircle size={18} />
            </button>
          </div>

          {isCreating && (
            <form className="create-playlist-form" onSubmit={handleCreateSubmit}>
              <input
                autoFocus
                type="text"
                placeholder="输入播放列表名称..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onBlur={() => { if (!newPlaylistName.trim()) setIsCreating(false) }}
                className="create-playlist-input"
              />
            </form>
          )}

          <div className="playlist-collection">
            {playlists.map(pl => (
              <div key={pl.id} className="playlist-item">
                <NavLink to={`/playlist/${pl.id}`} className={({ isActive }) => `playlist-link ${isActive ? 'active' : ''}`}>
                  {pl.id === 'liked' ? (
                    <Heart size={16} className="playlist-icon" style={{ fill: 'var(--accent-primary)', color: 'var(--accent-primary)' }} />
                  ) : (
                    <List size={16} className="playlist-icon" />
                  )}
                  <span className="playlist-name" style={{ display: isCollapsed ? 'none' : 'block' }}>{pl.name}</span>
                </NavLink>
                {pl.id !== 'liked' && (
                  <button
                    className="delete-playlist-btn"
                    title="删除列表"
                    onClick={async (e) => {
                      e.preventDefault()
                      const approved = await confirm({
                        title: '删除播放列表',
                        description: `确定要删除“${pl.name}”吗？这个操作不会影响已播放历史，但会移除列表本身。`,
                        confirmText: '删除',
                        cancelText: '取消',
                        tone: 'danger',
                      })
                      if (approved) {
                        await deletePlaylist(pl.id)
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  )
}

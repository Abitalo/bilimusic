# BiliMusic UI 大改版 + 功能增强

将现有 UI 从 glassmorphism 风格统一为 **Spotify 风格扁平化暗色设计**，同时实现 5 项功能增强。

## Proposed Changes

### Phase 1: 全局设计系统重构

#### [MODIFY] [index.css](file:///Users/bytedance/workspace/bilimusic/src/index.css)

重写 CSS 变量为 Spotify 风格：
- 背景色：`#000000`（base）、`#121212`（surface）、`#1db954`（accent-green）、`#282828`（elevated）
- 保留 bilibili 粉色 `#FB7299` 作为辅助强调色（用于"我喜欢"标记）
- 圆角改为 `4-8px`（扁平化），去掉 glassmorphism（`backdrop-filter`、`glass-*` 变量）
- 字体改用 `'Inter', 'Helvetica Neue', sans-serif`（通过 Google Fonts CDN）
- 新增 `--accent-green: #1db954`、`--bg-hover: #2a2a2a` 等 token

---

### Phase 2: 内置"我喜欢的音乐"列表

#### [MODIFY] [useAppStore.ts](file:///Users/bytedance/workspace/bilimusic/src/hooks/useAppStore.ts)

- 初始化时检查是否有 `id === 'liked'` 的列表，若没有则自动创建：
  ```ts
  { id: 'liked', name: '我喜欢的音乐', tracks: [], createdAt: Date.now() }
  ```
- 新增 `toggleLikeTrack(track)` 方法：如果 liked 列表中已有该 bvid 则移除，否则添加
- 新增 `isTrackLiked(bvid)` → `boolean`

#### [MODIFY] [Sidebar.tsx](file:///Users/bytedance/workspace/bilimusic/src/components/Sidebar.tsx)

- 侧边栏"我的播放列表"区域顶部固定显示"我喜欢的音乐"（带 ❤️ 图标），不可删除
- 用户创建的列表显示在下方

---

### Phase 3: 搜索结果 — 响应式 + 一键收藏 + 右键菜单

#### [MODIFY] [SearchPage.tsx](file:///Users/bytedance/workspace/bilimusic/src/pages/SearchPage.tsx)

1. **响应式布局**：track-item 改为 flex-wrap 或隐藏低优先级列（播放量），保证 `+` 按钮始终可见
2. **一键收藏**：`+` 按钮改为 ❤️ toggle（添加/移除"我喜欢的音乐"），无需确认
3. **右键菜单**（`onContextMenu`）：
   - 「播放」— 立即播放该曲目
   - 「下一首播放」— 插入到当前队列 `queueIndex + 1` 位置
   - 「添加到播放列表 ▸」— 二级菜单展开所有用户列表

#### [MODIFY] [SearchPage.css](file:///Users/bytedance/workspace/bilimusic/src/pages/SearchPage.css)

- 响应式 media query：窗口 < 700px 时隐藏 `.track-plays`
- 右键菜单样式（`.context-menu`, `.submenu`）
- Spotify 配色适配

#### [MODIFY] [App.tsx](file:///Users/bytedance/workspace/bilimusic/src/App.tsx)

- 新增 `handlePlayNext(track)` 方法，将 track 插入 queue 的 `queueIndex + 1` 位置
- 将 `handlePlayNext` 传递给 SearchPage

---

### Phase 4: PlayerBar — Shuffle + 播放队列 Drawer

#### [MODIFY] [PlayerBar.tsx](file:///Users/bytedance/workspace/bilimusic/src/components/PlayerBar.tsx)

- 替换 emoji 为 `lucide-react` 图标（`SkipBack`, `SkipForward`, `Play`, `Pause`, `Shuffle`, `Volume2` 等）
- 新增 **Shuffle 按钮**（`onShuffle` callback），高亮时表示已开启
- 右下角新增**队列按钮**（`ListMusic` 图标），点击切换 Drawer 展开/收起
- 接收 `queue`, `queueIndex`, `shuffleOn` 等新 props

#### [NEW] [QueueDrawer.tsx](file:///Users/bytedance/workspace/bilimusic/src/components/QueueDrawer.tsx)

- 从底部向上滑出的 Drawer（`max-height: 50vh`），覆盖在 PlayerBar 上方
- 显示当前播放队列列表，高亮当前曲目
- 每行右侧：
  - 「播放」按钮 → `onJumpTo(index)`
  - 「移除」按钮 → `onRemoveFromQueue(index)`
- 点击外部或再次点击队列按钮关闭

#### [NEW] [QueueDrawer.css](file:///Users/bytedance/workspace/bilimusic/src/components/QueueDrawer.css)

#### [MODIFY] [PlayerBar.css](file:///Users/bytedance/workspace/bilimusic/src/components/PlayerBar.css)

- 全部改为 Spotify 扁平化风格
- 播放按钮：白色圆形 + 黑色三角图标（Spotify 经典风格）
- 进度条：绿色 `--accent-green`

#### [MODIFY] [App.tsx](file:///Users/bytedance/workspace/bilimusic/src/App.tsx)

- 新增 `shuffleOn` state + `handleToggleShuffle`
- 新增 `handleRemoveFromQueue(index)`、`handleJumpTo(index)` 方法
- `handleNext`：如果 `shuffleOn` 则随机选取下一首

---

### Phase 5: 所有页面适配 Spotify 风格

#### [MODIFY] [Sidebar.css](file:///Users/bytedance/workspace/bilimusic/src/components/Sidebar.css)

- 去掉 glassmorphism，改为纯 `#000000` 背景
- 导航项 hover 高亮改为 `#282828`，active 颜色改为白色（而非粉色）
- Logo 渐变改为白色 + 绿色

#### [MODIFY] [TopBar.css](file:///Users/bytedance/workspace/bilimusic/src/components/TopBar.css)

- 去掉 `glass-panel` class
- 搜索框改圆角输入框无 border，`#242424` 背景
- 按钮统一扁平无边框风格

#### [MODIFY] [TopBar.tsx](file:///Users/bytedance/workspace/bilimusic/src/components/TopBar.tsx)

- 移除 `class="glass-panel"`，改为 `class="topbar"`

#### [MODIFY] [HomePage.css](file:///Users/bytedance/workspace/bilimusic/src/pages/HomePage.css)

- Hero section 改为 Spotify 风格渐变（深色到绿色渐变头部）
- 卡片改为 `#181818` + hover `#282828`，圆角 `8px`

#### [MODIFY] [LibraryPage.css](file:///Users/bytedance/workspace/bilimusic/src/pages/LibraryPage.css)

- 适配新配色

#### [MODIFY] [PlaylistPage.css](file:///Users/bytedance/workspace/bilimusic/src/pages/PlaylistPage.css)

- 播放列表详情页头部改 Spotify 风格渐变背景

#### [MODIFY] [QRLogin.css](file:///Users/bytedance/workspace/bilimusic/src/components/QRLogin.css)

- 模态框改为 `#282828` 背景 + 圆角 8px

#### [MODIFY] [index.html](file:///Users/bytedance/workspace/bilimusic/index.html)

- `<head>` 中加入 Google Fonts CDN `Inter` 字体链接

---

## 影响概览

| 文件 | 操作 | 说明 |
|------|------|------|
| `index.css` | MODIFY | 设计系统 token 重写 |
| `index.html` | MODIFY | 加字体 CDN |
| `useAppStore.ts` | MODIFY | 内置 Liked 列表 + toggle |
| `App.tsx` | MODIFY | shuffle、playNext、queue 管理 |
| `Sidebar.tsx/css` | MODIFY | 固定 Liked 项 + Spotify 配色 |
| `TopBar.tsx/css` | MODIFY | 去 glass、Spotify 配色 |
| `SearchPage.tsx/css` | MODIFY | 响应式、❤️、右键菜单 |
| `PlayerBar.tsx/css` | MODIFY | lucide 图标、shuffle、queue 按钮 |
| `QueueDrawer.tsx/css` | NEW | 底部弹出队列 Drawer |
| `HomePage.css` | MODIFY | Spotify 配色 |
| `LibraryPage.css` | MODIFY | Spotify 配色 |
| `PlaylistPage.css` | MODIFY | Spotify 配色 |
| `QRLogin.css` | MODIFY | Spotify 配色 |

## Verification Plan

### Manual Verification
1. 调整窗口宽度到最小，确认搜索结果 ❤️ 按钮仍可见
2. 右键搜索结果 → "播放"、"下一首播放"、"添加到 ▸ [子菜单]" 全部正常
3. 底部 Shuffle 按钮切换后，连续播放顺序随机
4. 右下角队列按钮 → Drawer 展开 → 点击"播放"跳到指定歌、"移除"删除歌曲
5. 所有页面视觉风格统一为 Spotify 扁平暗色调

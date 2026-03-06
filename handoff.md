# BiliMusic — Handoff Document

> 最后更新: 2026-03-05 18:44 (UTC+8)  
> Git commit: `da43fea` — "init: minimum runnable demo"

---

## 1. 项目概述

BiliMusic 是一款 **Electron 桌面音乐播放器**，从 Bilibili 搜索并后台播放纯音频。

| 技术栈 | |
|--------|---|
| 前端 | Vite + React 18 + TypeScript + Vanilla CSS |
| 桌面 | Electron (vite-plugin-electron) |
| 存储 | electron-store (JSON 持久化) |
| 音频 | HTML5 Audio + 本地 HTTP 反向代理 (port 48261) |
| API | Bilibili Web API + Wbi 签名 |

---

## 2. 已完成功能 ✅

| 功能 | 状态 | 关键文件 |
|------|------|----------|
| Wbi 签名 + 搜索 API | ✅ | `electron/bilibili-api.ts` |
| 音频流提取 + 本地代理 | ✅ | `electron/audio-proxy.ts` |
| 搜索页面（含播放） | ✅ | `src/pages/SearchPage.tsx` |
| 播放控制栏 | ✅ | `src/components/PlayerBar.tsx` |
| QR 码扫码登录 | ✅ | `src/components/QRLogin.tsx` + `electron/bilibili-api.ts` |
| Cookie 持久化 | ✅ | `electron/store.ts` |
| 创建/删除播放列表 | ✅ | `src/hooks/useAppStore.ts` + `src/components/Sidebar.tsx` |
| 播放列表详情页 | ✅ | `src/pages/PlaylistPage.tsx` |
| 添加歌曲到播放列表 | ✅ | `SearchPage.tsx` 中 `+` 按钮 → dropdown 选列表 |
| 收藏库页面 | ✅ | `src/pages/LibraryPage.tsx` |
| 播放历史记录追踪 | ✅ | `useAppStore.ts` → `addToHistory()` |

---

## 3. 已知 Bug / 注意事项 ⚠️

| # | 描述 | 严重度 |
|---|------|--------|
| 1 | `HistoryPage.tsx` 只有空状态壳，没有展示已记录的历史 | 低 |
| 2 | `PlaylistPage` 中"删除单曲"按钮只弹 `alert('开发中')`，未实际实现 | 低 |
| 3 | 终端偶尔出现 `representedObject is not a WeakPtrToElectronMenuModelAsNSObject` — Electron macOS 已知警告，不影响功能 | 无 |
| 4 | TypeScript 严格模式下有部分 `(window as any).ipcRenderer` 的 escape hatch，可以后续通过统一的 `preload.ts` bridge 改善 | 低 |

---

## 4. 下一步待办（已设计未实施）🚧

**用户已确认的实施计划**保存在项目根目录 `IMPLEMENTATION_PLAN.md`（即下方嵌入），包含 5 个阶段：

### Phase 1: Spotify 风格 UI 全局重构
- 重写 `index.css` 设计 token：黑底 + `#1db954` 绿色强调 + 扁平化圆角 4-8px
- 去掉所有 glassmorphism（`backdrop-filter`, `glass-*`）
- 加 Google Fonts `Inter` 字体

### Phase 2: 内置"我喜欢的音乐"列表
- `useAppStore.ts` 自动创建 `id='liked'` 的不可删除列表
- 新增 `toggleLikeTrack(track)` / `isTrackLiked(bvid)`
- Sidebar 固定显示 ❤️ "我喜欢的音乐"

### Phase 3: 搜索结果 — 响应式 + 一键收藏 + 右键菜单
- 响应式布局：窗口小时隐藏播放量列
- `+` 按钮改为 ❤️ toggle（直接添加/移除 liked）
- 右键菜单：「播放」「下一首播放」「添加到播放列表 ▸」（二级子菜单）

### Phase 4: PlayerBar — Shuffle + 播放队列 Drawer
- 全部 emoji 替换为 lucide-react 图标
- 新增 Shuffle 按钮 + 状态管理
- 新增右下角队列按钮 → 底部向上 `QueueDrawer` 组件（支持删除和跳到指定歌播放）

### Phase 5: 所有页面 Spotify 配色适配
- Sidebar、TopBar、HomePage、LibraryPage、PlaylistPage、QRLogin 全部重新配色

---

## 5. 项目文件结构

```
bilimusic/
├── electron/
│   ├── main.ts              # Electron 主进程入口
│   ├── preload.ts            # Context bridge (expose ipcRenderer)
│   ├── bilibili-api.ts       # B站 API 封装 (搜索/播放/登录/Wbi签名)
│   ├── ipc-handlers.ts       # IPC handler 注册
│   ├── audio-proxy.ts        # 本地音频反向代理 (HTTP, port 48261)
│   └── store.ts              # electron-store 实例
├── src/
│   ├── main.tsx              # React 入口
│   ├── App.tsx               # 根组件 (路由, 播放逻辑, 状态)
│   ├── App.css
│   ├── index.css             # 全局样式 + CSS 变量
│   ├── types/
│   │   ├── index.ts          # Track, SearchResult, Playlist 类型
│   │   └── electron.d.ts     # Window.ipcRenderer 类型声明
│   ├── utils/
│   │   └── ipc.ts            # getIpcBridge() 辅助 (已弃用，直接用 window.ipcRenderer)
│   ├── hooks/
│   │   └── useAppStore.ts    # 应用状态管理 (playlists, history)
│   ├── components/
│   │   ├── Sidebar.tsx/css   # 侧边栏导航 + 播放列表
│   │   ├── TopBar.tsx/css    # 顶部搜索栏 + 用户登录
│   │   ├── PlayerBar.tsx/css # 底部播放控制栏
│   │   └── QRLogin.tsx/css   # 登录二维码弹窗 (createPortal)
│   └── pages/
│       ├── HomePage.tsx/css      # 首页
│       ├── SearchPage.tsx/css    # 搜索页
│       ├── LibraryPage.tsx/css   # 收藏库
│       ├── PlaylistPage.tsx/css  # 播放列表详情
│       └── HistoryPage.tsx       # 播放历史 (待完善)
├── vite.config.ts            # Vite + Electron 插件配置
├── package.json
└── tsconfig*.json
```

---

## 6. 开发命令

```bash
# 安装依赖
npm install

# 开发模式 (Vite + Electron hot reload)
npm run dev

# 构建生产包
npm run build
```

---

## 7. 关键技术决策备忘

1. **音频播放**：B站音频 URL 需要正确的 `Referer` 头才能访问，因此通过 `audio-proxy.ts` 在 `127.0.0.1:48261` 运行本地 HTTP 代理，前端 `<audio>` 元素请求代理 URL，代理注入 Referer 后转发。
2. **IPC 通信**：使用 `contextBridge.exposeInMainWorld('ipcRenderer', {...})` 暴露安全的 IPC 接口。前端通过 `(window as any).ipcRenderer.invoke(channel, ...args)` 调用。
3. **QR 登录**：使用 `createPortal(modal, document.body)` 渲染，避免 TopBar `position:sticky` 的 stacking context 导致黑屏问题。
4. **Wbi 签名**：B站搜索 API 需要 Wbi 签名（`w_rid` 参数），实现在 `bilibili-api.ts` 的 `encWbi()` 函数中。
5. **electron-store**：前端通过 IPC `store-get` / `store-set` 读写，不直接在 renderer 中引用 Node 模块。

---

## 8. 之前对话中的实施计划

### 初始实施计划 (Conversation e818e085)

保存位置：此前对话的 artifact 路径
- 计划文件：详述了核心架构、登录机制、Wbi签名、播放列表方案、UI设计原则（YouTube Music 风格）
- 任务清单：Phase 1-8 详细拆解，Phase 1-5 已完成，Phase 6-7 基本完成

### 最新实施计划 (Conversation dcea9423 — 当前)

- 计划主题：**Spotify 风格 UI 大改版 + 5 项功能增强**
- **用户已确认**所有需求细节但**尚未批准正式开始编码**
- 详见上方 §4 摘要

---

## 9. 在新会话中继续

在新的 Antigravity 会话中，可以这样恢复上下文：

> "请阅读项目根目录的 `handoff.md` 文件了解当前项目状态。然后阅读 Phase 1-5 的实施计划并开始编码实现。"

关键注意事项：
- 运行 `npm run dev` 前确保依赖已安装（`npm install`）
- 当前 git 已有一个 commit `da43fea`，所有基础功能代码已提交
- 最新的实施计划描述了下一步工作（Spotify UI 重构 + 功能增强），用户已确认需求但未批准开始编码

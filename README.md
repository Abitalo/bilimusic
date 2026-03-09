# BiliMusic

BiliMusic 是一个基于 Electron、React 和 Vite 的桌面音乐播放器，核心目标是把 Bilibili 的搜索、登录和音频播放能力整理成稳定的桌面端体验。

## 特性

- B 站搜索与推荐流浏览
- HTML5 Audio 播放，支持队列、随机播放和历史记录
- 本地音频代理，解决媒体直链请求头限制
- 二维码登录与 Cookie 持久化
- 本地播放列表和“我喜欢的音乐”持久化

## 技术栈

- Electron 40
- React 19
- TypeScript 5
- Vite 8
- `electron-store` 用于本地持久化

## 运行方式

```bash
npm install
npm run dev
```

开发模式下，Vite 会同时构建 renderer、main 和 preload。

## 构建

```bash
npm run build
```

构建产物包含：

- `dist/`：renderer 构建输出
- `dist-electron/`：Electron main/preload 构建输出
- `release/`：`electron-builder` 生成的安装包

## 目录结构

```text
.
├── electron/                 # 主进程、IPC 和本地音频代理
├── shared/                   # main / renderer 共享类型
├── src/
│   ├── components/           # 通用 UI 组件
│   ├── hooks/                # 组合式 hook
│   ├── pages/                # 页面组件
│   ├── services/             # 播放等业务服务
│   ├── state/                # 全局状态 Provider / Context
│   ├── types/                # renderer 侧类型导出
│   └── utils/                # IPC 包装与数据转换工具
├── build/                    # 图标等打包资源
└── PROJECT_AUDIT_2026-03-06.md
```

## 核心架构

### 主进程

- `electron/bilibili-api.ts` 负责 B 站 API 封装与 WBI 签名
- `electron/ipc-handlers.ts` 负责 typed IPC channel
- `electron/audio-proxy.ts` 负责本地反向代理音频流
- `electron/store.ts` 负责持久化播放列表、历史和 Cookie

### 渲染进程

- `src/state/AppStoreProvider.tsx` 提供全局唯一状态源
- `src/services/playback.ts` 统一收口播放前补 `cid`、取音频流和缓存逻辑
- `src/utils/tracks.ts` 统一搜索结果、推荐卡片和 `Track` 的转换

## 开发约定

- renderer 侧不要直接使用裸 `ipcRenderer.invoke`
- 新增领域能力时，优先放进 `shared/` 类型、`electron/` handler 和 `src/utils/ipc.ts`
- 播放相关逻辑统一进入 `src/services/playback.ts`
- 列表/历史/喜欢等持久化状态统一通过 `AppStoreProvider`

## 验证

本仓库当前使用的基础静态检查命令：

```bash
npm run lint
npx tsc -b --pretty false
npm run verify
```

## 参考文档

- `PROJECT_AUDIT_2026-03-06.md`：架构审计、问题分级和后续重构建议
- `handoff.md`：历史背景与交接说明

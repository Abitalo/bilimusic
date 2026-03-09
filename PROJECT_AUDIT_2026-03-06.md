# BiliMusic 项目审计与重构建议

更新时间: 2026-03-06

说明: 本文档记录的是 2026-03-06 首轮重构前的审计基线。typed IPC、全局状态源、统一播放链路、README 清理等第一阶段改造已在同日落地。

## 1. 审计范围与结论

本次审计基于以下信息交叉完成:

- 你提供的 `project_review.md.resolved`
- 当前仓库源码
- `npm run lint`
- `npx tsc -b --pretty false`
- 目录与依赖体积快照

总体判断:

- 项目的核心技术路线是成立的: Electron 主进程负责 B 站接口与请求头伪装，渲染进程负责 UI，`audio-proxy` 负责让 `<audio>` 正常拉流。
- 当前最大的问题不是“功能缺失”，而是“边界失焦”。播放逻辑、数据转换、IPC 调用、状态持久化、页面 UI 混杂在一起，导致功能能跑，但后续改动成本会持续上升。
- 参考文档提到的 `CID fallback` 重复、搜索数据变形、样式污染都存在，但它们不是最优先的问题。当前第一优先级其实是状态架构和播放链路收口。

当前质量基线:

- `npm run lint`: 失败，48 个 error，1 个 warning
- `npx tsc -b --pretty false`: 通过
- `node_modules`: `788M`

## 2. 当前架构实况

### 2.1 主进程

主进程承担了 3 件核心工作:

1. 应用生命周期与窗口创建
   - `electron/main.ts`
2. B 站 API 封装
   - `electron/bilibili-api.ts`
3. 本地音频代理
   - `electron/audio-proxy.ts`

这部分架构方向是对的，尤其是:

- `bilibili-api.ts` 中的 WBI 签名逻辑是项目可用性的关键能力
- `audio-proxy.ts` 是解决 B 站媒体直链限制的必要层
- `session.defaultSession.webRequest.onBeforeSendHeaders` 让页面里直接加载 B 站资源时更容易成功

### 2.2 IPC 边界

当前 IPC 采用:

- `electron/ipc-handlers.ts` 注册 channel
- `electron/preload.ts` 通过 `contextBridge` 暴露通用 `invoke/send/on/off`

问题在于这层只解决了“能通信”，没有解决“边界清晰”和“类型收口”:

- 渲染层到处直接 `(window as any).ipcRenderer.invoke(...)`
- 暴露的是通用桥，而不是受限、可追踪的领域 API
- 业务数据结构没有统一响应类型

### 2.3 渲染层

渲染层当前由 3 类职责混合组成:

1. 顶层编排
   - `src/App.tsx`
2. 伪 store / 持久化
   - `src/hooks/useAppStore.ts`
3. 页面与组件
   - `src/pages/*`
   - `src/components/*`

问题不是文件多，而是职责穿透:

- 页面组件直接发 IPC
- 页面组件直接做播放准备
- 页面组件直接做领域模型转换
- 自定义 hook 既像 store，又不是单例 store

## 3. 参考文档中成立的判断

以下判断经核实是成立的:

- 项目确实依赖主进程请求伪装和本地代理来突破 B 站限制
- `CID` 补全过程存在重复实现
- 搜索结果到 `Track` 的转换没有统一入口
- 样式复用当前主要依赖类名复用和跨页面 CSS import，不是组件级复用
- 安装包百兆级在 Electron 里并不异常

## 4. 参考文档中需要修正或补充的地方

### 4.1 `CID fallback` 不只重复了 3 次，而是至少 4 处

参考文档列了 3 处，但当前代码中实际上有 4 处:

- `src/App.tsx:30`
- `src/pages/SearchPage.tsx:88`
- `src/pages/HomePage.tsx:64`
- `src/pages/PlaylistPage.tsx:48`

这说明问题已经不是“有点重复”，而是播放前置逻辑没有领域归属。

### 4.2 当前头号技术债不是 CSS，而是“伪 store”

`src/hooks/useAppStore.ts` 的名字像全局 store，但实现其实是“每次调用都创建一份局部 React state”:

- `src/App.tsx:28`
- `src/components/Sidebar.tsx:22`
- `src/pages/LibraryPage.tsx:7`
- `src/pages/SearchPage.tsx:66`
- `src/pages/PlaylistPage.tsx:15`
- `src/pages/HistoryPage.tsx:11`

这意味着:

- Sidebar 的 playlists
- LibraryPage 的 playlists
- PlaylistPage 的 playlists
- SearchPage 的 liked 状态
- App 内部 history 写入

并不是同一份内存状态，只是分别从 `electron-store` 读了一次后各自维护。

这是当前最需要优先修的架构问题。

### 4.3 当前“精简程度”问题比参考文档描述的更明显

仓库里存在多类明显没有收口的内容:

- 根目录 `README.md` 还是 Vite 模板
- 根目录保留了多份调试脚本:
  - `test_fetch.js`
  - `test_fetch_fail.js`
  - `test_fail.js`
  - `test_keys.js`
- `src/utils/ipc.ts` 已存在，但实际几乎没有被使用
- `package.json` 中有未使用依赖或工具痕迹:
  - `react-qr-code`
  - `concurrently`
  - `cross-env`
  - `wait-on`

这些问题本身不一定会让功能坏掉，但会持续拉高理解成本。

## 5. 关键问题清单

以下按优先级排序。

### P0: 状态架构是假单例，存在状态分裂

证据:

- `src/hooks/useAppStore.ts:13-154`
- `src/App.tsx:28`
- `src/components/Sidebar.tsx:22`
- `src/pages/SearchPage.tsx:66`
- `src/pages/PlaylistPage.tsx:15`
- `src/pages/HistoryPage.tsx:11`

问题本质:

- `useAppStore()` 是普通 React hook，不是单例 store，也没有 Context Provider。
- 每个页面/组件 mount 时都会各自执行 `loadData()`。
- 后续任何本地 `setPlaylists` / `setHistory` 都只更新当前 hook 实例，不会主动同步其他调用方。

实际影响:

- 某页面创建或删除列表后，其他页面可能不会即时反映
- “我喜欢的音乐”状态和 Sidebar/Library/Playlist 之间可能出现短暂不一致
- 同一份数据被重复读取、重复维护、重复持久化
- 播放历史写入是局部成功，不是全局响应式同步

建议:

- 第一阶段直接替换为真正的单一状态源
- 两种可行方案:
  - `React Context + reducer + 持久化 repository`
  - `Zustand` 或 `useSyncExternalStore` 实现的模块级 store
- 所有页面只消费统一 store，不再各自“加载一次”

### P0: 播放链路没有收口，领域逻辑散落在多个页面

证据:

- `src/App.tsx:30-75`
- `src/pages/SearchPage.tsx:88-126`
- `src/pages/HomePage.tsx:64-87`
- `src/pages/PlaylistPage.tsx:48-70`

问题本质:

- “把某个 B 站对象转成可播 Track” 这件事没有唯一入口
- `CID` 解析、失败兜底、告警文案、队列构建都分散在页面里
- 页面层承担了本应属于 application service / playback service 的职责

实际影响:

- 同样的修复要改 4 个地方
- 错误体验不一致
- 后续加缓存、重试、埋点、降级策略时改动面会很大
- 很难验证“播放链路”是否在所有入口下表现一致

建议:

- 建立统一播放服务，例如:
  - `resolveTrackPlayableData(trackLike)`
  - `ensureTrackCid(track)`
  - `getPlayableAudioUrl(track)`
  - `playTracks(queue, startIndex)`
- 页面只负责提交“用户意图”，不负责补数

### P1: SearchPage 存在事件监听泄漏

证据:

- `src/pages/SearchPage.tsx:73-85`

问题本质:

- `addEventListener('scroll', () => { ... }, true)` 和 `removeEventListener('scroll', () => { ... }, true)` 使用了两个不同的匿名函数
- 组件卸载时，scroll 监听器不会被正确移除

实际影响:

- 页面反复进入退出后会积累无效监听器
- 每次滚动都会多次执行菜单关闭逻辑
- 这类问题在 Electron 容器里通常不致命，但会慢慢放大 UI 抖动和排查成本

建议:

- 提取稳定的 handler 引用
- 顺手统一右键菜单的生命周期管理

### P1: 主进程安全边界过宽

证据:

- `electron/main.ts:41-46`
- `electron/preload.ts:4-24`
- `electron/audio-proxy.ts:6-52`

问题本质:

- `BrowserWindow` 开启了 `webSecurity: false`
- preload 暴露了通用 IPC 接口，而不是受限 API
- `audio-proxy` 接收任意 URL 参数后直接发起请求，没有主机白名单

这不只是安全问题，也会反过来影响维护性:

- 很难知道 renderer 实际依赖了哪些 channel
- 很难做接口演进和重命名
- 很难收敛“哪些事情应该由主进程负责”

建议:

- 开启 `webSecurity`
- preload 改为显式暴露:
  - `searchVideo`
  - `getVideoDetail`
  - `getPlayUrl`
  - `store.getPlaylists`
  - `store.setPlaylists`
  - 等等
- `audio-proxy` 限制协议与 host，仅允许 B 站媒体域名

### P1: 类型边界和错误处理失守，静态检查未形成准入门槛

证据:

- `npm run lint` 当前失败 48 个 error
- 典型问题集中在:
  - `src/App.tsx`
  - `src/hooks/useAppStore.ts`
  - `src/pages/SearchPage.tsx`
  - `src/pages/HomePage.tsx`
  - `src/components/TopBar.tsx`
  - `src/components/QRLogin.tsx`
  - `electron/ipc-handlers.ts`
  - `electron/bilibili-api.ts`

主要问题类型:

- `any` 大量存在
- 空 `catch {}`
- hook 依赖不准确
- effect 内部同步 setState 写法不规范
- `loadData` 先使用后声明

实际影响:

- 代码修改时难以依赖类型系统做回归保护
- 出错分支被吞掉，线上问题不容易定位
- React 19 对 effect / 编译优化的提示已经明确暴露出结构问题

建议:

- 先把 lint 调整到可通过，再做结构重构
- 补 IPC 响应类型
- 给 B 站 API 响应做最小领域类型定义

### P1: 样式系统没有真正组件化，只是从“重复写”变成“跨文件借用”

证据:

- `src/pages/HistoryPage.tsx:3-4`
- `src/pages/SearchPage.css`
- `src/pages/PlaylistPage.css`
- `src/components/Sidebar.css:158-197`
- `src/components/TopBar.css:131`
- `src/index.css:1-28`

问题本质:

- `HistoryPage` 直接 import `LibraryPage.css` 和 `PlaylistPage.css`
- `.track-list` / `.track-row` / `.col-title` 这类样式以“全局类名约定”复用
- 仍保留旧主题变量引用，例如 `--glass-border`，但 `src/index.css` 已未定义该变量

实际影响:

- 一处列表布局改动容易波及多个页面
- 样式来源不透明
- 视觉重构完成度看起来较高，但样式系统仍然是松散的

建议:

- 抽 `TrackList` / `TrackRow` 组件及其局部样式
- 把共享 token 和共享组件分开管理
- 清理遗留变量，避免“看起来存在、实际无效”的 CSS

### P2: 构建与包体管理有优化空间，但不是当前最高优先级

证据:

- `vite.config.ts:12-16`
- `package.json:37-68`

问题本质:

- 主进程构建把 `axios`、`md5` 等纯 JS 依赖 external 掉了
- 仓库里存在未使用依赖和调试脚本
- README 仍是模板，项目文档不收敛

说明:

- Electron 安装包百兆级是正常的
- 但当前仓库确实还有可做的精简

建议:

- 先做依赖盘点，再决定 external 策略
- 移除未使用依赖
- 清理调试脚本或迁移到 `scripts/`
- 更新 README，避免新会话或新成员误判项目状态

### P2: 登录二维码依赖第三方在线生成服务，可靠性不够

证据:

- `src/components/QRLogin.tsx:85-88`
- `package.json:44`

问题本质:

- 项目已经安装了 `react-qr-code`
- 但实际没有使用，而是依赖 `api.qrserver.com`

实际影响:

- 增加额外网络依赖
- 第三方服务故障会导致登录流程异常
- 对桌面应用来说，这种依赖没有必要

建议:

- 改回本地二维码渲染
- 同时移除未使用依赖或真正使用它

## 6. 当前最值得优先处理的性能点

这里的“性能”不只指 FPS，也包括请求冗余、状态同步成本和维护性能。

### 6.1 重复读取与重复维护 store

来源:

- 多个组件独立调用 `useAppStore()`

影响:

- 启动时会触发多次 `store-get`
- 本地状态同步不一致时，开发排查成本很高

### 6.2 播放前置请求没有缓存层

来源:

- 每次播放都可能重新请求:
  - `get-video-detail`
  - `get-page-list`
  - `get-play-url`

影响:

- 同一首歌重复播放时仍重复请求
- 队列跳转和历史回放都会走完整链路

建议:

- 增加内存缓存:
  - `bvid -> cid`
  - `bvid+cid -> playUrl`
- 采用 TTL 或按 session 生命周期缓存

### 6.3 搜索页监听器泄漏

来源:

- `src/pages/SearchPage.tsx:81-84`

影响:

- 页面切换次数越多，滚动监听越多

### 6.4 主进程与渲染层重复做数据塑形

来源:

- renderer 自己解析 B 站响应并转换成 `Track`

影响:

- 重复 map、重复字段清洗、重复持续维护

建议:

- 尽量在 IPC 边界附近就统一成领域模型

## 7. 可维护性评分

这是基于当前仓库状态给出的主观工程评分，方便后续比较重构收益。

| 维度 | 当前评分 | 说明 |
| --- | --- | --- |
| 架构边界清晰度 | 4/10 | 主流程能看懂，但职责混杂 |
| 状态管理可靠性 | 3/10 | `useAppStore` 命名与语义不符 |
| 类型系统有效性 | 4/10 | TS 能编译，但 lint 已失守 |
| 样式系统可控性 | 5/10 | 视觉统一尚可，样式边界较弱 |
| 扩展播放功能的难度 | 4/10 | 每加一项播放行为都要跨文件改 |
| 文档与仓库整洁度 | 3/10 | 模板 README、调试脚本、过期说明并存 |

## 8. 推荐的重构顺序

建议分 4 波，而不是一次性重写。

### 第一波: 稳定性与边界收口

目标:

- 先把“会继续恶化”的问题止住

内容:

- 重构 `useAppStore` 为真正的单一状态源
- 建立 typed IPC bridge
- 清掉 `window as any`
- 让 lint 可以通过

验收标准:

- 创建/删除/喜欢/历史在所有页面即时同步
- `npm run lint` 通过

### 第二波: 播放链路服务化

目标:

- 让所有播放入口走同一条链路

内容:

- 抽 `track` transformer
- 抽 `ensureCid`
- 抽 `playback service`
- 加 `cid` / `playUrl` 缓存

验收标准:

- 首页、搜索页、历史页、播放列表页播放逻辑一致
- 错误提示统一
- 重复播放同一条目请求数下降

### 第三波: 组件与样式收口

目标:

- 降低 UI 修改时的波及范围

内容:

- 抽共享 `TrackList`
- 清理跨页面 CSS import
- 清理遗留变量和旧命名

验收标准:

- 任何列表页的列布局调整只需要改一个共享实现

### 第四波: 构建与仓库卫生

目标:

- 提高仓库可读性并压缩无效内容

内容:

- 更新 README
- 清理调试脚本
- 盘点 unused dependencies
- 评估 external 配置

验收标准:

- 新人只读 README 和根目录文档即可理解项目

## 9. 我建议的第一次重构目标

如果你确认开始重构，我建议先做这一组，不先碰视觉层:

1. 把 `useAppStore` 改成真正的全局单例状态
2. 把播放前补数逻辑统一收口
3. 建 typed IPC API，移除 renderer 中的 `window as any`
4. 修掉 SearchPage 监听器泄漏
5. 把 lint 清到可通过

原因:

- 这组改动收益最高
- 对功能回归可控
- 能直接降低后续任何功能开发的复杂度
- 会为后面的 UI 重构、性能优化、缓存层加入提供稳定底座

## 10. 待你确认的问题

在进入真正重构前，我需要你确认这 3 件事:

1. 第一阶段是否按“状态与播放链路优先，视觉先不动”的顺序推进
2. 是否把安全边界收紧一并纳入第一阶段
   - 包括 `webSecurity`、typed preload、代理 URL 白名单
3. 根目录调试脚本和模板 README 是否可以一并清理

如果你确认，我会先按第 1 波和第 2 波连续落地，再给你一个可验证的阶段性提交说明。

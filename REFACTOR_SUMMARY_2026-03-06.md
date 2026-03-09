# BiliMusic 重构总结

更新时间: 2026-03-06

## 1. 本次重构的目标

这次重构不是做视觉翻新，而是先把项目的工程基础打稳，重点解决以下问题:

- 状态管理是假单例，页面之间会出现状态分裂
- 播放链路分散在多个页面，`cid` 补全和播放前置逻辑重复
- renderer 侧直接依赖裸 IPC，类型边界弱
- 原生 `prompt` / `confirm` / `alert` 阻塞交互，体验和维护性都差
- 页面之间存在重复列表 JSX 和重复加载/空状态 UI
- 构建链使用了不稳定的 `vite@8 beta`，带来额外 warning

## 2. 核心改动概览

### 2.1 主进程与 IPC 收口

已完成:

- 在 `shared/` 新增共享类型，统一 main / renderer 的数据契约
- 将 preload 改为显式暴露 typed API，而不是直接暴露通用 `ipcRenderer`
- 将 IPC handler 按职责拆成:
  - `app:*`
  - `bili:*`
  - `auth:*`
- `electron/store.ts` 补充了明确的应用状态读写方法

效果:

- renderer 不再到处写字符串 channel
- IPC 边界更可读，也更容易继续演进

### 2.2 状态管理重构为真正的全局单例

已完成:

- 用 `AppStoreProvider` + Context 重构了原先的伪 store
- `useAppStore` 现在只消费唯一状态源
- playlists / history 的持久化逻辑集中到了 provider 内部

涉及文件:

- `src/state/AppStoreProvider.tsx`
- `src/state/app-store-context.ts`
- `src/hooks/useAppStore.ts`

效果:

- Sidebar、Library、Playlist、History 不再各自维护一份局部副本
- 创建列表、删除列表、喜欢歌曲、历史记录现在能即时同步

### 2.3 播放链路服务化

已完成:

- 抽出 `src/services/playback.ts`
- 抽出 `src/utils/tracks.ts`
- 统一了:
  - Track 转换
  - `cid` 补全
  - 播放地址获取
  - 音频代理地址生成
  - 简单缓存

效果:

- `App.tsx`、`HomePage.tsx`、`SearchPage.tsx`、`PlaylistPage.tsx` 不再重复写播放前置逻辑
- 同一首歌的重复播放不必每次都重新走完整补数链路

### 2.4 页面与组件复用提升

已完成:

- 抽出通用轨道表格组件 `src/components/TrackTable.tsx`
- 抽出通用页面状态组件 `src/components/PageState.tsx`
- 抽出共享列表样式 `src/components/TrackList.css`

效果:

- PlaylistPage 和 HistoryPage 的列表 UI 复用统一组件
- Library / Playlist / History 的加载与空状态不再各写一套

### 2.5 原生阻塞式弹窗替换

已完成:

- 新增统一对话框系统:
  - `src/state/DialogProvider.tsx`
  - `src/state/dialog-context.ts`
  - `src/hooks/useDialog.ts`
  - `src/components/AppDialog.css`
- 已替换原先散落在页面和播放链路中的:
  - `prompt`
  - `confirm`
  - `alert`

效果:

- 交互不再依赖浏览器式阻塞弹窗
- 页面层表达的是“要确认什么”“要输入什么”，而不是直接操作原生 API

### 2.6 仓库卫生与文档清理

已完成:

- 删除根目录临时调试脚本:
  - `test_fail.js`
  - `test_fetch.js`
  - `test_fetch_fail.js`
  - `test_keys.js`
- 更新 `README.md`
- 为 `handoff.md` 和 `PROJECT_AUDIT_2026-03-06.md` 增加基线说明
- 增加统一验证命令 `npm run verify`

效果:

- 仓库入口文档不再是 Vite 模板
- 后续交接时，不会把旧架构误认为当前实现

### 2.7 构建链稳定化

已完成:

- 将 `vite` 从不稳定 beta 收敛到稳定受支持版本
- 当前组合:
  - `vite@7.3.1`
  - `@vitejs/plugin-react@5.1.4`
  - `vite-plugin-electron@0.29.0`

效果:

- 之前的这几类 warning 已消失:
  - `customResolver` deprecation
  - `freeze` invalid output option
  - `inlineDynamicImports` deprecation

## 3. 重构后的工程收益

### 3.1 可维护性

- 业务职责更明确: store、播放、IPC、页面展示边界已经基本成形
- 页面代码更薄，重复逻辑更少
- 公共 UI 结构从“复制粘贴”变成“组件复用”

### 3.2 可扩展性

- 后续如果要加:
  - 播放模式
  - 重试逻辑
  - 播放错误提示
  - 新的播放入口
  - 新的列表页

  都不需要再跨多个页面同步修改

### 3.3 构建稳定性

- 当前工具链已经回到稳定组合
- `verify` 和 `build` 可以作为后续迭代的固定回归基线

## 4. 验证结果

本次重构完成后，已验证:

- `npm run lint` 通过
- `npx tsc -b --pretty false` 通过
- `npm run verify` 通过
- `npm run build` 通过

构建阶段剩余说明:

- `electron-builder` 仍会输出一条 `duplicate dependency references` 提示
- 该提示不影响当前打包成功，本次按你的要求未继续处理

## 5. 变更规模

当前工作区统计结果:

- 34 个文件发生变更
- 约 `1009` 行新增
- 约 `1404` 行删除

这次重构的整体方向是“减少冗余和职责错位”，所以删除量大于新增量，属于预期结果。

## 6. 本次重构的阶段性结论

这次重构已经完成了最重要的基础工作:

- 状态统一
- 播放链路统一
- IPC 类型化
- 页面重复 UI 抽离
- 原生阻塞弹窗替换
- 构建链稳定化

当前仓库已经从“能跑但边界松散”，进入到“结构可持续演进”的状态。

## 7. 如果未来继续做

后续最值得做的方向有 3 个:

1. 补更正式的自动化测试体系，而不只是 `verify`
2. 继续把列表卡片、页面头部、空状态做更深一层组件化
3. 视需要处理 `electron-builder` 的重复依赖提示，并补正式 release 文档

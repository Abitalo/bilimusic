<div align="center">
  <img src="public/vite.svg" alt="BiliMusic Logo" width="100" />
  <h1>BiliMusic</h1>
  <p><strong>A high-performance, minimalist Bilibili audio player for desktop.</strong></p>

  <p>
    <img src="https://img.shields.io/github/v/release/Abitalo/bilimusic?style=flat-square" alt="Release" />
    <img src="https://img.shields.io/github/license/Abitalo/bilimusic?style=flat-square" alt="License" />
    <img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Windows-blue?style=flat-square" alt="Platform" />
    <img src="https://img.shields.io/badge/Built%20with-Vibe%20Coding-ff69b4?style=flat-square" alt="Vibe Coding" />
  </p>

  <p>
    <a href="#key-features">Features</a> •
    <a href="#showcase">Showcase</a> •
    <a href="#installation">Installation</a> •
    <a href="#security--privacy">Privacy</a>
  </p>
</div>

---

## 🌟 Overview / 项目简介

**BiliMusic** 是一款旨在通过极致精简的方式，带给你 Bilibili 听歌体验的跨平台桌面客户端。它剥离了视频流的冗余开销，专注于音频解析与本地播放管理。

这是一个纯正的 **Vibe Coding** 作品 —— 由人类开发者驱动创意，AI Agent 深度参与代码实现的结对编程产物。

## ✨ Key Features / 功能亮点

- **🎯 Core Audio Experience (核心播放体验)**
  - 自动解构 B 站多分 P 视频，支持全合辑自动入队与连播，彻底告别手动换 P。
  - 支持随机播放、循环模式及本地播放历史记录。
- **🌓 Adaptive Theme System (主题适配系统)**
  - 深度定制的 Dark / Light 模式。
  - 采用高阶 CSS 变量驱动，实现亚克力磨砂毛玻璃效果的热切换。
- **🔐 Privacy First (隐私至上)**
  - 数据 100% 存储于本地 `electron-store`。
  - 无任何隐藏服务器，所有请求直连 Bilibili 官方接口。
- **📦 Cross-Platform (跨平台支持)**
  - 同时支持 macOS (ARM64/Intel) 与 Windows 系统。

## 📸 Showcase / 界面预览

| 暗色模式 (Dark Mode) | 日间模式 (Light Mode) |
| :---: | :---: |
| <img src="assets/screenshots/dark_main.png" alt="Dark Mode" width="450"/> | <img src="assets/screenshots/light_main.png" alt="Light Mode" width="450"/> |

| 搜索 (Search) | 侧边栏与设置 (Settings) |
| :---: | :---: |
| <img src="assets/screenshots/search.png" alt="Search" width="450"/> | <img src="assets/screenshots/login.png" alt="Settings" width="450"/> |

## 🛠️ Tech Stack / 技术栈

- **Runtime**: Electron 30 + Node.js
- **Frontend**: React 18 + Vite 5 + TypeScript
- **Styling**: Native CSS Variables (Zero Runtime CSS-in-JS)
- **Networking**: Custom IPC Audio Proxy (Bypassing Referer/CORS)

## 🚀 Get Started / 快速上手

### 1. Installation
```bash
git clone https://github.com/Abitalo/bilimusic.git
cd bilimusic
npm install
```

### 2. Build for your OS
```bash
# Build for macOS
npm run build -- --mac dmg --arm64

# Build for Windows
npm run build -- --win nsis --x64
```

## 🔐 Security & Privacy / 安全与隐私

- **Zero Data Leak**: 所有的扫码登录凭证仅在您的本地加密存储。
- **Local Sandbox**: 播放列表与偏好设置通过本地 `electron-store` 存储在用户本地设备 `%APPDATA%` 或 `~/Library/Application Support`。
- **No Third-party Tracking**: 不包含任何统计插件或数据采集后台。

## 📜 License

Inspired by music lovers. Distributed under the [MIT License](LICENSE).

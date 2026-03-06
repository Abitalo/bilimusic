import { app, BrowserWindow, session } from 'electron'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setupIpcHandlers } from './ipc-handlers'
import { startAudioProxy } from './audio-proxy'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)

// Disable GPU acceleration for Windows 7
if (process.platform === 'win32') app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!isDev && !app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
}

let win: BrowserWindow | null = null

function setDevelopmentDockIcon() {
    if (process.platform !== 'darwin' || !isDev) return

    const dockIconPath = join(__dirname, '../build/icons/icon.png')
    if (existsSync(dockIconPath) && app.dock) {
        app.dock.setIcon(dockIconPath)
    }
}

async function createWindow() {
    win = new BrowserWindow({
        title: 'BiliMusic',
        width: 1024,
        height: 768,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: join(__dirname, 'preload.mjs'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false // Disabled for testing B站 API, better to use strict headers interception later
        },
        // macOS typical hidden title bar style
        titleBarStyle: 'hiddenInset',
        vibrancy: 'under-window',
        visualEffectState: 'active',
    })

    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL)
    } else {
        win.loadFile(join(__dirname, '../dist/index.html'))
    }

    if (process.env.VITE_DEV_SERVER_URL) {
        win.webContents.on('did-finish-load', async () => {
            try {
                const bridgeState = await win?.webContents.executeJavaScript(
                    `({ hasElectronAPI: Boolean(window.electronAPI), hasIpcRenderer: Boolean(window.ipcRenderer) })`
                )
                console.log('[bridge-check]', bridgeState)
            } catch (err) {
                console.error('[bridge-check] failed:', err)
            }
        })
    }
}

app.whenReady().then(() => {
    setDevelopmentDockIcon()
    setupIpcHandlers()
    startAudioProxy()

    // Also configure the default session's User-Agent strictly
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        // Only intercept external requests (Bilibili/images), not local vite dev
        if (details.url.includes('bilibili.com') || details.url.includes('hdslb.com')) {
            details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
            details.requestHeaders['Referer'] = 'https://www.bilibili.com';
        }
        callback({ requestHeaders: details.requestHeaders });
    })

    createWindow()
})

app.on('window-all-closed', () => {
    win = null
    if (process.platform !== 'darwin') app.quit()
})

if (!isDev) {
    app.on('second-instance', () => {
        if (win) {
            // Focus on the main window if the user tried to open another
            if (win.isMinimized()) win.restore()
            win.focus()
        }
    })
}

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length) {
        allWindows[0].focus()
    } else {
        createWindow()
    }
})

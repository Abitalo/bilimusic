export function getIpcBridge() {
    const bridge = window.electronAPI ?? window.ipcRenderer
    if (!bridge) {
        throw new Error('Electron IPC bridge unavailable. Please restart the app.')
    }
    return bridge
}

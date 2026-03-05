import { contextBridge, ipcRenderer } from "electron";
var bridgeApi = {
	on(...args) {
		const [channel, listener] = args;
		return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
	},
	off(...args) {
		const [channel, ...omit] = args;
		return ipcRenderer.off(channel, ...omit);
	},
	send(...args) {
		const [channel, ...omit] = args;
		return ipcRenderer.send(channel, ...omit);
	},
	invoke(...args) {
		const [channel, ...omit] = args;
		return ipcRenderer.invoke(channel, ...omit);
	}
};
contextBridge.exposeInMainWorld("ipcRenderer", bridgeApi);
contextBridge.exposeInMainWorld("electronAPI", bridgeApi);

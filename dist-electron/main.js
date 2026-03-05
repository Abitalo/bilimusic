import { BrowserWindow, app, ipcMain, session } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import axios from "axios";
import md5 from "md5";
import Store from "electron-store";
import { createServer } from "node:http";
import https from "node:https";
var store = new Store();
var md5Hash = (str) => md5(str);
var mixinKeyEncTab = [
	46,
	47,
	18,
	2,
	53,
	8,
	23,
	32,
	15,
	50,
	10,
	31,
	58,
	3,
	45,
	35,
	27,
	43,
	5,
	49,
	33,
	9,
	42,
	19,
	29,
	28,
	14,
	39,
	12,
	38,
	41,
	13,
	37,
	48,
	7,
	16,
	24,
	55,
	40,
	61,
	26,
	17,
	0,
	1,
	60,
	51,
	30,
	4,
	22,
	25,
	54,
	21,
	56,
	59,
	6,
	63,
	57,
	62,
	11,
	36,
	20,
	34,
	44,
	52
];
var getMixinKey = (orig) => mixinKeyEncTab.map((n) => orig[n]).join("").slice(0, 32);
var wbiKeys = null;
const biliClient = axios.create({ headers: {
	"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
	"Referer": "https://www.bilibili.com"
} });
const setCookieInClient = (cookie) => {
	biliClient.defaults.headers["Cookie"] = cookie;
	store.set("bili_cookie", cookie);
};
var storedCookie = store.get("bili_cookie");
if (storedCookie) biliClient.defaults.headers["Cookie"] = storedCookie;
var extKey = (url) => url.substring(url.lastIndexOf("/") + 1, url.lastIndexOf("."));
async function getWbiKeys() {
	if (wbiKeys && Date.now() - wbiKeys.fetchTime < 1e3 * 60 * 60 * 6) return {
		imgKey: wbiKeys.imgKey,
		subKey: wbiKeys.subKey
	};
	const { img_url, sub_url } = (await biliClient.get("https://api.bilibili.com/x/web-interface/nav")).data.data.wbi_img;
	wbiKeys = {
		imgUrl: img_url,
		subUrl: sub_url,
		imgKey: extKey(img_url),
		subKey: extKey(sub_url),
		fetchTime: Date.now()
	};
	return {
		imgKey: wbiKeys.imgKey,
		subKey: wbiKeys.subKey
	};
}
async function encWbi(params) {
	const { imgKey, subKey } = await getWbiKeys();
	const mixinKey = getMixinKey(imgKey + subKey);
	const currTime = Math.round(Date.now() / 1e3);
	const chrFilter = /[!'()*]/g;
	Object.assign(params, { wts: currTime });
	const query = Object.keys(params).sort().map((key) => {
		const value = params[key].toString().replace(chrFilter, "");
		return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
	}).join("&");
	return `${query}&w_rid=${md5Hash(query + mixinKey)}`;
}
async function searchBilibili(keyword, page = 1) {
	const queryStr = await encWbi({
		keyword,
		search_type: "video",
		page,
		page_size: 20
	});
	return (await biliClient.get(`https://api.bilibili.com/x/web-interface/wbi/search/all/v2?${queryStr}`)).data;
}
async function getPlayUrl(bvid, cid, qn = 16) {
	return (await biliClient.get(`https://api.bilibili.com/x/player/wbi/playurl`, { params: {
		bvid,
		cid,
		qn,
		fnval: 16,
		fnver: 0,
		fourk: 1
	} })).data;
}
async function getVideoDetail(bvid) {
	return (await biliClient.get("https://api.bilibili.com/x/web-interface/view", { params: { bvid } })).data;
}
async function getLoginUrl() {
	return (await biliClient.get("https://passport.bilibili.com/x/passport-login/web/qrcode/generate")).data;
}
async function pollLogin(qrcodeKey) {
	const res = await biliClient.get("https://passport.bilibili.com/x/passport-login/web/qrcode/poll", { params: { qrcode_key: qrcodeKey } });
	if (res.data.data && res.data.data.code === 0) {
		const setCookieHeaders = res.headers["set-cookie"];
		if (setCookieHeaders) setCookieInClient(setCookieHeaders.map((c) => c.split(";")[0]).join("; "));
	}
	return res.data;
}
async function getUserInfo() {
	return (await biliClient.get("https://api.bilibili.com/x/web-interface/nav")).data;
}
function logout() {
	biliClient.defaults.headers["Cookie"] = "";
	store.delete("bili_cookie");
	return {
		code: 0,
		message: "Success"
	};
}
function getErrorMessage(err) {
	return err instanceof Error ? err.message : "Unknown error";
}
function setupIpcHandlers() {
	ipcMain.handle("search-video", async (_, keyword, page = 1) => {
		try {
			return await searchBilibili(keyword, page);
		} catch (err) {
			console.error("Search error:", err);
			return {
				code: -1,
				message: getErrorMessage(err)
			};
		}
	});
	ipcMain.handle("get-play-url", async (_, bvid, cid) => {
		try {
			return await getPlayUrl(bvid, cid);
		} catch (err) {
			console.error("PlayUrl error:", err);
			return {
				code: -1,
				message: getErrorMessage(err)
			};
		}
	});
	ipcMain.handle("get-video-detail", async (_, bvid) => {
		try {
			return await getVideoDetail(bvid);
		} catch (err) {
			console.error("VideoDetail error:", err);
			return {
				code: -1,
				message: err?.message
			};
		}
	});
	ipcMain.handle("get-login-qrcode", async () => {
		try {
			return await getLoginUrl();
		} catch (err) {
			return {
				code: -1,
				message: err?.message
			};
		}
	});
	ipcMain.handle("poll-login-qrcode", async (_, key) => {
		try {
			return await pollLogin(key);
		} catch (err) {
			return {
				code: -1,
				message: err?.message
			};
		}
	});
	ipcMain.handle("get-user-info", async () => {
		try {
			return await getUserInfo();
		} catch (err) {
			return {
				code: -1,
				message: err?.message
			};
		}
	});
	ipcMain.handle("logout", () => {
		return logout();
	});
	ipcMain.handle("store-get", (_, key) => {
		return store.get(key);
	});
	ipcMain.handle("store-set", (_, key, value) => {
		store.set(key, value);
		return true;
	});
	ipcMain.handle("store-delete", (_, key) => {
		store.delete(key);
		return true;
	});
}
const startAudioProxy = (port = 48261) => {
	const server = createServer((req, res) => {
		const urlParam = new URL(req.url || "", `http://${req.headers.host}`).searchParams.get("url");
		if (!urlParam) {
			res.writeHead(400);
			res.end("Missing url parameter");
			return;
		}
		const targetUrl = decodeURIComponent(urlParam);
		const proxyReq = https.get(targetUrl, { headers: {
			"Referer": "https://www.bilibili.com",
			"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
			...req.headers.range ? { "Range": req.headers.range } : {}
		} }, (proxyRes) => {
			res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
			proxyRes.pipe(res);
		});
		proxyReq.on("error", (err) => {
			console.error("Audio proxy error:", err);
			if (!res.headersSent) {
				res.writeHead(500);
				res.end("Proxy error");
			}
		});
		req.on("close", () => {
			proxyReq.destroy();
		});
	});
	server.listen(port, "127.0.0.1", () => {
		console.log(`Audio proxy listening on 127.0.0.1:${port}`);
	});
	return server;
};
var __dirname = dirname(fileURLToPath(import.meta.url));
var isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
if (process.platform === "win32") app.disableHardwareAcceleration();
if (process.platform === "win32") app.setAppUserModelId(app.getName());
if (!isDev && !app.requestSingleInstanceLock()) {
	app.quit();
	process.exit(0);
}
var win = null;
async function createWindow() {
	win = new BrowserWindow({
		title: "BiliMusic",
		width: 1024,
		height: 768,
		minWidth: 800,
		minHeight: 600,
		webPreferences: {
			preload: join(__dirname, "preload.mjs"),
			nodeIntegration: false,
			contextIsolation: true,
			webSecurity: false
		},
		titleBarStyle: "hiddenInset",
		vibrancy: "under-window",
		visualEffectState: "active"
	});
	if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL);
	else win.loadFile(join(__dirname, "../dist/index.html"));
	if (process.env.VITE_DEV_SERVER_URL) win.webContents.on("did-finish-load", async () => {
		try {
			const bridgeState = await win?.webContents.executeJavaScript(`({ hasElectronAPI: Boolean(window.electronAPI), hasIpcRenderer: Boolean(window.ipcRenderer) })`);
			console.log("[bridge-check]", bridgeState);
		} catch (err) {
			console.error("[bridge-check] failed:", err);
		}
	});
}
app.whenReady().then(() => {
	setupIpcHandlers();
	startAudioProxy();
	session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
		if (details.url.includes("bilibili.com") || details.url.includes("hdslb.com")) {
			details.requestHeaders["User-Agent"] = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
			details.requestHeaders["Referer"] = "https://www.bilibili.com";
		}
		callback({ requestHeaders: details.requestHeaders });
	});
	createWindow();
});
app.on("window-all-closed", () => {
	win = null;
	if (process.platform !== "darwin") app.quit();
});
if (!isDev) app.on("second-instance", () => {
	if (win) {
		if (win.isMinimized()) win.restore();
		win.focus();
	}
});
app.on("activate", () => {
	const allWindows = BrowserWindow.getAllWindows();
	if (allWindows.length) allWindows[0].focus();
	else createWindow();
});

"use strict";
const electron = require("electron");
const path = require("path");
const promises = require("fs/promises");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
const is = {
  dev: !electron.app.isPackaged
};
const platform = {
  isWindows: process.platform === "win32",
  isMacOS: process.platform === "darwin",
  isLinux: process.platform === "linux"
};
const electronApp = {
  setAppUserModelId(id) {
    if (platform.isWindows)
      electron.app.setAppUserModelId(is.dev ? process.execPath : id);
  },
  setAutoLaunch(auto) {
    if (platform.isLinux)
      return false;
    const isOpenAtLogin = () => {
      return electron.app.getLoginItemSettings().openAtLogin;
    };
    if (isOpenAtLogin() !== auto) {
      electron.app.setLoginItemSettings({
        openAtLogin: auto,
        path: process.execPath
      });
      return isOpenAtLogin() === auto;
    } else {
      return true;
    }
  },
  skipProxy() {
    return electron.session.defaultSession.setProxy({ mode: "direct" });
  }
};
const optimizer = {
  watchWindowShortcuts(window, shortcutOptions) {
    if (!window)
      return;
    const { webContents } = window;
    const { escToCloseWindow = false, zoom = false } = shortcutOptions || {};
    webContents.on("before-input-event", (event, input) => {
      if (input.type === "keyDown") {
        if (!is.dev) {
          if (input.code === "KeyR" && (input.control || input.meta))
            event.preventDefault();
        } else {
          if (input.code === "F12") {
            if (webContents.isDevToolsOpened()) {
              webContents.closeDevTools();
            } else {
              webContents.openDevTools({ mode: "undocked" });
              console.log("Open dev tool...");
            }
          }
        }
        if (escToCloseWindow) {
          if (input.code === "Escape" && input.key !== "Process") {
            window.close();
            event.preventDefault();
          }
        }
        if (!zoom) {
          if (input.code === "Minus" && (input.control || input.meta))
            event.preventDefault();
          if (input.code === "Equal" && input.shift && (input.control || input.meta))
            event.preventDefault();
        }
      }
    });
  },
  registerFramelessWindowIpc() {
    electron.ipcMain.on("win:invoke", (event, action) => {
      const win = electron.BrowserWindow.fromWebContents(event.sender);
      if (win) {
        if (action === "show") {
          win.show();
        } else if (action === "showInactive") {
          win.showInactive();
        } else if (action === "min") {
          win.minimize();
        } else if (action === "max") {
          const isMaximized = win.isMaximized();
          if (isMaximized) {
            win.unmaximize();
          } else {
            win.maximize();
          }
        } else if (action === "close") {
          win.close();
        }
      }
    });
  }
};
const autosaveFilePath = path__namespace.join(electron.app.getPath("userData"), "autosave.json");
async function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  let initialAppState = {};
  try {
    const data = await promises.readFile(path.join(electron.app.getAppPath(), "map_main.json"), "utf-8");
    initialAppState = JSON.parse(data);
  } catch (err) {
    console.error("Failed to load map_main.json at startup:", err);
    initialAppState = {
      graphs: {},
      currentGraphId: "",
      history: []
    };
  }
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("initial-data", initialAppState);
  });
}
electron.app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.ipcMain.on("save-data", async (_event, data) => {
  const { filePath } = await electron.dialog.showSaveDialog({
    title: "Salva Mappa Personale",
    buttonLabel: "Salva",
    filters: [{ name: "JSON Files", extensions: ["json"] }]
  });
  if (filePath) {
    try {
      await promises.writeFile(filePath, data, "utf-8");
      console.log("Dati salvati con successo in:", filePath);
    } catch (err) {
      console.error("Errore durante il salvataggio dei dati:", err);
    }
  }
});
electron.ipcMain.on("load-data", async (event) => {
  const { filePaths } = await electron.dialog.showOpenDialog({
    title: "Carica Mappa Personale",
    buttonLabel: "Carica",
    properties: ["openFile"],
    filters: [{ name: "JSON Files", extensions: ["json"] }]
  });
  if (filePaths && filePaths.length > 0) {
    try {
      const data = await promises.readFile(filePaths[0], "utf-8");
      event.sender.send("data-loaded", data);
      console.log("Dati caricati con successo da:", filePaths[0]);
    } catch (err) {
      console.error("Errore durante il caricamento dei dati:", err);
    }
  }
});
electron.ipcMain.on("autosave-data", async (_event, data) => {
  try {
    await promises.writeFile(autosaveFilePath, data, "utf-8");
    console.log("Autosaved data successfully to:", autosaveFilePath);
  } catch (err) {
    console.error("Error during autosave:", err);
  }
});
electron.ipcMain.handle("load-autosaved-data", async () => {
  try {
    const data = await promises.readFile(autosaveFilePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error loading autosaved data:", err);
    return null;
  }
});

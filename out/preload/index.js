"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const api = {
  saveData: (data) => {
    electron.ipcRenderer.send("save-data", data);
  },
  loadData: () => {
    electron.ipcRenderer.send("load-data");
  },
  onDataLoaded: (callback) => {
    electron.ipcRenderer.on("data-loaded", (_event, data) => callback(data));
  },
  removeDataLoadedListener: () => {
    electron.ipcRenderer.removeAllListeners("data-loaded");
  },
  onInitialData: (callback) => {
    electron.ipcRenderer.on("initial-data", (_event, data) => callback(data));
  },
  removeInitialDataListener: () => {
    electron.ipcRenderer.removeAllListeners("initial-data");
  },
  // New autosave functions
  autosaveData: (data) => {
    electron.ipcRenderer.send("autosave-data", data);
  },
  loadAutosavedData: () => {
    return electron.ipcRenderer.invoke("load-autosaved-data");
  }
};
electron.contextBridge.exposeInMainWorld("api", api);
exports.api = api;

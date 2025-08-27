import { contextBridge, ipcRenderer } from 'electron'

export const api = {
  saveData: (data: string) => {
    ipcRenderer.send('save-data', data);
  },
  loadData: () => {
    ipcRenderer.send('load-data');
  },
  onDataLoaded: (callback: (data: string) => void) => {
    ipcRenderer.on('data-loaded', (_event, data) => callback(data));
  },
  removeDataLoadedListener: () => {
    ipcRenderer.removeAllListeners('data-loaded');
  },
  onInitialData: (callback: (data: any) => void) => {
    ipcRenderer.on('initial-data', (_event, data) => callback(data));
  },
  removeInitialDataListener: () => {
    ipcRenderer.removeAllListeners('initial-data');
  },
  // New autosave functions
  autosaveData: (data: string) => {
    ipcRenderer.send('autosave-data', data);
  },
  loadAutosavedData: () => {
    return ipcRenderer.invoke('load-autosaved-data');
  }
};

contextBridge.exposeInMainWorld('api', api);
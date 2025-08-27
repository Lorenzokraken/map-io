import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { writeFile, readFile } from 'fs/promises'
import * as path from 'path' // Import path module

const autosaveFilePath = path.join(app.getPath('userData'), 'autosave.json'); // Define autosave file path

async function createWindow(): Promise<void> {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  // Read map_main.json at startup
  let initialAppState: any = {}; // Use 'any' for now, will refine
  try {
    const data = await readFile(join(app.getAppPath(), 'map_main.json'), 'utf-8');
    initialAppState = JSON.parse(data);
  } catch (err) {
    console.error('Failed to load map_main.json at startup:', err);
    // Provide a default, valid initial state if loading fails
    initialAppState = {
      graphs: {},
      currentGraphId: '',
      history: [],
    };
  }

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Send initial data to renderer after window is ready
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('initial-data', initialAppState);
  });
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Existing Save data logic (for explicit save)
ipcMain.on('save-data', async (_event, data: string) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Salva Mappa Personale',
    buttonLabel: 'Salva',
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  })

  if (filePath) {
    try {
      await writeFile(filePath, data, 'utf-8')
      console.log('Dati salvati con successo in:', filePath)
    } catch (err) {
      console.error('Errore durante il salvataggio dei dati:', err)
    }
  }
})

// Existing Load data logic (for explicit load)
ipcMain.on('load-data', async (event) => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Carica Mappa Personale',
    buttonLabel: 'Carica',
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  })

  if (filePaths && filePaths.length > 0) {
    try {
      const data = await readFile(filePaths[0], 'utf-8')
      event.sender.send('data-loaded', data)
      console.log('Dati caricati con successo da:', filePaths[0])
    } catch (err) {
      console.error('Errore durante il caricamento dei dati:', err)
    }
  }
})

// New IPC handler for autosave
ipcMain.on('autosave-data', async (_event, data: string) => {
  try {
    await writeFile(autosaveFilePath, data, 'utf-8');
    console.log('Autosaved data successfully to:', autosaveFilePath);
  } catch (err) {
    console.error('Error during autosave:', err);
  }
});

// New IPC handler for loading autosaved data (can be called by renderer if needed, though initial load is handled above)
ipcMain.handle('load-autosaved-data', async () => {
  try {
    const data = await readFile(autosaveFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading autosaved data:', err);
    return null; // Return null if no autosaved data or error
  }
});
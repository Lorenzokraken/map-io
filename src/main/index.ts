import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { writeFile, readFile } from 'fs/promises'
import * as path from 'path' // Import path module

const autosaveFilePath = join(app.getAppPath(), 'map_main.json'); // Define autosave file path

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
  const mapMainPath = join(app.getAppPath(), 'map_main.json');
  const mapMainDefaultPath = join(app.getAppPath(), 'map_main_default.json');

  try {
    const data = await readFile(mapMainPath, 'utf-8');
    initialAppState = JSON.parse(data);
    console.log('Main: Loaded map_main.json. Initial state:', initialAppState);
  } catch (err) {
    console.warn('Main: map_main.json not found or failed to load. Trying map_main_default.json...', err);
    try {
      const data = await readFile(mapMainDefaultPath, 'utf-8');
      initialAppState = JSON.parse(data);
      console.log('Main: Loaded map_main_default.json. Initial state:', initialAppState);
    } catch (defaultErr) {
      console.error('Main: Failed to load map_main_default.json:', defaultErr);
      // Provide a default, valid initial state if loading fails
      initialAppState = {
        graphs: {},
        currentGraphId: '',
        history: [],
      };
      console.log('Main: Defaulting to empty state.');
    }
  }

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Send initial data to renderer after window is ready
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Main: Sending initial-data to renderer.');
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

// New IPC handler for chat messages
ipcMain.on('send-chat-message', (event, message: string, state: any) => {
  console.log('Received chat message:', message);
  console.log('Current mind map state:', state); // Log the received state

  // Simulate AI response and mind map manipulation
  let aiResponse = '';
  let updatedState = { ...state }; // Create a mutable copy of the state

  if (message.toLowerCase().includes('hello')) {
    aiResponse = 'Hello there! How can I help you with your mind map today?';
  } else if (message.toLowerCase().includes('create map about')) {
    const topic = message.toLowerCase().replace('create map about', '').trim();
    const newGraphId = `graph-${Date.now()}`;
    const newNodeId = `node-${Date.now()}`;
    updatedState.graphs[newGraphId] = {
      id: newGraphId,
      nodes: [{
        id: newNodeId,
        position: { x: 0, y: 0 },
        data: { title: topic, color: '#FFD700' },
        type: 'custom',
        width: 200,
        height: 50,
      }],
      edges: [],
      rootNodeId: newNodeId,
    };
    updatedState.currentGraphId = newGraphId;
    updatedState.history.push(newGraphId);
    aiResponse = `I've created a new mind map about "${topic}".`;
  } else if (message.toLowerCase().includes('add node')) {
    const parts = message.toLowerCase().split('to');
    if (parts.length === 2) {
      const newNodeTitle = parts[0].replace('add node', '').trim();
      const targetNodeTitle = parts[1].trim();

      const currentGraph = updatedState.graphs[updatedState.currentGraphId];
      if (currentGraph) {
        const targetNode = currentGraph.nodes.find((node: any) => node.data.title.toLowerCase() === targetNodeTitle);
        if (targetNode) {
          const newNodeId = `node-${Date.now()}`;
          const newEdgeId = `edge-${Date.now()}`;
          currentGraph.nodes.push({
            id: newNodeId,
            position: { x: targetNode.position.x + 200, y: targetNode.position.y + 50 },
            data: { title: newNodeTitle, color: '#87CEEB' },
            type: 'custom',
            width: 200,
            height: 50,
          });
          currentGraph.edges.push({
            id: newEdgeId,
            source: targetNode.id,
            target: newNodeId,
          });
          aiResponse = `I've added "${newNodeTitle}" to "${targetNodeTitle}".`;
        } else {
          aiResponse = `Could not find a node with the title: "${targetNodeTitle}".`;
        }
      } else {
        aiResponse = 'There is no active mind map to add nodes to. Please create one first.';
      }
    } else {
      aiResponse = 'Please specify the new node and the target node, e.g., "add node new idea to existing node".';
    }
  } else {
    aiResponse = 'I am an AI assistant for mind mapping. You can ask me to create maps (e.g., "create map about [topic]") or add nodes (e.g., "add node [new idea] to [existing node]").';
  }

  // Send back the AI response and the updated state
  event.sender.send('receive-chat-message', aiResponse, updatedState);
});
"use strict";
const electron = require("electron");
const path = require("path");
const promises = require("fs/promises");
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
const autosaveFilePath = path.join(electron.app.getAppPath(), "map_main.json");
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
  const mapMainPath = path.join(electron.app.getAppPath(), "map_main.json");
  const mapMainDefaultPath = path.join(electron.app.getAppPath(), "map_main_default.json");
  try {
    const data = await promises.readFile(mapMainPath, "utf-8");
    initialAppState = JSON.parse(data);
    console.log("Main: Loaded map_main.json. Initial state:", initialAppState);
  } catch (err) {
    console.warn("Main: map_main.json not found or failed to load. Trying map_main_default.json...", err);
    try {
      const data = await promises.readFile(mapMainDefaultPath, "utf-8");
      initialAppState = JSON.parse(data);
      console.log("Main: Loaded map_main_default.json. Initial state:", initialAppState);
    } catch (defaultErr) {
      console.error("Main: Failed to load map_main_default.json:", defaultErr);
      initialAppState = {
        graphs: {},
        currentGraphId: "",
        history: []
      };
      console.log("Main: Defaulting to empty state.");
    }
  }
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Main: Sending initial-data to renderer.");
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
electron.ipcMain.on("send-chat-message", (event, message, state) => {
  console.log("Received chat message:", message);
  console.log("Current mind map state:", state);
  let aiResponse = "";
  let updatedState = { ...state };
  if (message.toLowerCase().includes("hello")) {
    aiResponse = "Hello there! How can I help you with your mind map today?";
  } else if (message.toLowerCase().includes("create map about")) {
    const topic = message.toLowerCase().replace("create map about", "").trim();
    const newGraphId = `graph-${Date.now()}`;
    const newNodeId = `node-${Date.now()}`;
    updatedState.graphs[newGraphId] = {
      id: newGraphId,
      nodes: [{
        id: newNodeId,
        position: { x: 0, y: 0 },
        data: { title: topic, color: "#FFD700" },
        type: "custom",
        width: 200,
        height: 50
      }],
      edges: [],
      rootNodeId: newNodeId
    };
    updatedState.currentGraphId = newGraphId;
    updatedState.history.push(newGraphId);
    aiResponse = `I've created a new mind map about "${topic}".`;
  } else if (message.toLowerCase().includes("add node")) {
    const parts = message.toLowerCase().split("to");
    if (parts.length === 2) {
      const newNodeTitle = parts[0].replace("add node", "").trim();
      const targetNodeTitle = parts[1].trim();
      const currentGraph = updatedState.graphs[updatedState.currentGraphId];
      if (currentGraph) {
        const targetNode = currentGraph.nodes.find((node) => node.data.title.toLowerCase() === targetNodeTitle);
        if (targetNode) {
          const newNodeId = `node-${Date.now()}`;
          const newEdgeId = `edge-${Date.now()}`;
          currentGraph.nodes.push({
            id: newNodeId,
            position: { x: targetNode.position.x + 200, y: targetNode.position.y + 50 },
            data: { title: newNodeTitle, color: "#87CEEB" },
            type: "custom",
            width: 200,
            height: 50
          });
          currentGraph.edges.push({
            id: newEdgeId,
            source: targetNode.id,
            target: newNodeId
          });
          aiResponse = `I've added "${newNodeTitle}" to "${targetNodeTitle}".`;
        } else {
          aiResponse = `Could not find a node with the title: "${targetNodeTitle}".`;
        }
      } else {
        aiResponse = "There is no active mind map to add nodes to. Please create one first.";
      }
    } else {
      aiResponse = 'Please specify the new node and the target node, e.g., "add node new idea to existing node".';
    }
  } else {
    aiResponse = 'I am an AI assistant for mind mapping. You can ask me to create maps (e.g., "create map about [topic]") or add nodes (e.g., "add node [new idea] to [existing node]").';
  }
  event.sender.send("receive-chat-message", aiResponse, updatedState);
});

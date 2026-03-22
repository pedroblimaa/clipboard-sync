import { app, BrowserWindow } from 'electron'
import started from 'electron-squirrel-startup'
import path from 'node:path'
import { RelayBridge } from './relayBridge'
import { registerClipboardIpc } from './registerClipboardIpc'

let mainWindow: BrowserWindow | null = null
const relayBridge = new RelayBridge(app)

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools()
  relayBridge.setWindow(mainWindow)

  mainWindow.on('closed', () => {
    relayBridge.setWindow(null)
    mainWindow = null
  })
}

app.on('ready', async () => {
  registerClipboardIpc(relayBridge)
  await relayBridge.initialize()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  relayBridge.dispose()
})

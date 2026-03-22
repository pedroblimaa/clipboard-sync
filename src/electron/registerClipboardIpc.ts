import { ipcMain } from 'electron'
import { RelayBridge } from './relayBridge'

export function registerClipboardIpc(bridge: RelayBridge) {
  ipcMain.handle('clipboard:connect', async (_event, relayUrl: string) => {
    return bridge.connect(relayUrl)
  })

  ipcMain.handle('clipboard:disconnect', async () => {
    return bridge.disconnect()
  })

  ipcMain.handle('clipboard:status', async () => {
    return bridge.getStatus()
  })

  ipcMain.handle('clipboard:send', async (_event, content: string) => {
    return bridge.sendClipboard(content)
  })

  ipcMain.handle('clipboard:get', async () => {
    return bridge.getClipboard()
  })

  ipcMain.handle('clipboard:write', async (_event, content: string) => {
    return bridge.updateClipboard(content)
  })
}

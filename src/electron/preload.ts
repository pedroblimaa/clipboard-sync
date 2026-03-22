// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  connectRelay: (relayUrl: string) => ipcRenderer.invoke('clipboard:connect', relayUrl),
  disconnectRelay: () => ipcRenderer.invoke('clipboard:disconnect'),
  getRelayStatus: () => ipcRenderer.invoke('clipboard:status'),
  sendMessage: (content: string) => ipcRenderer.invoke('clipboard:send', content),
  getMessage: () => ipcRenderer.invoke('clipboard:get'),
  onClipboardUpdated: (callback: (content: string) => void) => {
    const listener = (_event: unknown, content: string) => callback(content)
    ipcRenderer.on('clipboard:updated', listener)

    return () => {
      ipcRenderer.removeListener('clipboard:updated', listener)
    }
  },
  onRelayStatus: (
    callback: (status: {
      clientId: string
      clientName: string
      isConnected: boolean
      relayUrl: string | null
    }) => void,
  ) => {
    const listener = (
      _event: unknown,
      status: {
        clientId: string
        clientName: string
        isConnected: boolean
        relayUrl: string | null
      },
    ) => callback(status)

    ipcRenderer.on('relay:status', listener)

    return () => {
      ipcRenderer.removeListener('relay:status', listener)
    }
  },
});

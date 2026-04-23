// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import type { RelayStatus } from '../../shared/relay';

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window:toggle-maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  connectRelay: (relayUrl: string) => ipcRenderer.invoke('clipboard:connect', relayUrl),
  disconnectRelay: () => ipcRenderer.invoke('clipboard:disconnect'),
  getRelayStatus: () => ipcRenderer.invoke('clipboard:status'),
  sendMessage: (content: string) => ipcRenderer.invoke('clipboard:send', content),
  getMessage: () => ipcRenderer.invoke('clipboard:get'),
  writeClipboard: (content: string) => ipcRenderer.invoke('clipboard:write', content),
  onClipboardUpdated: (callback: (content: string) => void) => {
    const listener = (_event: unknown, content: string) => callback(content)
    ipcRenderer.on('clipboard:updated', listener)

    return () => {
      ipcRenderer.removeListener('clipboard:updated', listener)
    }
  },
  onRelayStatus: (
    callback: (status: RelayStatus) => void,
  ) => {
    const listener = (
      _event: unknown,
      status: RelayStatus,
    ) => callback(status)

    ipcRenderer.on('relay:status', listener)

    return () => {
      ipcRenderer.removeListener('relay:status', listener)
    }
  },
});

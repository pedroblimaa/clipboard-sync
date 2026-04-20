import { BrowserWindow, clipboard, type App } from 'electron'
import type { ClientInfo, RelayStatus } from '../../shared/relay'
import { bridgeLogger } from '../shared/logger'
import { loadDeviceIdentity } from './deviceIdentity'
import { RelayClient } from './client'
import type { RelayClientCallbacks } from './model'

export class RelayBridge {
  private window: BrowserWindow | null = null
  private relayClient: RelayClient | null = null
  private deviceIdentity: ClientInfo | null = null

  constructor(private readonly electronApp: App) {}

  async initialize() {
    this.deviceIdentity ??= await loadDeviceIdentity(this.electronApp)
  }

  setWindow(nextWindow: BrowserWindow | null) {
    this.window = nextWindow
  }

  async connect(url: string) {
    const relayUrl = await this.buildFinalUrl(url)

    await this.ensureRelayClient(relayUrl)

    this.relayClient?.connect()

    return await this.emitAndGetStatus()
  }

  async disconnect() {
    this.disconnectRelayClient()

    return await this.emitAndGetStatus()
  }

  updateClipboard(content: string) {
    clipboard.writeText(content)
    this.emitClipboardUpdated(content)

    return true
  }

  sendClipboard(content: string) {
    return {
      ok: this.relayClient?.send(content) ?? false,
    }
  }

  getClipboard() {
    return clipboard.readText()
  }

  dispose() {
    this.disconnectRelayClient()
    this.window = null
  }

  async getStatus(): Promise<RelayStatus> {
    const clientInfo = await this.getDeviceIdentity()
    const relayClientSnapshot = this.relayClient?.getSnapshot()

    return {
      clientId: clientInfo.clientId,
      clientName: clientInfo.clientName,
      isConnected: relayClientSnapshot?.isConnected ?? false,
      relayUrl: relayClientSnapshot?.relayUrl ?? null,
      connectionState: relayClientSnapshot?.connectionState ?? 'disconnected',
      errorMessage: relayClientSnapshot?.lastError ?? null,
    }
  }

  private async buildFinalUrl(relayUrl: string) {
    const clientInfo = await this.getDeviceIdentity()
    const baseUrl = relayUrl?.includes('?') ? relayUrl : `${relayUrl}?pair_id=pair123`

    return `${baseUrl}&device_id=${clientInfo.clientId}`
  }

  private async getDeviceIdentity() {
    await this.initialize()
    return this.deviceIdentity as ClientInfo
  }

  private async ensureRelayClient(relayUrl: string) {
    const currentRelayUrl = this.relayClient?.getSnapshot().relayUrl
    if (relayUrl === currentRelayUrl) {
      return
    }

    this.disconnectRelayClient()

    const clientInfo = await this.getDeviceIdentity()
    this.relayClient = new RelayClient({
      relayUrl,
      clientInfo,
      callbacks: this.createRelayClientCallbacks(),
    })
  }

  private createRelayClientCallbacks(): RelayClientCallbacks {
    return {
      onStatusChange: () => void this.emitRelayStatus(),
      onMessage: content => this.updateClipboard(content),
      onError: error => bridgeLogger.error('Relay error:', error),
      onPeerConnected: peerClientInfo =>
        bridgeLogger.info('Relay peer connected:', peerClientInfo?.clientName, peerClientInfo?.clientId),
    }
  }

  private async emitRelayStatus() {
    const status = await this.getStatus()
    this.sendToWindow('relay:status', status)
  }

  private async emitAndGetStatus() {
    await this.emitRelayStatus()
    return await this.getStatus()
  }

  private emitClipboardUpdated(content: string) {
    this.sendToWindow('clipboard:updated', content)
  }

  private disconnectRelayClient() {
    this.relayClient?.disconnect()
    this.relayClient = null
  }

  private sendToWindow(channel: 'relay:status' | 'clipboard:updated', payload: RelayStatus | string) {
    if (!this.window || this.window.isDestroyed()) {
      return
    }

    this.window.webContents.send(channel, payload)
  }
}

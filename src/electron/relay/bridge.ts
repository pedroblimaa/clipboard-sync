import { BrowserWindow, clipboard, type App } from 'electron'
import type { ClipboardSyncItem, ClipboardSyncSource, ClientInfo, RelayStatus } from '../../shared/relay'
import { bridgeLogger } from '../shared/logger'
import { loadDeviceIdentity } from './deviceIdentity'
import { RelayClient } from './client'
import type { RelayClientCallbacks } from './model'

const CLIPBOARD_POLL_INTERVAL_MS = 500

type RendererChannel = 'relay:status' | 'clipboard:updated'

export class RelayBridge {
  private window: BrowserWindow | null = null
  private relayClient: RelayClient | null = null
  private deviceIdentity: ClientInfo | null = null
  private clipboardPollInterval: ReturnType<typeof setInterval> | undefined
  private lastClipboardContent = ''

  constructor(private readonly electronApp: App) {}

  async initialize() {
    await this.getDeviceIdentity()
    this.initializeClipboardMonitor()
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

  updateClipboard(content: string, clientInfo?: ClientInfo) {
    this.lastClipboardContent = content
    clipboard.writeText(content)

    this.emitClipboardSynced({
      content,
      source: 'remote',
      clientInfo,
    })

    return true
  }

  async sendClipboard(content: string) {
    const clientInfo = await this.getDeviceIdentity()
    const wasSent = this.relayClient?.send(content) ?? false

    if (wasSent) {
      this.emitClipboardSynced({
        content,
        source: 'local',
        clientInfo,
      })
    }

    return {
      ok: wasSent,
    }
  }

  getClipboard() {
    return clipboard.readText()
  }

  dispose() {
    this.stopClipboardMonitor()
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
    this.deviceIdentity ??= await loadDeviceIdentity(this.electronApp)
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
      onMessage: (content, clientInfo) => void this.applyRemoteClipboard(content, clientInfo),
      onError: error => bridgeLogger.error('Relay error:', error),
      onPeerConnected: peerClientInfo =>
        bridgeLogger.info('Relay peer connected:', peerClientInfo?.clientName, peerClientInfo?.clientId),
    }
  }

  private initializeClipboardMonitor() {
    this.lastClipboardContent = clipboard.readText()

    this.clipboardPollInterval ??= setInterval(() => {
      void this.syncLocalClipboardChangeToRelay()
    }, CLIPBOARD_POLL_INTERVAL_MS)
  }

  private stopClipboardMonitor() {
    clearInterval(this.clipboardPollInterval)
    this.clipboardPollInterval = undefined
  }

  private async syncLocalClipboardChangeToRelay() {
    const currentClipboardContent = clipboard.readText()

    if (!currentClipboardContent || currentClipboardContent === this.lastClipboardContent) {
      return
    }

    this.lastClipboardContent = currentClipboardContent
    await this.sendClipboard(currentClipboardContent)
  }

  private async applyRemoteClipboard(content: string, clientInfo?: ClientInfo) {
    const localClientInfo = await this.getDeviceIdentity()

    if (clientInfo?.clientId === localClientInfo.clientId) {
      return
    }

    this.updateClipboard(content, clientInfo)
  }

  private async emitRelayStatus() {
    const status = await this.getStatus()
    this.sendToWindow('relay:status', status)
  }

  private async emitAndGetStatus() {
    await this.emitRelayStatus()
    return await this.getStatus()
  }

  private emitClipboardSynced({
    content,
    source,
    clientInfo,
  }: {
    content: string
    source: ClipboardSyncSource
    clientInfo?: ClientInfo
  }) {
    const syncedAt = new Date().toISOString()
    const item: ClipboardSyncItem = {
      id: `${syncedAt}-${source}-${clientInfo?.clientId ?? 'unknown-device'}`,
      content,
      deviceId: clientInfo?.clientId ?? null,
      deviceName: clientInfo?.clientName ?? 'Unknown device',
      source,
      syncedAt,
    }

    this.sendToWindow('clipboard:updated', item)
  }

  private disconnectRelayClient() {
    this.relayClient?.disconnect()
    this.relayClient = null
  }

  private sendToWindow(channel: RendererChannel, payload: RelayStatus | ClipboardSyncItem) {
    if (!this.window || this.window.isDestroyed()) {
      return
    }

    this.window.webContents.send(channel, payload)
  }
}

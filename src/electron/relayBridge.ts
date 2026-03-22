import { App, BrowserWindow, clipboard } from 'electron'
import { loadDeviceIdentity } from './deviceIdentity'
import { ClientInfo, RelayClient } from './relayService'

export interface RelayStatus {
  clientId: string
  clientName: string
  isConnected: boolean
  relayUrl: string | null
}

export class RelayBridge {
  private window: BrowserWindow | null = null
  private relayClient: RelayClient | null = null
  private deviceIdentity: ClientInfo | null = null

  constructor(private readonly electronApp: App) {}

  async initialize() {
    if (!this.deviceIdentity) {
      this.deviceIdentity = await loadDeviceIdentity(this.electronApp)
    }
  }

  setWindow(window: BrowserWindow | null) {
    this.window = window
  }

  async connect(url: string) {
    const relayUrl = await this.buildFinalUrl(url)

    if (!this.relayClient || relayUrl !== this.relayClient?.relayUrl) {
      this.disconnectRelayClient()

      const clientInfo = await this.getDeviceIdentity()
      this.relayClient = new RelayClient({ relayUrl, clientInfo })
      this.bindRelayClientEvents(this.relayClient)
    }

    this.relayClient.connect()

    this.emitRelayStatus()
    return await this.getStatus()
  }

  async disconnect() {
    this.disconnectRelayClient()

    this.emitRelayStatus()
    return await this.getStatus()
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

    return {
      clientId: clientInfo.clientId,
      clientName: clientInfo.clientName,
      isConnected: this.relayClient?.isConnected ?? false,
      relayUrl: this.relayClient?.relayUrl ?? null,
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

  private async emitRelayStatus() {
    if (!this.window || this.window.isDestroyed()) {
      return
    }

    const status = await this.getStatus()
    this.window.webContents.send('relay:status', status)
  }

  private emitClipboardUpdated(content: string) {
    if (!this.window || this.window.isDestroyed()) {
      return
    }

    this.window.webContents.send('clipboard:updated', content)
  }

  private bindRelayClientEvents(client: RelayClient) {
    client.on('connected', async () => {
      this.emitRelayStatus()
    })

    client.on('disconnected', async () => {
      this.emitRelayStatus()
    })

    client.on('relay-error', async (error: Error) => {
      console.error('[Main] Relay error:', error)
      this.emitRelayStatus()
    })

    client.on('new-connection', (clientInfo: ClientInfo) => {
      console.log('[Main] Relay peer connected:', clientInfo.clientName, clientInfo.clientId)
    })

    client.on('message', (content?: string) => {
      if (typeof content !== 'string') {
        return
      }

      clipboard.writeText(content)
      this.emitClipboardUpdated(content)
    })
  }

  private disconnectRelayClient() {
    if (!this.relayClient) {
      return
    }

    this.relayClient.removeAllListeners()
    this.relayClient.disconnect()
    this.relayClient = null
  }
}

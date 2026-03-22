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

  async connect(relayUrl: string) {
    const clientInfo = await this.getDeviceIdentity()

    if (this.relayClient?.relayUrl === relayUrl) {
      this.relayClient.connect()
      const status = this.getRelayStatus(clientInfo)
      this.emitRelayStatus(status)
      return status
    }

    this.disconnectRelayClient()

    this.relayClient = new RelayClient({ relayUrl, clientInfo })
    this.bindRelayClientEvents(this.relayClient)
    this.relayClient.connect()

    const status = this.getRelayStatus(clientInfo)
    this.emitRelayStatus(status)
    return status
  }

  async disconnect() {
    const clientInfo = await this.getDeviceIdentity()
    this.disconnectRelayClient()

    const status = this.getRelayStatus(clientInfo)
    this.emitRelayStatus(status)
    return status
  }

  async getStatus() {
    const clientInfo = await this.getDeviceIdentity()
    return this.getRelayStatus(clientInfo)
  }

  sendClipboard(content: string) {
    clipboard.writeText(content)
    this.emitClipboardUpdated(content)

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

  private async getDeviceIdentity() {
    await this.initialize()
    return this.deviceIdentity as ClientInfo
  }

  private getRelayStatus(clientInfo: ClientInfo): RelayStatus {
    return {
      clientId: clientInfo.clientId,
      clientName: clientInfo.clientName,
      isConnected: this.relayClient?.isConnected ?? false,
      relayUrl: this.relayClient?.relayUrl ?? null,
    }
  }

  private emitRelayStatus(status: RelayStatus) {
    if (!this.window || this.window.isDestroyed()) {
      return
    }

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
      this.emitRelayStatus(await this.getStatus())
    })

    client.on('disconnected', async () => {
      this.emitRelayStatus(await this.getStatus())
    })

    client.on('relay-error', async (error: Error) => {
      console.error('[Main] Relay error:', error)
      this.emitRelayStatus(await this.getStatus())
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

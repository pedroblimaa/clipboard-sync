import { EventEmitter } from 'node:events'
import { RawData, WebSocket } from 'ws'

export interface RelayClientParams {
  relayUrl: string
  clientInfo: ClientInfo
  reconnectInterval?: number
}

export interface ClientInfo {
  clientId: string
  clientName: string
}

export type RelayConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'

interface Message {
  type: 'identify' | 'normal'
  content?: string
  clientInfo?: ClientInfo
}

export class RelayClient extends EventEmitter {
  ws?: WebSocket
  relayUrl: string
  clientInfo: ClientInfo
  reconnectInterval: number
  reconnectTimeout?: ReturnType<typeof setTimeout>
  isConnected = false
  isManuallyClosed = false
  connectionState: RelayConnectionState = 'disconnected'
  lastError: string | null = null

  constructor({ relayUrl, clientInfo, reconnectInterval = 3000 }: RelayClientParams) {
    super()
    this.relayUrl = relayUrl
    this.clientInfo = clientInfo
    this.reconnectInterval = reconnectInterval
  }

  connect() {
    const wsReadyState = this.ws?.readyState
    if (wsReadyState === WebSocket.OPEN || wsReadyState === WebSocket.CONNECTING) {
      return
    }

    this.isManuallyClosed = false
    this.clearReconnectTimeout()
    this.lastError = null
    this.connectionState = 'connecting'
    this.emit('connecting')
    this.ws = new WebSocket(this.relayUrl)

    this.ws.on('open', () => this.onOpen())
    this.ws.on('message', data => this.onMessage(data))
    this.ws.on('close', () => this.onClose())
    this.ws.on('error', error => this.onError(error))
  }

  disconnect() {
    this.isManuallyClosed = true
    this.clearReconnectTimeout()
    this.lastError = null
    this.connectionState = 'disconnected'
    this.ws?.close()

    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.isConnected = false
      this.emit('disconnected')
    }
  }

  send(message: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[RelayClient] Cannot send, socket is not open')
      return
    }

    const formattedMessage: Message = {
      type: 'normal',
      content: message,
    }

    this.ws.send(JSON.stringify(formattedMessage))
    return true
  }

  private onOpen() {
    this.isConnected = true
    this.clearReconnectTimeout()
    this.lastError = null
    this.connectionState = 'connected'
    console.log(`[Relay Client] Connected to ${this.relayUrl}`)

    this.emit('connected', this.clientInfo)
    this.identify()
  }

  private onMessage(data: RawData) {
    try {
      const message = JSON.parse(data.toString())
      this.handleMessage(message)
    } catch {
      console.error('[RelayClient] Invalid JSON received:', data.toString())
    }
  }

  private onClose() {
    this.isConnected = false
    this.ws = undefined
    this.connectionState = 'disconnected'
    console.log('[RelayClient] Connection closed')
    this.emit('disconnected')

    if (!this.isManuallyClosed) {
      this.scheduleReconnect()
    }
  }

  private onError(error: Error) {
    this.lastError = error.message
    console.error('[RelayClient] Websocket error:', error)
    this.emit('relay-error', error)
  }

  private identify() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    const message = JSON.stringify({
      type: 'identify',
      clientInfo: this.clientInfo,
    })

    this.ws.send(message)
  }

  private handleMessage(message: Message) {
    switch (message.type) {
      case 'identify':
        this.emit('new-connection', message.clientInfo)
        break
      case 'normal':
        this.emit('message', message.content)
        break
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout || this.isManuallyClosed) {
      return
    }

    this.connectionState = 'reconnecting'
    console.log(`[RelayClient] Reconnecting in ${this.reconnectInterval}ms...`)
    this.emit('reconnecting', this.reconnectInterval)

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = undefined
      this.connect()
    }, this.reconnectInterval)
  }

  private clearReconnectTimeout() {
    if (!this.reconnectTimeout) {
      return
    }

    clearTimeout(this.reconnectTimeout)
    this.reconnectTimeout = undefined
  }
}

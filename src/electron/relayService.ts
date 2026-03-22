import { EventEmitter } from 'node:events'
import { RawData, WebSocket } from 'ws'

interface RelayClientParams {
  relayUrl: string
  clientId: string
  reconnectInterval: number
}

interface Message {
  type: 'identify' | 'normal'
  content?: string
  clientId?: string
}

export class RelayClient extends EventEmitter {
  ws?: WebSocket
  relayUrl: string
  clientId: string
  reconnectInterval: number
  reconnectTimeout?: ReturnType<typeof setTimeout>
  isConnected = false
  isManuallyClosed = false

  constructor({ relayUrl, clientId, reconnectInterval = 3000 }: RelayClientParams) {
    super()
    this.relayUrl = relayUrl
    this.clientId = clientId
    this.reconnectInterval = reconnectInterval
  }

  connect() {
    const wsReadyState = this.ws?.readyState
    if (wsReadyState === WebSocket.OPEN || wsReadyState === WebSocket.CONNECTING) {
      return
    }

    this.isManuallyClosed = false
    this.clearReconnectTimeout()
    this.ws = new WebSocket(this.relayUrl)

    this.ws.on('open', () => this.onOpen())
    this.ws.on('message', data => this.onMessage(data))
    this.ws.on('close', () => this.onClose())
    this.ws.on('error', error => this.onError(error))
  }

  disconnect() {
    this.isManuallyClosed = true
    this.clearReconnectTimeout()
    this.ws?.close()
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
    console.log(`[Relay Client] Connected to ${this.relayUrl}`)

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
    console.log('[RelayClient] Connection closed')
    this.emit('disconnected')

    if (!this.isManuallyClosed) {
      this.scheduleReconnect()
    }
  }

  private onError(error: Error) {
    console.error('[RelayClient] Websocket error:', error)
    this.emit('relay-error', error)
  }

  private identify() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    const message = JSON.stringify({
      type: 'identify',
      clientId: this.clientId,
    })

    this.ws.send(message)
  }

  private handleMessage(message: Message) {
    switch (message.type) {
      case 'identify':
        this.emit('new-connection', message.clientId)
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

    console.log(`[RelayClient] Reconnecting in ${this.reconnectInterval}ms...`)

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

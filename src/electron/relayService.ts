import { EventEmitter } from 'node:events'
import { RawData } from 'ws'
import { WebSocket } from 'ws'

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
  isConnected = false
  isManuallyClosed = false

  constructor({ relayUrl, clientId, reconnectInterval = 3000 }: RelayClientParams) {
    super()
    this.relayUrl = relayUrl
    this.clientId = clientId
    this.reconnectInterval = reconnectInterval
  }

  connect() {
    if (this.isConnected) {
      return
    }

    this.ws = new WebSocket(this.relayUrl)

    this.ws.on('open', () => this.onOpen())
    this.ws.on('message', data => this.onMessage(data))
    this.ws.on('close', () => this.onClose())
    this.ws.on('error', error => this.onError(error))
  }

  disconnect() {
    this.isManuallyClosed = true
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
    console.log('[RelayClient] Connection closed')
    this.emit('disconnected')

    if (!this.isManuallyClosed) {
      this.scheduleReconnect()
    }
  }

  private onError(error: Error) {
    console.error('[RelayClient] Websocket error:', error)
    this.emit('error', error)
  }

  private identify() {
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
    console.log(`[RelayClient] Reconnecting in ${this.reconnectInterval}ms...`)

    setTimeout(() => {
      this.connect()
    }, this.reconnectInterval)
  }
}

import { WebSocket, type RawData } from 'ws'
import type { RelayConnectionState } from '../../shared/relay'
import {
  createIdentifyMessage,
  createNormalMessage,
  type RelayMessage,
  parseRelayMessage,
} from './protocol'
import { relayLogger } from '../shared/logger'
import type {
  RelayClientParams,
  RelayClientSnapshot,
} from './model'

export class RelayClient {
  private ws: WebSocket | undefined
  private reconnectTimeout: ReturnType<typeof setTimeout> | undefined
  private isConnected = false
  private isManuallyClosed = false
  private connectionState: RelayConnectionState = 'disconnected'
  private lastError: string | null = null
  private readonly relayUrl: string
  private readonly clientInfo: RelayClientParams['clientInfo']
  private readonly reconnectInterval: number
  private readonly callbacks: NonNullable<RelayClientParams['callbacks']>

  constructor({
    relayUrl,
    clientInfo,
    reconnectInterval = 3000,
    callbacks = {},
  }: RelayClientParams) {
    this.relayUrl = relayUrl
    this.clientInfo = clientInfo
    this.reconnectInterval = reconnectInterval
    this.callbacks = callbacks
  }

  connect() {
    const wsReadyState = this.ws?.readyState
    if (wsReadyState === WebSocket.OPEN || wsReadyState === WebSocket.CONNECTING) {
      return
    }

    this.isManuallyClosed = false
    this.clearReconnectTimeout()
    this.lastError = null
    this.setConnectionState('connecting')
    this.ws = new WebSocket(this.relayUrl)

    this.bindSocketEvents(this.ws)
  }

  disconnect() {
    this.isManuallyClosed = true
    this.clearReconnectTimeout()
    this.lastError = null
    this.setConnectionState('disconnected')
    this.ws?.close()

    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.isConnected = false
      this.callbacks.onStatusChange?.()
    }
  }

  send(message: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      relayLogger.warn('Cannot send, socket is not open')
      return
    }

    this.ws.send(JSON.stringify(createNormalMessage(message)))
    return true
  }

  getSnapshot(): RelayClientSnapshot {
    return {
      relayUrl: this.relayUrl,
      isConnected: this.isConnected,
      connectionState: this.connectionState,
      lastError: this.lastError,
    }
  }

  private clearReconnectTimeout() {
    clearTimeout(this.reconnectTimeout)
    this.reconnectTimeout = undefined
  }

  private setConnectionState(nextState: RelayConnectionState) {
    this.connectionState = nextState
    this.callbacks.onStatusChange?.()
  }

  private identify() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    this.ws.send(JSON.stringify(createIdentifyMessage(this.clientInfo)))
  }

  private handleMessage(message: RelayMessage) {
    switch (message.type) {
      case 'identify':
        this.callbacks.onPeerConnected?.(message.clientInfo)
        break
      case 'normal':
        if (typeof message.content === 'string') {
          this.callbacks.onMessage?.(message.content)
        }
        break
    }
  }

  private onOpen() {
    this.isConnected = true
    this.clearReconnectTimeout()
    this.lastError = null
    this.setConnectionState('connected')
    relayLogger.info(`Connected to ${this.relayUrl}`)

    this.identify()
  }

  private onMessage(data: RawData) {
    const message = parseRelayMessage(data.toString())

    if (!message) {
      relayLogger.error('Invalid JSON received:', data.toString())
      return
    }

    this.handleMessage(message)
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout || this.isManuallyClosed) {
      return
    }

    this.setConnectionState('reconnecting')
    relayLogger.info(`Reconnecting in ${this.reconnectInterval}ms...`)

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = undefined
      this.connect()
    }, this.reconnectInterval)
  }

  private onClose() {
    this.isConnected = false
    this.ws = undefined
    this.setConnectionState('disconnected')
    relayLogger.info('Connection closed')

    if (!this.isManuallyClosed) {
      this.scheduleReconnect()
    }
  }

  private onError(error: Error) {
    this.lastError = error.message
    relayLogger.error('Websocket error:', error)
    this.callbacks.onError?.(error)
    this.callbacks.onStatusChange?.()
  }

  private bindSocketEvents(socket: WebSocket) {
    socket.on('open', () => this.onOpen())
    socket.on('message', data => this.onMessage(data))
    socket.on('close', () => this.onClose())
    socket.on('error', error => this.onError(error))
  }
}

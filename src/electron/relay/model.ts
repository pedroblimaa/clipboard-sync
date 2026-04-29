import type { ClientInfo, RelayConnectionState } from '../../shared/relay'

export interface RelayClientSnapshot {
  relayUrl: string
  isConnected: boolean
  connectionState: RelayConnectionState
  lastError: string | null
}

export interface RelayClientCallbacks {
  onStatusChange?: () => void
  onMessage?: (content: string, clientInfo?: ClientInfo) => void
  onError?: (error: Error) => void
  onPeerConnected?: (clientInfo?: ClientInfo) => void
}

export interface RelayClientParams {
  relayUrl: string
  clientInfo: ClientInfo
  reconnectInterval?: number
  callbacks?: RelayClientCallbacks
}

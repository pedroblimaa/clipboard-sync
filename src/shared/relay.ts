export interface ClientInfo {
  clientId: string;
  clientName: string;
}

export type ClipboardSyncSource = 'local' | 'remote';

export interface ClipboardSyncItem {
  id: string;
  content: string;
  deviceId: string | null;
  deviceName: string;
  source: ClipboardSyncSource;
  syncedAt: string;
}

export type RelayConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';

export interface RelayStatus {
  clientId: string;
  clientName: string;
  isConnected: boolean;
  relayUrl: string | null;
  connectionState: RelayConnectionState;
  errorMessage: string | null;
}

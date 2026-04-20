export interface ClientInfo {
  clientId: string;
  clientName: string;
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

export {};

interface RelayStatus {
  clientId: string;
  clientName: string;
  isConnected: boolean;
  relayUrl: string | null;
}

declare global {
  interface Window {
    electronAPI: {
      connectRelay: (relayUrl: string) => Promise<RelayStatus>;
      disconnectRelay: () => Promise<RelayStatus>;
      getRelayStatus: () => Promise<RelayStatus>;
      sendMessage: (content: string) => Promise<{ ok: boolean }>;
      getMessage: () => Promise<string>;
      onClipboardUpdated: (callback: (content: string) => void) => () => void;
      onRelayStatus: (callback: (status: RelayStatus) => void) => () => void;
    };
  }
}

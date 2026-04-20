export {};
import type { RelayStatus } from '../../shared/relay';

declare global {
  interface Window {
    electronAPI: {
      connectRelay: (relayUrl: string) => Promise<RelayStatus>;
      disconnectRelay: () => Promise<RelayStatus>;
      getRelayStatus: () => Promise<RelayStatus>;
      sendMessage: (content: string) => Promise<{ ok: boolean }>;
      getMessage: () => Promise<string>;
      writeClipboard: (content: string) => Promise<boolean>;
      onClipboardUpdated: (callback: (content: string) => void) => () => void;
      onRelayStatus: (callback: (status: RelayStatus) => void) => () => void;
    };
  }
}

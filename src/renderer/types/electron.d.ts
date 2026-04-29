export {};
import type { ClipboardSyncItem, RelayStatus } from '../../shared/relay';

declare global {
  interface Window {
    electronAPI: {
      minimizeWindow: () => Promise<void>;
      toggleMaximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      connectRelay: (relayUrl: string) => Promise<RelayStatus>;
      disconnectRelay: () => Promise<RelayStatus>;
      getRelayStatus: () => Promise<RelayStatus>;
      sendMessage: (content: string) => Promise<{ ok: boolean }>;
      getMessage: () => Promise<string>;
      writeClipboard: (content: string) => Promise<boolean>;
      onClipboardUpdated: (callback: (item: ClipboardSyncItem) => void) => () => void;
      onRelayStatus: (callback: (status: RelayStatus) => void) => () => void;
    };
  }
}

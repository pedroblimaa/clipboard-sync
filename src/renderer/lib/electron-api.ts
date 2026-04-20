import type { RelayStatus } from '../../shared/relay';

export type { RelayStatus };

export const clipboardApi = {
  connectRelay(relayUrl: string) {
    return window.electronAPI.connectRelay(relayUrl);
  },
  disconnectRelay() {
    return window.electronAPI.disconnectRelay();
  },
  getRelayStatus() {
    return window.electronAPI.getRelayStatus();
  },
  sendMessage(content: string) {
    return window.electronAPI.sendMessage(content);
  },
  onClipboardUpdated(callback: (content: string) => void) {
    return window.electronAPI.onClipboardUpdated(callback);
  },
  onRelayStatus(callback: (status: RelayStatus) => void) {
    return window.electronAPI.onRelayStatus(callback);
  },
};

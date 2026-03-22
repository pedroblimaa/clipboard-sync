export const clipboardApi = {
  sendMessage(content: string) {
    return window.electronAPI.sendMessage(content);
  },
  getMessage() {
    return window.electronAPI.getMessage();
  },
  writeClipboard(content: string) {
    return window.electronAPI.writeClipboard(content);
  },
};

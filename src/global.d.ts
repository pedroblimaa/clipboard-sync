export {};

declare global {
  interface Window {
    electronAPI: {
      sendMessage: (content: string) => Promise<{ ok: true }>;
      getMessage: () => Promise<string>;
    };
  }
}

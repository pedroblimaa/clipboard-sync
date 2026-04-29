import type { ClientInfo } from '../../shared/relay';

export interface RelayMessage {
  type: 'identify' | 'clipboard';
  content?: string;
  clientInfo?: ClientInfo;
}

export function createIdentifyMessage(clientInfo: ClientInfo): RelayMessage {
  return {
    type: 'identify',
    clientInfo,
  };
}

export function createClipboardMessage(content: string, clientInfo: ClientInfo): RelayMessage {
  return {
    type: 'clipboard',
    content,
    clientInfo,
  };
}

export function parseRelayMessage(rawMessage: string): RelayMessage | null {
  try {
    return JSON.parse(rawMessage) as RelayMessage;
  } catch {
    return null;
  }
}

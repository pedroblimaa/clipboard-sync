import type { ClientInfo } from '../../shared/relay';

export interface RelayMessage {
  type: 'identify' | 'normal';
  content?: string;
  clientInfo?: ClientInfo;
}

export function createIdentifyMessage(clientInfo: ClientInfo): RelayMessage {
  return {
    type: 'identify',
    clientInfo,
  };
}

export function createNormalMessage(content: string): RelayMessage {
  return {
    type: 'normal',
    content,
  };
}

export function parseRelayMessage(rawMessage: string): RelayMessage | null {
  try {
    return JSON.parse(rawMessage) as RelayMessage;
  } catch {
    return null;
  }
}

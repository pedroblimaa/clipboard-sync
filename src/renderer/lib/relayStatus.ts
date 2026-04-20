import type { RelayStatus } from '../../shared/relay';

export const initialRelayStatus: RelayStatus = {
  clientId: '',
  clientName: '',
  isConnected: false,
  relayUrl: null,
  connectionState: 'disconnected',
  errorMessage: null,
};

export function sanitizeRelayUrl(relayUrl: string | null) {
  if (!relayUrl) {
    return '';
  }

  try {
    const parsedUrl = new URL(relayUrl);
    parsedUrl.searchParams.delete('device_id');
    parsedUrl.searchParams.delete('pair_id');
    return parsedUrl.toString();
  } catch {
    return relayUrl
      .replace(/[?&](device_id|pair_id)=[^&]*/g, '')
      .replace(/[?&]$/, '');
  }
}

export function buildStatusDetail(status: RelayStatus) {
  switch (status.connectionState) {
    case 'connected':
      return `Connected as ${status.clientName || status.clientId}.`;
    case 'connecting':
      return 'Connecting to the relay...';
    case 'reconnecting':
      return status.errorMessage
        ? `Connection lost: ${status.errorMessage}. Retrying...`
        : 'Connection lost. Retrying...';
    case 'disconnected':
    default:
      return status.errorMessage
        ? `Unable to connect: ${status.errorMessage}`
        : 'Disconnected from relay.';
  }
}

export function getStatusLabel(status: RelayStatus) {
  switch (status.connectionState) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting';
    case 'reconnecting':
      return 'Reconnecting';
    case 'disconnected':
    default:
      return 'Disconnected';
  }
}

export function isConnectionActive(status: RelayStatus) {
  return status.connectionState !== 'disconnected';
}

export function buildLogEntry(content: string) {
  const time = new Date().toLocaleTimeString();
  return `[${time}] ${content}`;
}

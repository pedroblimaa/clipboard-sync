import { useEffect, useEffectEvent, useState } from 'react';
import { clipboardApi, type RelayStatus } from '../lib/electron-api';

const initialRelayStatus: RelayStatus = {
  clientId: '',
  clientName: '',
  isConnected: false,
  relayUrl: null,
  connectionState: 'disconnected',
  errorMessage: null,
};

function sanitizeRelayUrl(relayUrl: string | null) {
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

function buildLogEntry(content: string) {
  const time = new Date().toLocaleTimeString();
  return `[${time}] ${content}`;
}

function buildStatusDetail(status: RelayStatus) {
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

export function useClipboard() {
  const [connectionUrl, setConnectionUrl] = useState('');
  const [messageToSend, setMessageToSend] = useState('');
  const [receivedMessages, setReceivedMessages] = useState('');
  const [relayStatus, setRelayStatus] = useState(initialRelayStatus);
  const [statusDetail, setStatusDetail] = useState('Enter a websocket URL and connect.');
  const [isTogglingConnection, setIsTogglingConnection] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const syncRelayStatus = useEffectEvent((status: RelayStatus) => {
    setRelayStatus(status);
    setConnectionUrl((currentUrl) => currentUrl || sanitizeRelayUrl(status.relayUrl));
    setStatusDetail(buildStatusDetail(status));
  });

  const appendReceivedMessage = useEffectEvent((content: string) => {
    setReceivedMessages((currentMessages) => {
      const nextMessage = buildLogEntry(content);
      return currentMessages ? `${currentMessages}\n${nextMessage}` : nextMessage;
    });
    setStatusDetail('Received a new message from the websocket.');
  });

  useEffect(() => {
    let isMounted = true;

    void clipboardApi
      .getRelayStatus()
      .then((status) => {
        if (!isMounted) {
          return;
        }

        syncRelayStatus(status);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setStatusDetail('Unable to load relay status.');
      });

    const unsubscribeClipboard = clipboardApi.onClipboardUpdated((content) => {
      appendReceivedMessage(content);
    });
    const unsubscribeRelayStatus = clipboardApi.onRelayStatus((status) => {
      syncRelayStatus(status);
    });

    return () => {
      isMounted = false;
      unsubscribeClipboard();
      unsubscribeRelayStatus();
    };
  }, []);

  const handleConnectionToggle = async () => {
    if (relayStatus.connectionState !== 'disconnected') {
      setIsTogglingConnection(true);

      try {
        const nextStatus = await clipboardApi.disconnectRelay();
        syncRelayStatus(nextStatus);
      } catch {
        setStatusDetail('Unable to disconnect from relay.');
      } finally {
        setIsTogglingConnection(false);
      }

      return;
    }

    const nextUrl = connectionUrl.trim();

    if (!nextUrl) {
      setStatusDetail('Enter a connection URL before connecting.');
      return;
    }

    setIsTogglingConnection(true);

    try {
      const nextStatus = await clipboardApi.connectRelay(nextUrl);
      syncRelayStatus(nextStatus);
    } catch {
      setStatusDetail('Unable to connect to relay.');
    } finally {
      setIsTogglingConnection(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageToSend.trim()) {
      setStatusDetail('Type a message before sending.');
      return;
    }

    setIsSending(true);

    try {
      const result = await clipboardApi.sendMessage(messageToSend);

      if (!result.ok) {
        setStatusDetail('Message was not sent. Make sure the relay is connected.');
        return;
      }

      setMessageToSend('');
      setStatusDetail('Message sent to relay.');
    } catch {
      setStatusDetail('Unable to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const statusLabel =
    relayStatus.connectionState === 'connected'
      ? 'Connected'
      : relayStatus.connectionState === 'connecting'
        ? 'Connecting'
        : relayStatus.connectionState === 'reconnecting'
          ? 'Reconnecting'
          : 'Disconnected';

  const isConnectionActive = relayStatus.connectionState !== 'disconnected';

  return {
    connectionUrl,
    messageToSend,
    receivedMessages,
    relayStatus,
    statusDetail,
    statusLabel,
    isBusy: isTogglingConnection,
    isConnectionActive,
    isSending,
    setConnectionUrl,
    setMessageToSend,
    handleConnectionToggle,
    handleSendMessage,
  };
}

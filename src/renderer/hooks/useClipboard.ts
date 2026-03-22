import { useEffect, useEffectEvent, useState } from 'react';
import { clipboardApi, type RelayStatus } from '../lib/electron-api';

const initialRelayStatus: RelayStatus = {
  clientId: '',
  clientName: '',
  isConnected: false,
  relayUrl: null,
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

export function useClipboard() {
  const [connectionUrl, setConnectionUrl] = useState('');
  const [messageToSend, setMessageToSend] = useState('');
  const [receivedMessages, setReceivedMessages] = useState('');
  const [relayStatus, setRelayStatus] = useState(initialRelayStatus);
  const [statusDetail, setStatusDetail] = useState('Enter a websocket URL and connect.');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const syncRelayStatus = useEffectEvent((status: RelayStatus) => {
    setRelayStatus(status);
    setConnectionUrl((currentUrl) => currentUrl || sanitizeRelayUrl(status.relayUrl));
    setStatusDetail(
      status.isConnected
        ? `Connected as ${status.clientName || status.clientId}.`
        : 'Disconnected from relay.',
    );
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
    if (relayStatus.isConnected) {
      setIsDisconnecting(true);

      try {
        const nextStatus = await clipboardApi.disconnectRelay();
        setRelayStatus(nextStatus);
        setStatusDetail('Disconnected from relay.');
      } catch {
        setStatusDetail('Unable to disconnect from relay.');
      } finally {
        setIsDisconnecting(false);
      }

      return;
    }

    const nextUrl = connectionUrl.trim();

    if (!nextUrl) {
      setStatusDetail('Enter a connection URL before connecting.');
      return;
    }

    setIsConnecting(true);

    try {
      const nextStatus = await clipboardApi.connectRelay(nextUrl);
      setRelayStatus(nextStatus);
      setStatusDetail('Connection request sent to relay.');
    } catch {
      setStatusDetail('Unable to connect to relay.');
    } finally {
      setIsConnecting(false);
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

  const statusLabel = isConnecting
    ? 'Connecting'
    : isDisconnecting
      ? 'Disconnecting'
      : relayStatus.isConnected
        ? 'Connected'
        : 'Disconnected';

  return {
    connectionUrl,
    messageToSend,
    receivedMessages,
    relayStatus,
    statusDetail,
    statusLabel,
    isBusy: isConnecting || isDisconnecting,
    isSending,
    setConnectionUrl,
    setMessageToSend,
    handleConnectionToggle,
    handleSendMessage,
  };
}

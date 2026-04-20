import { useEffect, useEffectEvent, useState } from 'react';
import { clipboardApi, type RelayStatus } from '../lib/electron-api';
import {
  buildLogEntry,
  buildStatusDetail,
  getStatusLabel,
  initialRelayStatus,
  isConnectionActive,
  sanitizeRelayUrl,
} from '../lib/relayStatus';

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

    void loadInitialRelayStatus(isMounted, syncRelayStatus, setStatusDetail);

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

  return {
    connectionUrl,
    messageToSend,
    receivedMessages,
    relayStatus,
    statusDetail,
    statusLabel: getStatusLabel(relayStatus),
    isBusy: isTogglingConnection,
    isConnectionActive: isConnectionActive(relayStatus),
    isSending,
    setConnectionUrl,
    setMessageToSend,
    handleConnectionToggle,
    handleSendMessage,
  };
}

async function loadInitialRelayStatus(
  isMounted: boolean,
  syncRelayStatus: (status: RelayStatus) => void,
  setStatusDetail: (detail: string) => void,
) {
  try {
    const status = await clipboardApi.getRelayStatus();

    if (!isMounted) {
      return;
    }

    syncRelayStatus(status);
  } catch {
    if (!isMounted) {
      return;
    }

    setStatusDetail('Unable to load relay status.');
  }
}

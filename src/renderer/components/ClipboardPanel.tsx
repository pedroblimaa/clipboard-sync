import './ClipboardPanel.css';
import { useClipboard } from '../hooks/useClipboard';

export function ClipboardPanel() {
  const {
    connectionUrl,
    messageToSend,
    receivedMessages,
    relayStatus,
    statusDetail,
    statusLabel,
    isBusy,
    isConnectionActive,
    isSending,
    setConnectionUrl,
    setMessageToSend,
    handleConnectionToggle,
    handleSendMessage,
  } = useClipboard();

  return (
    <section className="panel">
      <p className="eyebrow">Clipboard Sync</p>
      <h1>Relay messages between devices.</h1>
      <p className="lede">
        Connect to the websocket relay, send a message, and watch incoming
        messages appear live below.
      </p>

      <div className="status-card">
        <div>
          <p
            className={`status-pill ${
              relayStatus.isConnected ? 'status-pill-connected' : 'status-pill-disconnected'
            }`}
          >
            {statusLabel}
          </p>
          <p className="status-copy">{statusDetail}</p>
        </div>
        <div className="client-meta">
          <span>{relayStatus.clientName || 'Unknown client'}</span>
          <span>{relayStatus.clientId || 'Client ID unavailable'}</span>
        </div>
      </div>

      <label className="field" htmlFor="connection-url">
        Connection URL
      </label>
      <div className="input-row">
        <input
          id="connection-url"
          type="url"
          value={connectionUrl}
          onChange={(event) => setConnectionUrl(event.target.value)}
          placeholder="ws://localhost:8080"
          autoComplete="off"
          spellCheck={false}
          disabled={isBusy || isConnectionActive}
        />
        <button type="button" onClick={handleConnectionToggle} disabled={isBusy}>
          {isBusy
            ? 'Working...'
            : isConnectionActive
              ? 'Disconnect'
              : 'Connect'}
        </button>
      </div>

      <label className="field" htmlFor="message-to-send">
        Message to send
      </label>
      <textarea
        id="message-to-send"
        value={messageToSend}
        onChange={(event) => setMessageToSend(event.target.value)}
        placeholder="Type the message you want to send..."
        rows={5}
      />

      <div className="actions">
        <button
          type="button"
          onClick={handleSendMessage}
          disabled={isSending || !relayStatus.isConnected}
        >
          {isSending ? 'Sending...' : 'Send message'}
        </button>
      </div>

      <label className="field" htmlFor="received-messages">
        Received messages
      </label>
      <textarea
        id="received-messages"
        value={receivedMessages}
        placeholder="Incoming websocket messages will appear here..."
        rows={8}
        readOnly
      />
    </section>
  );
}

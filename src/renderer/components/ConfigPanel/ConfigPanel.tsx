import type { ChangeEvent } from 'react'
import { ArrowLeft, Link2 } from 'lucide-react'
import type { RelayConnectionState } from '../../../shared/relay'
import './ConfigPanel.css'

interface ConfigPanelProps {
  connectionUrl: string
  connectionState: RelayConnectionState
  statusDetail: string
  statusLabel: string
  isBusy: boolean
  isConnectionActive: boolean
  onConnectionUrlChange: (value: string) => void
  onConnectionToggle: () => void
  onBack: () => void
}

export function ConfigPanel({
  connectionUrl,
  connectionState,
  statusDetail,
  statusLabel,
  isBusy,
  isConnectionActive,
  onConnectionUrlChange,
  onConnectionToggle,
  onBack,
}: ConfigPanelProps) {
  const statusClassName = `status-pill-${connectionState}`
  const connectionButtonLabel = getConnectionButtonLabel(isBusy, isConnectionActive)
  const handleConnectionUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    onConnectionUrlChange(event.target.value)
  }

  return (
    <section id='config-panel'>
      <div className='panel-header'>
        <button className='icon-button' type='button' onClick={onBack} aria-label='Back to clipboard history'>
          <ArrowLeft size={18} aria-hidden='true' />
        </button>
        <div className='panel-header-copy'>
          <span className='panel-eyebrow'>Configuration</span>
          <h1>Pair with your relay</h1>
        </div>
      </div>

      <div className='config-card'>
        <div className='config-card-icon'>
          <Link2 size={20} aria-hidden='true' />
        </div>
        <div className='config-card-copy'>
          <h2>Relay URL</h2>
          <p>Paste the websocket address from your backend app to connect this desktop client.</p>
        </div>
      </div>

      <label className='config-field'>
        <span>Pair link</span>
        <input
          type='url'
          placeholder='ws://localhost:8080/ws'
          value={connectionUrl}
          onChange={handleConnectionUrlChange}
          spellCheck='false'
          autoComplete='off'
        />
      </label>

      <div className='config-status'>
        <span className={`status-pill ${statusClassName}`}>{statusLabel}</span>
        <p>{statusDetail}</p>
      </div>

      <button className='connect-button' type='button' onClick={onConnectionToggle} disabled={isBusy}>
        {connectionButtonLabel}
      </button>
    </section>
  )
}

function getConnectionButtonLabel(isBusy: boolean, isConnectionActive: boolean) {
  if (isBusy) {
    return isConnectionActive ? 'Disconnecting...' : 'Connecting...'
  }

  return isConnectionActive ? 'Disconnect' : 'Connect'
}

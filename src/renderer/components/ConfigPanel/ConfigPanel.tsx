import type { ChangeEvent } from 'react'
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
}: ConfigPanelProps) {
  const statusClassName = `status-pill-${connectionState}`
  const connectionButtonLabel = getConnectionButtonLabel(isBusy, isConnectionActive)
  const handleConnectionUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    onConnectionUrlChange(event.target.value)
  }

  return (
    <section id='config-panel'>
      <label className='config-field'>
        <span>URL</span>
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
        <span className='status-detail'>{statusDetail}</span>
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

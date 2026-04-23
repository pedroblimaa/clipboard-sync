import type { ChangeEvent } from 'react'
import { ArrowRight, Link2, Wifi } from 'lucide-react'
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
  const buttonClassName = isConnectionActive
    ? 'connect-button config-connect-button config-connect-button-disconnect'
    : 'connect-button config-connect-button'
  const handleConnectionUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    onConnectionUrlChange(event.target.value)
  }

  return (
    <section id='config-panel'>
      <div className='config-header'>
        <div className='config-title'>
          <Wifi size={18} strokeWidth={2.3} aria-hidden='true' />
          <span>Connection Setup</span>
        </div>

        <div className={`config-status ${statusClassName}`}>
          <span className='status-dot' aria-hidden='true' />
          <span>{statusLabel}</span>
        </div>
      </div>

      <label className='config-field'>
        <span>Relay URL</span>
        <div className='relay-input'>
          <Link2 size={18} strokeWidth={2.3} aria-hidden='true' />
          <input
            type='url'
            placeholder='ws://localhost:8080/ws'
            value={connectionUrl}
            onChange={handleConnectionUrlChange}
            spellCheck='false'
            autoComplete='off'
          />
        </div>
      </label>

      <span className='status-detail'>{statusDetail}</span>

      <button className={buttonClassName} type='button' onClick={onConnectionToggle} disabled={isBusy}>
        <span>{connectionButtonLabel}</span>
        <ArrowRight className='button-arrow' size={17} strokeWidth={2.4} aria-hidden='true' />
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

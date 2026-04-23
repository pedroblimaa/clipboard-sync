import { RefreshCw } from 'lucide-react'
import type { RelayConnectionState } from '../../../shared/relay'
import './Footer.css'

interface FooterProps {
  clipboardCount: number
  statusLabel: string
  connectionState: RelayConnectionState
}

export function Footer({ clipboardCount, statusLabel, connectionState }: FooterProps) {
  const clipboardCountLabel = buildClipboardCountLabel(clipboardCount)
  const statusClassName = `footer-status-${connectionState}`

  return (
    <div id='footer'>
      <div className='left-side'>
        <span className='footer-status'>
          <RefreshCw className='footer-icon' aria-hidden='true' strokeWidth={2.4} />
          <span>{clipboardCountLabel}</span>
        </span>
        <span className={`footer-status ${statusClassName}`}>
          <span className='footer-dot' aria-hidden='true' />
          <span>{statusLabel}</span>
        </span>
      </div>
      <div className='right-side'>
        <span>Clipboard Sync</span>
      </div>
    </div>
  )
}

function buildClipboardCountLabel(clipboardCount: number) {
  return `${clipboardCount} item${clipboardCount === 1 ? '' : 's'}`
}

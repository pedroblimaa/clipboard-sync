import { RefreshCw } from 'lucide-react'
import './Footer.css'

export function Footer() {
  return (
    <div id='footer'>
      <div className='left-side'>
        <span className='footer-status'>
          <RefreshCw className='footer-icon' aria-hidden='true' strokeWidth={2.4} />
          <span>1,200 items</span>
        </span>
        <span className='footer-status footer-status-connected'>
          <span className='footer-dot' aria-hidden='true' />
          <span>Connected</span>
        </span>
      </div>
      <div className='right-side'>
        <span>Clipboard Sync</span>
      </div>
    </div>
  )
}

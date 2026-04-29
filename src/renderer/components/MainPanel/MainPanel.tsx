import './MainPanel.css'
import type { ClipboardSyncItem } from '../../lib/electron-api'

interface MainPanelProps {
  clipboardItems: ClipboardSyncItem[]
}

export function MainPanel({ clipboardItems }: MainPanelProps) {
  return (
    <section id='main-panel'>
      {clipboardItems.length > 0 ? (
        <ClipboardItems items={clipboardItems} />
      ) : (
        <div className='clipboard-empty'>Copied text sent through the relay will appear here.</div>
      )}
    </section>
  )
}

function ClipboardItems({ items }: { items: ClipboardSyncItem[] }) {
  return (
    <ul className='clipboard-items'>
      {items.map(item => (
        <li key={item.id} className='clipboard-item'>
          <span className='text'>{item.content}</span>
          <span className='device'>{buildDeviceLabel(item)}</span>
        </li>
      ))}
    </ul>
  )
}

function buildDeviceLabel(item: ClipboardSyncItem) {
  return item.source === 'local' ? `${item.deviceName} (this device)` : item.deviceName
}

import './MainPanel.css'
import { Settings2 } from 'lucide-react'

interface MainPanelProps {
  clipboardItems: string[]
  statusDetail: string
  onOpenConfig: () => void
}

export function MainPanel({ clipboardItems, statusDetail, onOpenConfig }: MainPanelProps) {
  const hasClipboardItems = clipboardItems.length > 0

  return (
    <section id='main-panel'>
      <div className='panel-header'>
        <div className='panel-header-copy'>
          <span className='panel-eyebrow'>Clipboard</span>
          <h1>Synced items</h1>
          <p>{statusDetail}</p>
        </div>
        <button className='icon-button' type='button' onClick={onOpenConfig} aria-label='Open configuration'>
          <Settings2 size={18} aria-hidden='true' />
        </button>
      </div>

      {hasClipboardItems ? <ClipboardItems items={clipboardItems} /> : <EmptyState />}
    </section>
  )
}

function ClipboardItems({ items }: { items: string[] }) {
  return (
    <ul className='clipboard-items'>
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className='clipboard-item'>
          <span className='text'>{item}</span>
          <span className='device'>Synced clipboard</span>
        </li>
      ))}
    </ul>
  )
}

function EmptyState() {
  return (
    <div className='empty-state'>
      <h2>No synced items yet</h2>
      <p>Connect to your relay from the configuration page, then copied text will start showing up here.</p>
    </div>
  )
}

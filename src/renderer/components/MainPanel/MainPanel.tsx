import './MainPanel.css'

interface MainPanelProps {
  clipboardItems: string[]
}

interface ClipboardItem {
  text: string
  device: string
}

const placeholderItems: ClipboardItem[] = [
  {
    text: 'This is a random test just to create the design',
    device: "Drope's PC",
  },
  {
    text: 'Another random test, this is just to test a second item',
    device: "Drope's Laptop",
  },
  {
    text: 'And other random test, this is just to test a third item',
    device: "Camila's MacBook",
  },
]

export function MainPanel({ clipboardItems }: MainPanelProps) {
  const items = clipboardItems.length > 0 ? toClipboardItems(clipboardItems) : placeholderItems

  return (
    <section id='main-panel'>
      <ClipboardItems items={items} />
    </section>
  )
}

function ClipboardItems({ items }: { items: ClipboardItem[] }) {
  return (
    <ul className='clipboard-items'>
      {items.map((item, index) => (
        <li key={`${item.text}-${index}`} className='clipboard-item'>
          <span className='text'>{item.text}</span>
          <span className='device'>{item.device}</span>
        </li>
      ))}
    </ul>
  )
}

function toClipboardItems(items: string[]): ClipboardItem[] {
  return items.map(text => ({
    text,
    device: 'Synced clipboard',
  }))
}

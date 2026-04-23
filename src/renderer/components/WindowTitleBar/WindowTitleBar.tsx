import { ArrowLeft, Minus, Settings2, Square, X } from 'lucide-react'
import './WindowTitleBar.css'

type ActiveView = 'clipboard' | 'configuration'

interface WindowTitleBarProps {
  activeView: ActiveView
  onBack: () => void
  onOpenConfig: () => void
}

export function WindowTitleBar({ activeView, onBack, onOpenConfig }: WindowTitleBarProps) {
  const isConfigurationView = activeView === 'configuration'
  const navigationLabel = isConfigurationView ? 'Back to clipboard history' : 'Open configuration'

  return (
    <header className='window-titlebar'>
      <div className='window-titlebar-navigation'>
        <button
          className='window-control window-navigation-button'
          type='button'
          onClick={isConfigurationView ? onBack : onOpenConfig}
          aria-label={navigationLabel}
        >
          <WindowNavigationIcon isConfigurationView={isConfigurationView} />
        </button>
      </div>

      <div className='window-titlebar-drag-region' />

      <div className='window-titlebar-controls'>
        <button
          className='window-control'
          type='button'
          onClick={() => void window.electronAPI.minimizeWindow()}
          aria-label='Minimize window'
        >
          <Minus size={15} strokeWidth={2.2} aria-hidden='true' />
        </button>
        <button
          className='window-control'
          type='button'
          onClick={() => void window.electronAPI.toggleMaximizeWindow()}
          aria-label='Maximize or restore window'
        >
          <Square size={13} strokeWidth={2.1} aria-hidden='true' />
        </button>
        <button
          className='window-control window-control-close'
          type='button'
          onClick={() => void window.electronAPI.closeWindow()}
          aria-label='Close window'
        >
          <X size={16} strokeWidth={2.2} aria-hidden='true' />
        </button>
      </div>
    </header>
  )
}

function WindowNavigationIcon({ isConfigurationView }: { isConfigurationView: boolean }) {
  const Icon = isConfigurationView ? ArrowLeft : Settings2

  return <Icon size={16} strokeWidth={2.2} aria-hidden='true' />
}

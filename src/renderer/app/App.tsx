import { useState } from 'react'
import './App.css'
import { MainPanel } from '../components/MainPanel/MainPanel'
import { ConfigPanel } from '../components/ConfigPanel/ConfigPanel'
import { Footer } from '../components/Footer/Footer'
import { WindowTitleBar } from '../components/WindowTitleBar/WindowTitleBar'
import { useClipboard } from '../hooks/useClipboard'

type ActiveView = 'clipboard' | 'configuration'
type ScreenDirection = 'forward' | 'back'

export function App() {
  const [activeView, setActiveView] = useState<ActiveView>('clipboard')
  const [screenDirection, setScreenDirection] = useState<ScreenDirection>('forward')
  const {
    connectionUrl,
    receivedMessages,
    relayStatus,
    statusDetail,
    statusLabel,
    isBusy,
    isConnectionActive,
    setConnectionUrl,
    handleConnectionToggle,
  } = useClipboard()

  const clipboardItems = toClipboardItems(receivedMessages)
  const connectionState = relayStatus.connectionState
  const isClipboardView = activeView === 'clipboard'
  const screenClassName = `app-screen app-screen-${screenDirection}`

  const showClipboard = () => {
    setScreenDirection('back')
    setActiveView('clipboard')
  }

  const showConfiguration = () => {
    setScreenDirection('forward')
    setActiveView('configuration')
  }

  return (
    <main className='app-shell'>
      <WindowTitleBar
        activeView={activeView}
        onBack={showClipboard}
        onOpenConfig={showConfiguration}
      />

      <div key={activeView} className={screenClassName}>
        {isClipboardView ? (
          <MainPanel clipboardItems={clipboardItems} />
        ) : (
          <ConfigPanel
            connectionUrl={connectionUrl}
            connectionState={connectionState}
            statusDetail={statusDetail}
            statusLabel={statusLabel}
            isBusy={isBusy}
            isConnectionActive={isConnectionActive}
            onConnectionUrlChange={setConnectionUrl}
            onConnectionToggle={handleConnectionToggle}
          />
        )}
      </div>
      <Footer
        clipboardCount={clipboardItems.length}
        statusLabel={statusLabel}
        connectionState={connectionState}
      />
    </main>
  )
}

function toClipboardItems(receivedMessages: string) {
  if (!receivedMessages) {
    return []
  }

  return receivedMessages
    .split('\n')
    .map(message => message.trim())
    .filter(Boolean)
    .reverse()
}

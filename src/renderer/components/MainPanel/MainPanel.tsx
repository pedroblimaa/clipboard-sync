import './MainPanel.css'
import { useClipboard } from '../../hooks/useClipboard'

export function MainPanel() {
  const {
    connectionUrl,
    messageToSend,
    receivedMessages,
    relayStatus,
    statusDetail,
    statusLabel,
    isBusy,
    isConnectionActive,
    isSending,
    setConnectionUrl,
    setMessageToSend,
    handleConnectionToggle,
    handleSendMessage,
  } = useClipboard()

  return (
    <div id='main-panel'>
      <ul className='clipboard-items'>
        <li>
          <span className='text'>This is a random test just to create the design</span>
          <span className='device'>Drope's PC</span>
        </li>
        <li>
          <span className='text'>Another random test, this is just to test a second item</span>
          <span className='device'>Drope's Laptop</span>
        </li>
        <li>
          <span className='text'>And other random test, this is just to test a third item</span>
          <span className='device'>Camila's MacBook</span>
        </li>
      </ul>
    </div>
  )
}

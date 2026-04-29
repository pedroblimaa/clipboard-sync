import { useEffect, useEffectEvent, useState } from 'react'
import { clipboardApi, type ClipboardSyncItem, type RelayStatus } from '../lib/electron-api'
import {
  buildStatusDetail,
  getStatusLabel,
  initialRelayStatus,
  isConnectionActive,
  sanitizeRelayUrl,
} from '../lib/relayStatus'

export function useClipboard() {
  const [connectionUrl, setConnectionUrl] = useState('')
  const [messageToSend, setMessageToSend] = useState('')
  const [clipboardItems, setClipboardItems] = useState<ClipboardSyncItem[]>([])
  const [relayStatus, setRelayStatus] = useState(initialRelayStatus)
  const [statusDetail, setStatusDetail] = useState('Enter a websocket URL and connect.')
  const [isTogglingConnection, setIsTogglingConnection] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const syncRelayStatus = useEffectEvent((status: RelayStatus) => {
    setRelayStatus(status)
    setConnectionUrl(currentUrl => currentUrl || sanitizeRelayUrl(status.relayUrl))
    setStatusDetail(buildStatusDetail(status))
  })

  const appendClipboardItem = useEffectEvent((item: ClipboardSyncItem) => {
    setClipboardItems(currentItems => [item, ...currentItems])
    setStatusDetail(
      item.source === 'local'
        ? 'Sent copied text to the relay.'
        : 'Received copied text from the relay.',
    )
  })

  useEffect(() => {
    let isActive = true

    void loadInitialRelayStatus(() => isActive, syncRelayStatus, setStatusDetail)

    const unsubscribeClipboard = clipboardApi.onClipboardUpdated(item => {
      appendClipboardItem(item)
    })
    const unsubscribeRelayStatus = clipboardApi.onRelayStatus(status => {
      syncRelayStatus(status)
    })

    return () => {
      isActive = false
      unsubscribeClipboard()
      unsubscribeRelayStatus()
    }
  }, [])

  const handleConnectionToggle = () =>
    toggleRelayConnection(connectionUrl, relayStatus, setIsTogglingConnection, setStatusDetail, syncRelayStatus)

  const handleSendMessage = () =>
    sendMessage(messageToSend, setIsSending, setMessageToSend, setStatusDetail)

  return {
    connectionUrl,
    messageToSend,
    clipboardItems,
    relayStatus,
    statusDetail,
    statusLabel: getStatusLabel(relayStatus),
    isBusy: isTogglingConnection,
    isConnectionActive: isConnectionActive(relayStatus),
    isSending,
    setConnectionUrl,
    setMessageToSend,
    handleConnectionToggle,
    handleSendMessage,
  }
}

async function loadInitialRelayStatus(
  isActive: () => boolean,
  syncRelayStatus: (status: RelayStatus) => void,
  setStatusDetail: (detail: string) => void,
) {
  try {
    const status = await clipboardApi.getRelayStatus()

    runIfActive(isActive, () => {
      syncRelayStatus(status)
    })
  } catch {
    runIfActive(isActive, () => {
      setStatusDetail('Unable to load relay status.')
    })
  }
}

async function toggleRelayConnection(
  connectionUrl: string,
  relayStatus: RelayStatus,
  setIsTogglingConnection: (isTogglingConnection: boolean) => void,
  setStatusDetail: (detail: string) => void,
  syncRelayStatus: (status: RelayStatus) => void,
) {
  if (relayStatus.connectionState !== 'disconnected') {
    await disconnectRelay(setIsTogglingConnection, setStatusDetail, syncRelayStatus)
    return
  }

  await connectRelay(connectionUrl, setIsTogglingConnection, setStatusDetail, syncRelayStatus)
}

async function disconnectRelay(
  setIsTogglingConnection: (isTogglingConnection: boolean) => void,
  setStatusDetail: (detail: string) => void,
  syncRelayStatus: (status: RelayStatus) => void,
) {
  setIsTogglingConnection(true)

  try {
    const nextStatus = await clipboardApi.disconnectRelay()
    syncRelayStatus(nextStatus)
  } catch {
    setStatusDetail('Unable to disconnect from relay.')
  } finally {
    setIsTogglingConnection(false)
  }
}

async function connectRelay(
  connectionUrl: string,
  setIsTogglingConnection: (isTogglingConnection: boolean) => void,
  setStatusDetail: (detail: string) => void,
  syncRelayStatus: (status: RelayStatus) => void,
) {
  const nextUrl = connectionUrl.trim()

  if (!nextUrl) {
    setStatusDetail('Enter a connection URL before connecting.')
    return
  }

  setIsTogglingConnection(true)

  try {
    const nextStatus = await clipboardApi.connectRelay(nextUrl)
    syncRelayStatus(nextStatus)
  } catch {
    setStatusDetail('Unable to connect to relay.')
  } finally {
    setIsTogglingConnection(false)
  }
}

async function sendMessage(
  messageToSend: string,
  setIsSending: (isSending: boolean) => void,
  setMessageToSend: (messageToSend: string) => void,
  setStatusDetail: (detail: string) => void,
) {
  if (!messageToSend.trim()) {
    setStatusDetail('Type a message before sending.')
    return
  }

  setIsSending(true)

  try {
    const result = await clipboardApi.sendMessage(messageToSend)

    if (!result.ok) {
      setStatusDetail('Message was not sent. Make sure the relay is connected.')
      return
    }

    setMessageToSend('')
    setStatusDetail('Message sent to relay.')
  } catch {
    setStatusDetail('Unable to send message.')
  } finally {
    setIsSending(false)
  }
}

function runIfActive(isActive: () => boolean, action: () => void) {
  if (!isActive()) {
    return
  }

  action()
}

const ENABLE_ELECTRON_INFO_LOGS = false

function log(prefix: string, method: 'info' | 'warn' | 'error', args: unknown[]) {
  if (method === 'info' && !ENABLE_ELECTRON_INFO_LOGS) {
    return
  }

  console[method](prefix, ...args)
}

export const relayLogger = {
  info: (...args: unknown[]) => log('[Relay]', 'info', args),
  warn: (...args: unknown[]) => log('[Relay]', 'warn', args),
  error: (...args: unknown[]) => log('[Relay]', 'error', args),
}

export const bridgeLogger = {
  info: (...args: unknown[]) => log('[Bridge]', 'info', args),
  warn: (...args: unknown[]) => log('[Bridge]', 'warn', args),
  error: (...args: unknown[]) => log('[Bridge]', 'error', args),
}

import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { App } from 'electron'
import type { ClientInfo } from './relayService'

const DEVICE_IDENTITY_FILE = 'device-identity.json'

export async function loadDeviceIdentity(app: App): Promise<ClientInfo> {
  const identityPath = path.join(app.getPath('userData'), DEVICE_IDENTITY_FILE)

  try {
    const content = await readFile(identityPath, 'utf8')
    const parsed = JSON.parse(content) as Partial<ClientInfo>

    if (typeof parsed.clientId === 'string' && typeof parsed.clientName === 'string') {
      return {
        clientId: parsed.clientId,
        clientName: parsed.clientName,
      }
    }
  } catch {
    // Fall back to generating a new identity.
  }

  const identity: ClientInfo = {
    clientId: randomUUID(),
    clientName: os.hostname(),
  }

  await mkdir(path.dirname(identityPath), { recursive: true })
  await writeFile(identityPath, JSON.stringify(identity, null, 2), 'utf8')

  return identity
}

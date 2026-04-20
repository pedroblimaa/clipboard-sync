import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { App } from 'electron'
import type { ClientInfo } from '../../shared/relay'

const DEVICE_IDENTITY_FILE = 'device-identity.json'

export async function loadDeviceIdentity(app: App): Promise<ClientInfo> {
  const identityPath = path.join(app.getPath('userData'), DEVICE_IDENTITY_FILE)
  const storedIdentity = await readStoredDeviceIdentity(identityPath)

  if (storedIdentity) {
    return storedIdentity
  }

  const identity = createDeviceIdentity()
  await persistDeviceIdentity(identityPath, identity)
  return identity
}

async function readStoredDeviceIdentity(identityPath: string) {
  try {
    const content = await readFile(identityPath, 'utf8')
    const parsedIdentity = JSON.parse(content) as Partial<ClientInfo>

    return toDeviceIdentity(parsedIdentity)
  } catch {
    return null
  }
}

function toDeviceIdentity(parsedIdentity: Partial<ClientInfo>) {
  if (typeof parsedIdentity.clientId !== 'string' || typeof parsedIdentity.clientName !== 'string') {
    return null
  }

  return {
    clientId: parsedIdentity.clientId,
    clientName: parsedIdentity.clientName,
  }
}

function createDeviceIdentity(): ClientInfo {
  return {
    clientId: randomUUID(),
    clientName: os.hostname(),
  }
}

async function persistDeviceIdentity(identityPath: string, identity: ClientInfo) {
  await mkdir(path.dirname(identityPath), { recursive: true })
  await writeFile(identityPath, JSON.stringify(identity, null, 2), 'utf8')
}

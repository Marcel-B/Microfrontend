import { bffFetch } from './bff'
import type { RemotePage } from './remotes'

/** Role that may open the registry page. The host BFF checks it again for /bff/registry. */
export const adminRole = 'admin'

export type RemoteHealth = 'unknown' | 'healthy' | 'unreachable'

export type RegistryEventKind = 'registered' | 'changed' | 'deregistered' | 'expired' | 'reachable' | 'unreachable' | 'rejected'

export interface RegisteredRemote {
  id: string
  federationName: string
  displayName: Record<string, string>
  version: string | null
  address: string
  entry: string
  uiPath: string
  apiPath: string
  apiScope: string | null
  /** False when the host does not request the API scope at login: the remote's API would reject the user's token. */
  apiScopeRequested: boolean
  healthUrl: string
  health: RemoteHealth
  /** Client id of the service that registered the remote. */
  owner: string
  registeredAt: string
  lastHeartbeatAt: string
  leaseExpiresAt: string
  lastCheckedAt: string | null
  lastHealthyAt: string | null
  consecutiveFailures: number
  lastError: string | null
  pages: RemotePage[]
}

export interface FormerRemote {
  id: string
  federationName: string
  displayName: Record<string, string>
  version: string | null
  address: string
  owner: string
  registeredAt: string
  leftAt: string
  reason: RegistryEventKind
  pages: RemotePage[]
}

export interface RegistryEvent {
  at: string
  remoteId: string
  kind: RegistryEventKind
  owner: string | null
  detail: string | null
}

export interface RegistrySettings {
  audience: string
  leaseSeconds: number
  heartbeatSeconds: number
  healthCheckSeconds: number
  failureThreshold: number
  requestedScopes: string[]
}

/** Response of GET /bff/registry. */
export interface Registry {
  at: string
  settings: RegistrySettings
  remotes: RegisteredRemote[]
  former: FormerRemote[]
  history: RegistryEvent[]
}

export async function loadRegistry(): Promise<Registry> {
  const response = await bffFetch('/bff/registry')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return (await response.json()) as Registry
}

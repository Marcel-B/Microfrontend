import { registerGlobalPlugins, registerPlugins, type ModuleFederationRuntimePlugin } from '@module-federation/runtime'

/**
 * Local overrides: a developer loads a remote running on their own machine into a stage's shell, as single-spa's
 * import-map-overrides does. They live in this browser's localStorage, so nobody else on the stage is affected, and only
 * apply where the host BFF allows them (DevOverrides:Enabled, sent with /bff/remotes). Only loopback addresses are
 * accepted, so a pasted snippet cannot make the shell load code from somewhere else.
 *
 * - UI: a Module Federation runtime plugin replaces the remote's entry in beforeRegisterRemote. It is registered for the
 *   shell's instance and globally, so remotes that a remote loads itself are covered too.
 * - API: fetch calls to /api/{id}/ go to the remote BFF on the developer's machine instead, with the session's access
 *   token from /bff/dev/token as bearer (that BFF never sees the stage's cookie). Only fetch is redirected, not
 *   XMLHttpRequest.
 */

/** One remote replaced in this browser. */
export interface RemoteOverride {
  /** Module Federation name of the remote, e.g. "vueDemo". */
  name: string
  /** remoteEntry.js on the developer's machine, e.g. "http://localhost:5174/remotes/vue-demo/remoteEntry.js". */
  entry?: string
  /** Remote BFF on the developer's machine, e.g. "http://localhost:5011": /api/{id}/me goes to {api}/api/me. */
  api?: string
}

/** Overrides by remote id (the {id} of /remotes/{id}/ and /api/{id}/). */
export type RemoteOverrides = Record<string, RemoteOverride>

export const storageKey = 'mfe.remoteOverrides'

const loopbackHosts = ['localhost', '127.0.0.1', '[::1]']

/** http(s) on this machine only. */
export function isLoopbackUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && loopbackHosts.includes(url.hostname)
  } catch {
    return false
  }
}

/**
 * The remote's entry on the developer's machine. Only an origin ("http://localhost:5174") takes the path of the
 * deployed entry, since the local dev server serves the remote under the same base path.
 */
export function entryUrl(input: string, deployedEntry: string): string {
  const url = new URL(input.trim())
  return url.pathname === '/' && !url.search ? new URL(new URL(deployedEntry, window.location.origin).pathname, url.origin).href : url.href
}

/** The overrides stored in this browser, without anything that is not a loopback URL. */
export function readOverrides(): RemoteOverrides {
  let stored: unknown
  try {
    stored = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
  } catch {
    return {}
  }
  if (!stored || typeof stored !== 'object') return {}

  const overrides: RemoteOverrides = {}
  for (const [id, value] of Object.entries(stored as Record<string, Partial<RemoteOverride>>)) {
    if (!value || typeof value.name !== 'string' || !value.name) continue
    const entry = typeof value.entry === 'string' && isLoopbackUrl(value.entry) ? value.entry : undefined
    const api = typeof value.api === 'string' && isLoopbackUrl(value.api) ? value.api : undefined
    if (entry || api) overrides[id] = { name: value.name, entry, api }
  }
  return overrides
}

export function saveOverrides(overrides: RemoteOverrides): void {
  const kept = Object.fromEntries(Object.entries(overrides).filter(([, o]) => o.entry || o.api))
  if (Object.keys(kept).length) localStorage.setItem(storageKey, JSON.stringify(kept))
  else localStorage.removeItem(storageKey)
}

export function clearOverrides(): void {
  localStorage.removeItem(storageKey)
}

/** Where a same-origin request to /api/{id}/… goes instead, or null when no override covers it. */
export function apiTarget(url: URL, overrides: RemoteOverrides): URL | null {
  if (url.origin !== window.location.origin) return null
  for (const [id, override] of Object.entries(overrides)) {
    const prefix = `/api/${id}/`
    if (!override.api || !url.pathname.startsWith(prefix)) continue
    const base = override.api.endsWith('/') ? override.api : `${override.api}/`
    return new URL(`api/${url.pathname.slice(prefix.length)}${url.search}`, base)
  }
  return null
}

function overridePlugin(overrides: RemoteOverrides): ModuleFederationRuntimePlugin {
  const entries = new Map(
    Object.values(overrides)
      .filter((override) => override.entry)
      .map((override) => [override.name, override.entry!]),
  )
  return {
    name: 'mfe-dev-overrides',
    beforeRegisterRemote(args) {
      const entry = entries.get(args.remote.name)
      if (entry && 'entry' in args.remote) args.remote.entry = entry
      return args
    },
  }
}

const nativeFetch = window.fetch.bind(window)
let cachedToken: { value: string; expiresAt: number } | null = null

/** The session's access token for the developer's own remote BFF, or null when not logged in. */
async function devToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt - 30_000 > Date.now()) return cachedToken.value
  const response = await nativeFetch('/bff/dev/token', { headers: { 'X-CSRF': '1' }, credentials: 'same-origin' })
  if (!response.ok) {
    cachedToken = null
    return null
  }
  const token = (await response.json()) as { accessToken: string; expiresAt: string | null }
  cachedToken = { value: token.accessToken, expiresAt: token.expiresAt ? Date.parse(token.expiresAt) : Date.now() + 60_000 }
  return cachedToken.value
}

function redirectApiCalls(overrides: RemoteOverrides): void {
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(input instanceof Request ? input.url : String(input), window.location.href)
    const target = apiTarget(url, overrides)
    if (!target) return nativeFetch(input, init)

    const request = new Request(input, init)
    const headers = new Headers(request.headers)
    const token = await devToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
    return nativeFetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      // Cross-origin to the developer's machine: the token replaces the cookie, which belongs to the stage.
      mode: 'cors',
      credentials: 'omit',
      cache: request.cache,
      redirect: request.redirect,
      signal: request.signal,
    })
  }
}

let active: RemoteOverrides | null = null

/**
 * Applies the stored overrides, once per page load: call it before the first registerRemotes(). Changes take effect
 * with the next reload, since loaded remotes stay in memory. Returns what is active.
 */
export function activateOverrides(): RemoteOverrides {
  if (active) return active
  active = readOverrides()
  if (Object.values(active).some((override) => override.entry)) {
    const plugin = overridePlugin(active)
    registerGlobalPlugins([plugin])
    registerPlugins([plugin])
  }
  if (Object.values(active).some((override) => override.api)) redirectApiCalls(active)
  if (Object.keys(active).length) console.warn('[mfe] Local remote overrides active in this browser:', active)
  return active
}

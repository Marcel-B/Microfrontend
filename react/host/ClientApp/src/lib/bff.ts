/** fetch() against the BFF. Sends the anti-CSRF header the BFF requires for /bff/user and /api. */
export async function bffFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('X-CSRF', '1')
  return fetch(input, { ...init, headers, credentials: 'same-origin' })
}

export interface BffClaim {
  type: string
  value: string
}

export interface BffUser {
  isAuthenticated: boolean
  name: string | null
  roles: string[]
  claims: BffClaim[]
  logoutUrl: string | null
  sessionExpiresAt: string | null
}

export const anonymousUser: BffUser = {
  isAuthenticated: false,
  name: null,
  roles: [],
  claims: [],
  logoutUrl: null,
  sessionExpiresAt: null,
}

/** URL that starts the OIDC login and returns to the given path of this app afterwards. */
export function loginUrl(appPath: string): string {
  return `/bff/login?returnUrl=${encodeURIComponent(joinBase(appPath))}`
}

export function joinBase(appPath: string): string {
  return import.meta.env.BASE_URL.replace(/\/$/, '') + (appPath.startsWith('/') ? appPath : `/${appPath}`)
}

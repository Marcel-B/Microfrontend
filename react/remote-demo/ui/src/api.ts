/**
 * Calls the API of this remote's own BFF. The browser talks to the host BFF only: it forwards /api/react-demo/**
 * to react-demo-bff and adds the user's access token. The X-CSRF header is required by the host BFF.
 */
const apiBase = '/api/react-demo'

export interface ApiResult<T> {
  status: number
  data: T | null
}

export async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  try {
    const response = await fetch(apiBase + path, { headers: { 'X-CSRF': '1' }, credentials: 'same-origin' })
    return { status: response.status, data: response.ok ? ((await response.json()) as T) : null }
  } catch {
    return { status: 0, data: null }
  }
}

export interface Me {
  name: string | null
  roles: string[]
  isAdmin: boolean
  checkedBy: string
}

export interface AdminStatus {
  serverTime: string
  checkedBy: string
}

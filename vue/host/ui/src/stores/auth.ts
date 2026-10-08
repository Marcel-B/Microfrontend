import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { bffFetch, joinBase, loginUrl, type BffUser } from '../lib/bff'

const anonymous: BffUser = {
  isAuthenticated: false,
  name: null,
  roles: [],
  claims: [],
  logoutUrl: null,
  sessionExpiresAt: null,
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<BffUser>(anonymous)
  const loaded = ref(false)
  let pending: Promise<void> | null = null

  const isAuthenticated = computed(() => user.value.isAuthenticated)

  /** Loads the session once; later calls reuse the result. */
  function ensureLoaded(): Promise<void> {
    pending ??= reload()
    return pending
  }

  async function reload(): Promise<void> {
    try {
      const response = await bffFetch('/bff/user')
      user.value = response.ok ? ((await response.json()) as BffUser) : anonymous
    } catch {
      user.value = anonymous
    } finally {
      loaded.value = true
    }
  }

  function hasAnyRole(roles: string[] | undefined): boolean {
    return !roles?.length || roles.some((role) => user.value.roles.includes(role))
  }

  function login(appPath = '/'): void {
    window.location.assign(loginUrl(appPath))
  }

  function logout(): void {
    if (!user.value.logoutUrl) return
    window.location.assign(`${user.value.logoutUrl}&returnUrl=${encodeURIComponent(joinBase('/'))}`)
  }

  return { user, loaded, isAuthenticated, ensureLoaded, reload, hasAnyRole, login, logout }
})

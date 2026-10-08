import { loadRemote, registerRemotes } from '@module-federation/runtime'
import type { Component, InjectionKey } from 'vue'

export interface RemotePage {
  path: string
  /** Title per language, e.g. { de: 'Klick-Demo', en: 'Click demo' }. */
  title: Record<string, string>
  module: string
  icon?: string | null
  requiresAuth: boolean
  roles: string[]
  showInNav: boolean
  /** Position in the navigation; lower comes first. */
  order: number
}

export interface RemoteDefinition {
  /** Path segment of /remotes/{id}/ and /api/{id}/. */
  id: string
  /** Module Federation name. */
  name: string
  entry: string
  version?: string | null
  pages: RemotePage[]
}

export interface FrontendConfig {
  /** The remotes the host BFF currently reaches. Remotes register themselves there and leave when unreachable. */
  remotes: RemoteDefinition[]
  /** Set when the BFF could not be reached; the shell keeps the remotes it had. */
  error?: string
}

export const frontendKey: InjectionKey<FrontendConfig> = Symbol('frontend')

/** How often the shell asks the host BFF which remotes are reachable. */
export const refreshInterval = 10_000

const registered = new Set<string>()

/** Loads the reachable remotes from the host BFF and registers new ones with the Module Federation runtime. */
export async function loadFrontendConfig(): Promise<FrontendConfig> {
  let config: FrontendConfig
  try {
    const response = await fetch('/bff/remotes')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    config = (await response.json()) as FrontendConfig
  } catch (error) {
    return { remotes: [], error: String(error) }
  }

  const added = config.remotes.filter((remote) => !registered.has(remote.name))
  if (added.length) {
    registerRemotes(
      added.map((remote) => ({
        name: remote.name,
        entry: new URL(remote.entry, window.location.origin).href,
        type: 'module',
      })),
    )
    added.forEach((remote) => registered.add(remote.name))
  }

  return config
}

/** All pages of all remotes in navigation order. */
export function pagesInOrder(config: FrontendConfig): (RemotePage & { remote: string })[] {
  return config.remotes
    .flatMap((remote) => remote.pages.map((page) => ({ ...page, remote: remote.name })))
    .sort((a, b) => a.order - b.order)
}

/**
 * Asks the host BFF for the reachable remotes every few seconds and when the tab becomes visible again, and hands
 * changes to onChange. A failed request keeps the previous list: a short hiccup of the BFF should not empty the menu.
 */
export function watchFrontendConfig(current: () => FrontendConfig, onChange: (config: FrontendConfig) => void): () => void {
  const refresh = async () => {
    const next = await loadFrontendConfig()
    if (next.error) {
      if (current().error !== next.error) onChange({ ...current(), error: next.error })
      return
    }
    if (JSON.stringify(next) !== JSON.stringify(current())) onChange(next)
  }
  const onVisible = () => {
    if (document.visibilityState === 'visible') void refresh()
  }
  const timer = window.setInterval(() => void refresh(), refreshInterval)
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    window.clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisible)
  }
}

/** Loads an exposed component, e.g. ("vueDemo", "./DemoPage"). */
export async function loadRemoteComponent(remote: string, module: string): Promise<Component> {
  const id = `${remote}/${module.replace(/^\.\//, '')}`
  const loaded = await loadRemote<{ default: Component }>(id)
  if (!loaded?.default) throw new Error(`Remote module ${id} has no default export`)
  return loaded.default
}

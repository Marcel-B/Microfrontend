import { loadRemote, registerRemotes } from '@module-federation/runtime'
import type { Component, InjectionKey } from 'vue'
import { activateOverrides, type RemoteOverrides } from './devOverrides'

export interface RemotePage {
  path: string
  /** Title per language, e.g. { de: 'Klick-Demo', en: 'Click demo' }. */
  title: Record<string, string>
  module: string
  icon?: string | null
  requiresAuth: boolean
  roles: string[]
  showInNav: boolean
  /** Position in the navigation group; lower comes first. */
  order: number
  /**
   * Browser tab title per language, set by the remote per stage, e.g. { de: 'Test - Klick-Demo' }. Shown as it is;
   * a language without one gets the shell's own tab title.
   */
  tabTitle?: Record<string, string>
}

export interface RemoteDefinition {
  /** Path segment of /remotes/{id}/ and /api/{id}/. */
  id: string
  /** Module Federation name. */
  name: string
  entry: string
  version?: string | null
  /** Navigation group the remote's pages appear under. Only the shell's start page has none. */
  group: string
  pages: RemotePage[]
}

/** A heading in the navigation with its entries. */
export interface NavGroup<T> {
  name: string
  pages: T[]
}

export interface FrontendConfig {
  /** The remotes the host BFF currently reaches. Remotes register themselves there and leave when unreachable. */
  remotes: RemoteDefinition[]
  /** This stage lets developers load remotes from their own machine (host BFF DevOverrides:Enabled). */
  devOverrides?: boolean
  /** The local overrides active in this browser (see devOverrides.ts); empty unless devOverrides is set. */
  overrides?: RemoteOverrides
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
  // Before the first registerRemotes(): the overrides change entries as remotes register.
  config.overrides = config.devOverrides ? activateOverrides() : {}

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

export type GroupedPage = RemotePage & { remote: string; group: string }

/**
 * Pages by navigation group: remotes with the same group are listed together, their pages by order. A group comes
 * where its lowest entry would, groups with the same position by name. Filter the pages first (e.g. by role), so a
 * group whose pages the user may not see does not appear at all.
 */
export function groupPages<T extends { group: string; order: number }>(pages: T[]): NavGroup<T>[] {
  const groups = new Map<string, T[]>()
  for (const page of [...pages].sort((a, b) => a.order - b.order)) {
    groups.set(page.group, [...(groups.get(page.group) ?? []), page])
  }
  return [...groups]
    .map(([name, entries]) => ({ name, pages: entries }))
    .sort((a, b) => a.pages[0]!.order - b.pages[0]!.order || a.name.localeCompare(b.name))
}

/** All pages of all remotes, with their group, in navigation order. */
export function pagesInOrder(config: FrontendConfig): GroupedPage[] {
  return groupPages(
    config.remotes.flatMap((remote) => remote.pages.map((page) => ({ ...page, remote: remote.name, group: remote.group }))),
  ).flatMap((group) => group.pages)
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

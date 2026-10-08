import { loadRemote, registerRemotes } from '@module-federation/runtime'
import type { Component, InjectionKey } from 'vue'

export interface RemotePage {
  path: string
  title: string
  module: string
  icon?: string | null
  requiresAuth: boolean
  roles: string[]
  showInNav: boolean
}

export interface RemoteDefinition {
  name: string
  entry: string
  pages: RemotePage[]
}

export interface FrontendConfig {
  basePath: string
  remotes: RemoteDefinition[]
  /** Set when the BFF could not be reached; the shell still starts without remote pages. */
  error?: string
}

export const frontendKey: InjectionKey<FrontendConfig> = Symbol('frontend')

/** Loads the remote configuration from the BFF and registers all remotes with the Module Federation runtime. */
export async function loadFrontendConfig(): Promise<FrontendConfig> {
  let config: FrontendConfig
  try {
    const response = await fetch('/bff/frontends/vue')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    config = (await response.json()) as FrontendConfig
  } catch (error) {
    return { basePath: import.meta.env.BASE_URL, remotes: [], error: String(error) }
  }

  registerRemotes(
    config.remotes.map((remote) => ({
      name: remote.name,
      entry: new URL(remote.entry, window.location.origin).href,
      type: 'module',
    })),
  )

  return config
}

/** Loads an exposed component, e.g. ("vueDemo", "./DemoPage"). */
export async function loadRemoteComponent(remote: string, module: string): Promise<Component> {
  const id = `${remote}/${module.replace(/^\.\//, '')}`
  const loaded = await loadRemote<{ default: Component }>(id)
  if (!loaded?.default) throw new Error(`Remote module ${id} has no default export`)
  return loaded.default
}

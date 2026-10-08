import { loadRemote, registerRemotes } from '@module-federation/runtime'
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

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

export interface RemoteRoute extends RemotePage {
  remote: string
  component: LazyExoticComponent<ComponentType>
}

/** Loads the remote configuration from the BFF and registers all remotes with the Module Federation runtime. */
export async function loadFrontendConfig(): Promise<FrontendConfig> {
  let config: FrontendConfig
  try {
    const response = await fetch('/bff/frontends/react')
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

/** One lazily loaded component per remote page, e.g. ("reactDemo", "./DemoPage"). */
export function createRemoteRoutes(config: FrontendConfig): RemoteRoute[] {
  return config.remotes.flatMap((remote) =>
    remote.pages.map((page) => ({
      ...page,
      remote: remote.name,
      component: lazy(async () => {
        const id = `${remote.name}/${page.module.replace(/^\.\//, '')}`
        const loaded = await loadRemote<{ default: ComponentType }>(id)
        if (!loaded?.default) throw new Error(`Remote module ${id} has no default export`)
        return loaded
      }),
    })),
  )
}

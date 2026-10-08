import { createContext, useContext } from 'react'
import type { FrontendConfig, RemoteRoute } from './remotes'

export interface FrontendContextValue {
  config: FrontendConfig
  routes: RemoteRoute[]
}

export const FrontendContext = createContext<FrontendContextValue | null>(null)

export function useFrontend(): FrontendContextValue {
  const context = useContext(FrontendContext)
  if (!context) throw new Error('useFrontend must be used inside <FrontendProvider>')
  return context
}

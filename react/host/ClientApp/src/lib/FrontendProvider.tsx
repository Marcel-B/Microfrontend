import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { FrontendContext } from './frontend'
import { createRemoteRoutes, watchFrontendConfig, type FrontendConfig } from './remotes'

/** Holds the reachable remotes and follows the host BFF: remotes register and leave while the shell is open. */
export function FrontendProvider({ initial, children }: { initial: FrontendConfig; children: ReactNode }) {
  const [config, setConfig] = useState(initial)
  const current = useRef(config)

  useEffect(() => {
    current.current = config
  }, [config])
  useEffect(() => watchFrontendConfig(() => current.current, setConfig), [])

  const value = useMemo(() => ({ config, routes: createRemoteRoutes(config) }), [config])
  return <FrontendContext.Provider value={value}>{children}</FrontendContext.Provider>
}

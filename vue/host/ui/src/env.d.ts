/// <reference types="vite/client" />

import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** Message key of the shell's own pages, e.g. 'debug.title'. */
    titleKey?: string
    /** Title per language for remote pages (from the host BFF). */
    titles?: Record<string, string>
    requiresAuth?: boolean
    /** The user needs at least one of these roles. */
    roles?: string[]
  }
}

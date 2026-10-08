import { createRouter, createWebHistory, type Router, type RouteRecordRaw } from 'vue-router'
import RemoteError from '../components/RemoteError.vue'
import { adminRole } from '../lib/registry'
import { loadRemoteComponent, type FrontendConfig } from '../lib/remotes'
import { useAuthStore } from '../stores/auth'
import DebugView from '../views/DebugView.vue'
import ForbiddenView from '../views/ForbiddenView.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import RegistryView from '../views/RegistryView.vue'
import UnauthorizedView from '../views/UnauthorizedView.vue'

const remoteRoutePrefix = 'remote:'

function remoteRoutes(frontend: FrontendConfig): RouteRecordRaw[] {
  return frontend.remotes.flatMap((remote) =>
    remote.pages.map((page) => ({
      path: page.path,
      name: `${remoteRoutePrefix}${remote.name}:${page.module}`,
      component: () => loadRemoteComponent(remote.name, page.module).catch(() => RemoteError),
      meta: {
        titles: page.title,
        tabTitles: page.tabTitle ?? {},
        requiresAuth: page.requiresAuth || page.roles.length > 0,
        roles: page.roles,
      },
    })),
  )
}

export function createAppRouter(frontend: FrontendConfig) {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
      { path: '/', name: 'home', component: HomeView, meta: { titleKey: 'nav.home' } },
      ...remoteRoutes(frontend),
      { path: '/debug', name: 'debug', component: DebugView, meta: { titleKey: 'debug.title' } },
      {
        path: '/debug/registry',
        name: 'registry',
        component: RegistryView,
        meta: { titleKey: 'registry.title', requiresAuth: true, roles: [adminRole] },
      },
      { path: '/login', name: 'login', component: LoginView, meta: { titleKey: 'login.title' } },
      { path: '/401', name: 'unauthorized', component: UnauthorizedView, meta: { titleKey: 'status.unauthorized.title' } },
      { path: '/403', name: 'forbidden', component: ForbiddenView, meta: { titleKey: 'status.forbidden.title' } },
      { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { titleKey: 'status.notFound.title' } },
    ],
  })

  router.beforeEach(async (to) => {
    if (!to.meta.requiresAuth) return true

    const auth = useAuthStore()
    await auth.ensureLoaded()

    if (!auth.isAuthenticated) {
      return { name: 'unauthorized', query: { returnUrl: to.fullPath } }
    }
    if (!auth.hasAnyRole(to.meta.roles)) {
      return { name: 'forbidden', query: { path: to.fullPath } }
    }
    return true
  })

  return router
}

/**
 * Replaces the routes of remote pages after the list of reachable remotes changed. A page that was a 404 because its
 * remote had not registered yet is resolved again, so it appears without a reload.
 */
export async function syncRemoteRoutes(router: Router, frontend: FrontendConfig): Promise<void> {
  const wanted = new Map(remoteRoutes(frontend).map((route) => [route.name as string, route]))
  // Unchanged routes stay, so the page on screen is not loaded again.
  for (const route of router.getRoutes()) {
    if (typeof route.name !== 'string' || !route.name.startsWith(remoteRoutePrefix)) continue
    const next = wanted.get(route.name)
    if (next && next.path === route.path && JSON.stringify(next.meta) === JSON.stringify(route.meta)) {
      wanted.delete(route.name)
    } else {
      router.removeRoute(route.name)
    }
  }
  for (const route of wanted.values()) router.addRoute(route)

  const current = router.currentRoute.value
  if (current.name === 'not-found' && router.resolve(current.fullPath).name !== 'not-found') {
    await router.replace(current.fullPath)
  }
}

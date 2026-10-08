import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import RemoteError from '../components/RemoteError.vue'
import { loadRemoteComponent, type FrontendConfig } from '../lib/remotes'
import { useAuthStore } from '../stores/auth'
import DebugView from '../views/DebugView.vue'
import ForbiddenView from '../views/ForbiddenView.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import UnauthorizedView from '../views/UnauthorizedView.vue'

export function createAppRouter(frontend: FrontendConfig) {
  const remoteRoutes: RouteRecordRaw[] = frontend.remotes.flatMap((remote) =>
    remote.pages.map((page) => ({
      path: page.path,
      name: `remote:${remote.name}:${page.module}`,
      component: () => loadRemoteComponent(remote.name, page.module).catch(() => RemoteError),
      meta: {
        title: page.title,
        requiresAuth: page.requiresAuth || page.roles.length > 0,
        roles: page.roles,
      },
    })),
  )

  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
      { path: '/', name: 'home', component: HomeView, meta: { title: 'Start' } },
      ...remoteRoutes,
      { path: '/debug', name: 'debug', component: DebugView, meta: { title: 'Debug' } },
      { path: '/login', name: 'login', component: LoginView, meta: { title: 'Anmelden' } },
      { path: '/401', name: 'unauthorized', component: UnauthorizedView, meta: { title: 'Nicht angemeldet' } },
      { path: '/403', name: 'forbidden', component: ForbiddenView, meta: { title: 'Kein Zugriff' } },
      { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { title: 'Nicht gefunden' } },
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

  router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} · Microfrontend Vue` : 'Microfrontend Vue'
  })

  return router
}

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { localized } from '../i18n'
import { frontendKey, pagesInOrder } from '../lib/remotes'
import { adminRole } from '../lib/registry'
import { useAuthStore } from '../stores/auth'

interface NavItem {
  to: string
  label: string
  icon: string
}

const frontend = inject(frontendKey)!
const auth = useAuthStore()
const { t, locale } = useI18n()

const items = computed<NavItem[]>(() => [
  { to: '/', label: t('nav.home'), icon: 'pi pi-home' },
  ...pagesInOrder(frontend)
    .filter((page) => page.showInNav)
    .filter((page) => (page.requiresAuth || page.roles.length ? auth.isAuthenticated && auth.hasAnyRole(page.roles) : true))
    .map((page) => ({ to: page.path, label: localized(page.title, locale.value), icon: page.icon ?? 'pi pi-file' })),
  { to: '/debug', label: t('nav.debug'), icon: 'pi pi-wrench' },
  ...(auth.isAuthenticated && auth.hasAnyRole([adminRole])
    ? [{ to: '/debug/registry', label: t('nav.registry'), icon: 'pi pi-sitemap' }]
    : []),
])
</script>

<template>
  <nav :aria-label="t('nav.label')" data-testid="app-nav">
    <ul class="flex flex-col gap-1">
      <li v-for="item in items" :key="item.to">
        <RouterLink
          :to="item.to"
          class="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-surface-100 dark:hover:bg-surface-800"
          exact-active-class="bg-primary/10 font-medium text-primary"
        >
          <i :class="item.icon" />
          {{ item.label }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { localized } from '../i18n'
import { frontendKey, groupPages, pagesInOrder, type NavGroup } from '../lib/remotes'
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

const home = computed<NavItem>(() => ({ to: '/', label: t('nav.home'), icon: 'pi pi-home' }))

// Only the start page has no group: every remote names its own, the shell's pages go under "System".
const groups = computed<NavGroup<NavItem>[]>(() => [
  ...groupPages(
    pagesInOrder(frontend)
      .filter((page) => page.showInNav)
      .filter((page) => (page.requiresAuth || page.roles.length ? auth.isAuthenticated && auth.hasAnyRole(page.roles) : true)),
  ).map((group) => ({
    name: group.name,
    pages: group.pages.map((page) => ({ to: page.path, label: localized(page.title, locale.value), icon: page.icon ?? 'pi pi-file' })),
  })),
  {
    name: t('nav.system'),
    pages: [
      { to: '/debug', label: t('nav.debug'), icon: 'pi pi-wrench' },
      ...(frontend.devOverrides ? [{ to: '/debug/overrides', label: t('nav.overrides'), icon: 'pi pi-desktop' }] : []),
      ...(auth.isAuthenticated && auth.hasAnyRole([adminRole])
        ? [{ to: '/debug/registry', label: t('nav.registry'), icon: 'pi pi-sitemap' }]
        : []),
    ],
  },
])
</script>

<template>
  <nav :aria-label="t('nav.label')" data-testid="app-nav">
    <ul class="flex flex-col gap-1">
      <li>
        <RouterLink
          :to="home.to"
          class="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-surface-100 dark:hover:bg-surface-800"
          exact-active-class="bg-primary/10 font-medium text-primary"
        >
          <i :class="home.icon" />
          {{ home.label }}
        </RouterLink>
      </li>
      <li v-for="(group, index) in groups" :key="`${index}-${group.name}`" class="mt-3" data-testid="nav-group">
        <div class="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-color" aria-hidden="true">
          {{ group.name }}
        </div>
        <ul class="flex flex-col gap-1" :aria-label="group.name">
          <li v-for="item in group.pages" :key="item.to">
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
      </li>
    </ul>
  </nav>
</template>

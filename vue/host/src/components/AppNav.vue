<script setup lang="ts">
import { computed, inject } from 'vue'
import { frontendKey } from '../lib/remotes'
import { useAuthStore } from '../stores/auth'

interface NavItem {
  to: string
  label: string
  icon: string
}

const frontend = inject(frontendKey)!
const auth = useAuthStore()

const items = computed<NavItem[]>(() => [
  { to: '/', label: 'Start', icon: 'pi pi-home' },
  ...frontend.remotes
    .flatMap((remote) => remote.pages)
    .filter((page) => page.showInNav)
    .filter((page) => (page.requiresAuth || page.roles.length ? auth.isAuthenticated && auth.hasAnyRole(page.roles) : true))
    .map((page) => ({ to: page.path, label: page.title, icon: page.icon ?? 'pi pi-file' })),
  { to: '/debug', label: 'Debug', icon: 'pi pi-wrench' },
])
</script>

<template>
  <nav aria-label="Hauptnavigation" data-testid="app-nav">
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

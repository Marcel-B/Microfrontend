<script setup lang="ts">
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

defineEmits<{ 'toggle-nav': [] }>()

const auth = useAuthStore()
const route = useRoute()

const dark = ref(document.documentElement.classList.contains('app-dark'))
function toggleDark() {
  dark.value = document.documentElement.classList.toggle('app-dark')
}
</script>

<template>
  <header
    class="flex h-14 items-center gap-3 border-b border-surface-200 bg-surface-0 px-4 dark:border-surface-800 dark:bg-surface-900"
    data-testid="app-header"
  >
    <Button icon="pi pi-bars" text rounded class="md:hidden" aria-label="Navigation öffnen" @click="$emit('toggle-nav')" />
    <RouterLink to="/" class="flex items-center gap-2 font-semibold">
      <i class="pi pi-th-large text-primary" />
      <span>Microfrontend <span class="text-muted-color">· Vue</span></span>
    </RouterLink>

    <div class="ml-auto flex items-center gap-2">
      <Button
        :icon="dark ? 'pi pi-sun' : 'pi pi-moon'"
        text
        rounded
        :aria-label="dark ? 'Helles Design' : 'Dunkles Design'"
        @click="toggleDark"
      />
      <template v-if="auth.isAuthenticated">
        <span class="hidden items-center gap-2 sm:flex" data-testid="user-info">
          <i class="pi pi-user text-muted-color" />
          <span data-testid="user-name">{{ auth.user.name }}</span>
          <Tag v-for="role in auth.user.roles" :key="role" :value="role" severity="secondary" />
        </span>
        <Button label="Abmelden" icon="pi pi-sign-out" severity="secondary" size="small" @click="auth.logout()" />
      </template>
      <Button
        v-else-if="auth.loaded"
        label="Anmelden"
        icon="pi pi-sign-in"
        size="small"
        @click="auth.login(route.fullPath)"
      />
    </div>
  </header>
</template>

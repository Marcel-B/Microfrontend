<script setup lang="ts">
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LanguageSwitcher from './LanguageSwitcher.vue'

defineEmits<{ 'toggle-nav': [] }>()

const auth = useAuthStore()
const route = useRoute()
const { t } = useI18n()

const dark = ref(document.documentElement.classList.contains('app-dark'))
function toggleDark() {
  dark.value = document.documentElement.classList.toggle('app-dark')
}
</script>

<template>
  <header
    class="flex h-14 items-center gap-3 border-b border-surface-200 bg-surface-0 px-4 dark:border-surface-800 dark:bg-surface-900"
    data-testid="app-header"
    data-origin="host"
  >
    <Button icon="pi pi-bars" text rounded class="md:hidden" :aria-label="t('nav.open')" @click="$emit('toggle-nav')" />
    <RouterLink to="/" class="flex items-center gap-2 font-semibold">
      <i class="pi pi-th-large text-primary" />
      <span>{{ t('app.name') }} <span class="text-muted-color">· {{ t('app.variant') }}</span></span>
    </RouterLink>

    <div class="ml-auto flex items-center gap-2">
      <LanguageSwitcher />
      <Button
        :icon="dark ? 'pi pi-sun' : 'pi pi-moon'"
        text
        rounded
        :aria-label="dark ? t('header.lightMode') : t('header.darkMode')"
        @click="toggleDark"
      />
      <template v-if="auth.isAuthenticated">
        <span class="hidden items-center gap-2 sm:flex" data-testid="user-info">
          <i class="pi pi-user text-muted-color" />
          <span data-testid="user-name">{{ auth.user.name }}</span>
          <Tag v-for="role in auth.user.roles" :key="role" :value="role" severity="secondary" />
        </span>
        <Button :label="t('header.logout')" icon="pi pi-sign-out" severity="secondary" size="small" @click="auth.logout()" />
      </template>
      <Button
        v-else-if="auth.loaded"
        :label="t('header.login')"
        icon="pi pi-sign-in"
        size="small"
        @click="auth.login(route.fullPath)"
      />
    </div>
  </header>
</template>

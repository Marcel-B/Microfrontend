<script setup lang="ts">
import Drawer from 'primevue/drawer'
import Toast from 'primevue/toast'
import { ref, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import AppNav from './components/AppNav.vue'
import { localized } from './i18n'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
auth.ensureLoaded()

const { t, locale } = useI18n()
const mobileNavOpen = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => (mobileNavOpen.value = false))

// Tab title follows both the route and the language. A remote page may bring its own (stage-dependent) one.
watchEffect(() => {
  const own = route.meta.tabTitles?.[locale.value]
  if (own) {
    document.title = own
    return
  }
  const app = `${t('app.name')} ${t('app.variant')}`
  const title = route.meta.titles ? localized(route.meta.titles, locale.value) : route.meta.titleKey ? t(route.meta.titleKey) : ''
  document.title = title ? `${title} · ${app}` : app
})
</script>

<template>
  <div class="flex min-h-full flex-col">
    <AppHeader @toggle-nav="mobileNavOpen = !mobileNavOpen" />
    <div class="flex flex-1">
      <aside class="hidden w-60 shrink-0 border-r border-surface-200 p-3 md:block dark:border-surface-800" data-origin="host">
        <AppNav />
      </aside>
      <Drawer v-model:visible="mobileNavOpen" :header="t('nav.title')" class="md:hidden">
        <AppNav />
      </Drawer>
      <main class="min-w-0 flex-1 p-4 md:p-6" data-testid="app-main" data-origin="host">
        <RouterView />
      </main>
    </div>
    <AppFooter />
    <Toast />
  </div>
</template>

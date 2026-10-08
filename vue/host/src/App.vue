<script setup lang="ts">
import Drawer from 'primevue/drawer'
import Toast from 'primevue/toast'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import AppNav from './components/AppNav.vue'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
auth.ensureLoaded()

const mobileNavOpen = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => (mobileNavOpen.value = false))
</script>

<template>
  <div class="flex min-h-full flex-col">
    <AppHeader @toggle-nav="mobileNavOpen = !mobileNavOpen" />
    <div class="flex flex-1">
      <aside class="hidden w-60 shrink-0 border-r border-surface-200 p-3 md:block dark:border-surface-800">
        <AppNav />
      </aside>
      <Drawer v-model:visible="mobileNavOpen" header="Navigation" class="md:hidden">
        <AppNav />
      </Drawer>
      <main class="min-w-0 flex-1 p-4 md:p-6" data-testid="app-main">
        <RouterView />
      </main>
    </div>
    <AppFooter />
    <Toast />
  </div>
</template>

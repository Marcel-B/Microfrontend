<script setup lang="ts">
import { version } from 'vue'

const year = new Date().getFullYear()
</script>

<template>
  <footer
    class="flex flex-wrap items-center justify-between gap-2 border-t border-surface-200 px-4 py-3 text-xs text-muted-color dark:border-surface-800"
    data-testid="app-footer"
  >
    <span>© {{ year }} Microfrontend-Plattform</span>
    <span>Vue {{ version }} · PrimeVue 4 · Module Federation</span>
  </footer>
</template>

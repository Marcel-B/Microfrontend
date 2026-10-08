<script setup lang="ts">
import { version } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const year = new Date().getFullYear()
</script>

<template>
  <footer
    class="flex flex-wrap items-center justify-between gap-2 border-t border-surface-200 px-4 py-3 text-xs text-muted-color dark:border-surface-800"
    data-testid="app-footer"
  >
    <span>{{ t('footer.copyright', { year }) }}</span>
    <span>Vue {{ version }} · PrimeVue 4 · vue-i18n · Module Federation</span>
  </footer>
</template>

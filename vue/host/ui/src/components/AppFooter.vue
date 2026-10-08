<script setup lang="ts">
import { ref, version } from 'vue'
import { useI18n } from 'vue-i18n'
import { isOriginShown, origins, setOriginShown } from '../lib/origin'

const { t } = useI18n()
const year = new Date().getFullYear()

const originShown = ref(isOriginShown())
function toggleOrigin() {
  originShown.value = !originShown.value
  setOriginShown(originShown.value)
}
</script>

<template>
  <footer
    class="flex flex-wrap items-center justify-between gap-2 border-t border-surface-200 px-4 py-3 text-xs text-muted-color dark:border-surface-800"
    data-testid="app-footer"
    data-origin="host"
  >
    <span>{{ t('footer.copyright', { year }) }}</span>
    <span class="flex flex-wrap items-center gap-3">
      <span v-if="originShown" class="flex flex-wrap items-center gap-3" data-testid="origin-legend">
        <span v-for="origin in origins" :key="origin" class="flex items-center gap-1">
          <span class="size-2.5 rounded-full" :style="{ background: `var(--origin-${origin})` }" />
          {{ t(`footer.origin.${origin}`) }}
        </span>
      </span>
      <button
        type="button"
        class="cursor-pointer underline-offset-2 hover:underline"
        :aria-pressed="originShown"
        data-testid="origin-toggle"
        @click="toggleOrigin"
      >
        {{ originShown ? t('footer.origin.hide') : t('footer.origin.show') }}
      </button>
      <span>Vue {{ version }} · PrimeVue 4 · vue-i18n · Module Federation</span>
    </span>
  </footer>
</template>

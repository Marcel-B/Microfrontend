<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { locales, setLocale } from '../i18n'

const { t, locale } = useI18n()
</script>

<template>
  <div class="flex rounded-md border border-surface-200 p-0.5 dark:border-surface-700" role="group" :aria-label="t('header.language')" data-testid="language-switcher">
    <button
      v-for="item in locales"
      :key="item"
      type="button"
      class="rounded px-2 py-1 text-xs font-medium uppercase"
      :class="locale === item ? 'bg-primary text-primary-contrast' : 'text-muted-color hover:bg-surface-100 dark:hover:bg-surface-800'"
      :aria-label="t(`languages.${item}`)"
      :aria-pressed="locale === item"
      @click="setLocale(item)"
    >
      {{ item }}
    </button>
  </div>
</template>

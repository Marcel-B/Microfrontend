<script setup lang="ts">
import Button from 'primevue/button'
import Message from 'primevue/message'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { clearOverrides } from '../lib/devOverrides'
import { frontendKey } from '../lib/remotes'

const frontend = inject(frontendKey)!
const { t } = useI18n()

// Always visible while an override is active: a page from the developer's machine must not pass for the stage's.
const active = computed(() => Object.entries(frontend.overrides ?? {}))

function reset(): void {
  clearOverrides()
  window.location.reload()
}
</script>

<template>
  <Message v-if="active.length" severity="warn" :closable="false" class="rounded-none" data-origin="host" data-testid="dev-override-banner">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span class="font-medium">{{ t('overrides.banner.text') }}</span>
      <span v-for="[id, override] in active" :key="id" class="break-all" data-testid="dev-override-item">
        {{ id }}
        <template v-if="override.entry">· {{ t('overrides.banner.ui') }} {{ override.entry }}</template>
        <template v-if="override.api">· {{ t('overrides.banner.api') }} {{ override.api }}</template>
      </span>
      <span class="ml-auto flex gap-2">
        <RouterLink to="/debug/overrides" class="underline-offset-2 hover:underline">{{ t('overrides.banner.settings') }}</RouterLink>
        <Button :label="t('overrides.banner.reset')" size="small" severity="warn" text data-testid="dev-override-reset" @click="reset" />
      </span>
    </div>
  </Message>
</template>

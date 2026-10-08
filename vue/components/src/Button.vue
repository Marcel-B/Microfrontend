<script setup lang="ts">
import PvButton from 'primevue/button'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import './components.css'

/** Platform button. Keep the props in sync with the declaration in the consuming remotes (vue-components.d.ts). */
export interface ButtonProps {
  label: string
  icon?: string
  variant?: 'primary' | 'secondary' | 'danger'
  /** Shows a spinner and the library's own "please wait" text instead of the label. */
  loading?: boolean
}

const props = withDefaults(defineProps<ButtonProps>(), { icon: undefined, variant: 'primary', loading: false })

// The library brings its own texts. The language comes from the shell's vue-i18n instance (shared singleton).
const { t } = useI18n({
  useScope: 'local',
  messages: {
    de: { loading: 'Bitte warten …' },
    en: { loading: 'Please wait …' },
  },
})

const severity = computed(() => (props.variant === 'primary' ? undefined : props.variant === 'danger' ? 'danger' : 'secondary'))
</script>

<template>
  <PvButton
    :label="loading ? t('loading') : label"
    :icon="icon"
    :loading="loading"
    :severity="severity"
    class="ui:rounded-full ui:px-5 ui:shadow-sm"
    data-component="vueComponents/Button"
    data-origin="library"
  />
</template>

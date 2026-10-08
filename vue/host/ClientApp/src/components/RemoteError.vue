<script setup lang="ts">
import Message from 'primevue/message'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <Message severity="error" data-testid="remote-error">{{ t('remote.error') }}</Message>
</template>

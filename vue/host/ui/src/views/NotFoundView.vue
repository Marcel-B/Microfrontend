<script setup lang="ts">
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'
import StatusPage from '../components/StatusPage.vue'

const { t } = useI18n()
</script>

<template>
  <StatusPage code="404" :title="t('status.notFound.title')" icon="pi pi-question-circle">
    {{ t('status.notFound.text') }}
    <template #actions>
      <Button as="router-link" to="/" :label="t('status.toHome')" severity="secondary" />
    </template>
  </StatusPage>
</template>

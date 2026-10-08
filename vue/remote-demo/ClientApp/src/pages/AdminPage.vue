<script setup lang="ts">
import Message from 'primevue/message'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiGet, type AdminStatus, type ApiResult } from '../api'
import { messages } from '../i18n'
import '../remote.css'

const { t, locale } = useI18n({ useScope: 'local', messages })

const result = ref<ApiResult<AdminStatus> | null>(null)

onMounted(async () => {
  result.value = await apiGet<AdminStatus>('/admin/status')
})
</script>

<template>
  <div class="demo:flex demo:flex-col demo:gap-6" data-testid="remote-admin" data-origin="remote">
    <h1 class="demo:text-3xl demo:font-semibold">{{ t('admin.title') }}</h1>
    <Message severity="info">{{ t('admin.info') }}</Message>

    <p v-if="!result" class="demo:text-sm demo:text-muted-color">{{ t('admin.checking') }}</p>
    <Message v-else-if="result.data" severity="success" icon="pi pi-check-circle" data-testid="remote-admin-status">
      {{
        t('admin.confirmed', {
          service: result.data.checkedBy,
          time: new Date(result.data.serverTime).toLocaleTimeString(locale),
        })
      }}
    </Message>
    <Message v-else severity="error" data-testid="remote-admin-status">
      {{ t('admin.denied', { status: result.status }) }}
    </Message>
  </div>
</template>

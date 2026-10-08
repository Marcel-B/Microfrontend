<script setup lang="ts">
import Card from 'primevue/card'
import Message from 'primevue/message'
import Button from 'vueComponents/Button'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiGet, type Me } from '../api'
import { messages } from '../i18n'
import '../remote.css'

const { t } = useI18n({ useScope: 'local', messages })

const clicks = ref(0)
const me = ref<Me | null>(null)
const meLoaded = ref(false)

onMounted(async () => {
  me.value = (await apiGet<Me>('/me')).data
  meLoaded.value = true
})
</script>

<template>
  <div class="demo:flex demo:flex-col demo:gap-6" data-testid="remote-demo">
    <h1 class="demo:text-3xl demo:font-semibold">{{ t('demo.title') }}</h1>
    <p class="demo:max-w-2xl demo:text-muted-color">{{ t('demo.intro') }}</p>

    <Message v-if="me?.isAdmin" severity="warn" icon="pi pi-shield" data-testid="remote-admin-hint">
      {{ t('demo.adminHint') }}
    </Message>

    <Card class="demo:max-w-md">
      <template #title>{{ t('demo.cardTitle') }}</template>
      <template #content>
        <p class="demo:mb-4 demo:text-sm" data-testid="click-count">{{ t('demo.clicked', { count: clicks }) }}</p>
        <Button :label="t('demo.clickMe')" icon="pi pi-thumbs-up" @click="clicks++" />
      </template>
    </Card>

    <p v-if="meLoaded" class="demo:text-sm demo:text-muted-color" data-testid="remote-identity">
      <i class="pi pi-server demo:mr-1" />
      {{ me ? t('demo.identity', { name: me.name, service: me.checkedBy }) : t('demo.anonymous') }}
    </p>
  </div>
</template>

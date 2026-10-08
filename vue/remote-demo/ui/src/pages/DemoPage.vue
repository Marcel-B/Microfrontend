<script setup lang="ts">
import Card from 'primevue/card'
import Message from 'primevue/message'
import Button from 'vueComponents/Button'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiGet, type Me } from '../api'
import { useCommonI18n } from '../common'
import { messages } from '../i18n'
import '../remote.css'

const { t } = useI18n({ useScope: 'local', messages })
const { ct, source } = useCommonI18n()

const clicks = ref(0)
const me = ref<Me | null>(null)
const meLoaded = ref(false)
// Example record for the shared delete dialog; its name is data, not a text.
const promotionName = 'Herbst 2026'
const deleteState = ref<'idle' | 'confirm' | 'deleted'>('idle')

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

    <Card class="demo:max-w-md" data-testid="shared-vocabulary">
      <template #title>{{ t('vocabulary.title') }}</template>
      <template #content>
        <p class="demo:mb-4 demo:text-sm demo:text-muted-color">{{ t('vocabulary.intro') }}</p>
        <p class="demo:mb-4 demo:text-sm demo:font-medium">{{ ct('entities.promotion.name') }}: {{ promotionName }}</p>
        <div v-if="deleteState === 'confirm'" class="demo:flex demo:flex-col demo:gap-3">
          <p class="demo:text-sm" data-testid="delete-confirm">
            {{ ct('confirm.delete', { entity: ct('entities.promotion.accusative') }) }}
          </p>
          <div class="demo:flex demo:gap-2">
            <Button :label="ct('actions.delete')" icon="pi pi-trash" variant="danger" @click="deleteState = 'deleted'" />
            <Button :label="ct('actions.cancel')" variant="secondary" @click="deleteState = 'idle'" />
          </div>
        </div>
        <p v-else-if="deleteState === 'deleted'" class="demo:text-sm" data-testid="delete-status">{{ ct('status.deleted') }}</p>
        <Button v-else :label="ct('actions.delete')" icon="pi pi-trash" variant="danger" @click="deleteState = 'confirm'" />
        <p class="demo:mt-4 demo:text-xs demo:text-muted-color" data-testid="vocabulary-source" :data-source="source">
          {{ t(`vocabulary.source.${source}`) }}
        </p>
      </template>
    </Card>

    <p v-if="meLoaded" class="demo:text-sm demo:text-muted-color" data-testid="remote-identity">
      <i class="pi pi-server demo:mr-1" />
      {{ me ? t('demo.identity', { name: me.name, service: me.checkedBy }) : t('demo.anonymous') }}
    </p>
  </div>
</template>

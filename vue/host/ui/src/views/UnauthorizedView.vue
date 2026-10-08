<script setup lang="ts">
import Button from 'primevue/button'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import StatusPage from '../components/StatusPage.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const { t } = useI18n()
const returnUrl = computed(() => (typeof route.query.returnUrl === 'string' ? route.query.returnUrl : '/'))
</script>

<template>
  <StatusPage code="401" :title="t('status.unauthorized.title')" icon="pi pi-lock">
    {{ t('status.unauthorized.text') }}
    <template #actions>
      <Button :label="t('header.login')" icon="pi pi-sign-in" @click="auth.login(returnUrl)" />
    </template>
  </StatusPage>
</template>

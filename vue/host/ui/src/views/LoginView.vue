<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const { t } = useI18n()
const returnUrl = computed(() => (typeof route.query.returnUrl === 'string' ? route.query.returnUrl : '/'))
</script>

<template>
  <div class="mx-auto max-w-md py-12">
    <Card>
      <template #title>{{ t('login.title') }}</template>
      <template #content>
        <p v-if="auth.isAuthenticated" class="text-muted-color">{{ t('login.alreadySignedIn', { name: auth.user.name }) }}</p>
        <p v-else class="text-muted-color">{{ t('login.hint') }}</p>
      </template>
      <template #footer>
        <Button v-if="auth.isAuthenticated" :label="t('header.logout')" severity="secondary" @click="auth.logout()" />
        <Button v-else :label="t('login.button')" icon="pi pi-sign-in" @click="auth.login(returnUrl)" />
      </template>
    </Card>
  </div>
</template>

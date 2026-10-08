<script setup lang="ts">
import Button from 'primevue/button'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import StatusPage from '../components/StatusPage.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const returnUrl = computed(() => (typeof route.query.returnUrl === 'string' ? route.query.returnUrl : '/'))
</script>

<template>
  <StatusPage code="401" title="Nicht angemeldet" icon="pi pi-lock">
    Für diese Seite musst du angemeldet sein.
    <template #actions>
      <Button label="Anmelden" icon="pi pi-sign-in" @click="auth.login(returnUrl)" />
    </template>
  </StatusPage>
</template>

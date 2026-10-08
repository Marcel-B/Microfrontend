<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const returnUrl = computed(() => (typeof route.query.returnUrl === 'string' ? route.query.returnUrl : '/'))
</script>

<template>
  <div class="mx-auto max-w-md py-12">
    <Card>
      <template #title>Anmelden</template>
      <template #content>
        <p v-if="auth.isAuthenticated" class="text-muted-color">
          Du bist bereits als <strong>{{ auth.user.name }}</strong> angemeldet.
        </p>
        <p v-else class="text-muted-color">
          Die Anmeldung läuft über den Identity Server. Danach kommst du automatisch hierher zurück.
        </p>
      </template>
      <template #footer>
        <Button v-if="auth.isAuthenticated" label="Abmelden" severity="secondary" @click="auth.logout()" />
        <Button v-else label="Mit Identity Server anmelden" icon="pi pi-sign-in" @click="auth.login(returnUrl)" />
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import { inject } from 'vue'
import { frontendKey } from '../lib/remotes'
import { useAuthStore } from '../stores/auth'

const frontend = inject(frontendKey)!
const auth = useAuthStore()
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-3xl font-semibold">Willkommen{{ auth.isAuthenticated ? `, ${auth.user.name}` : '' }}</h1>
    <p class="max-w-2xl text-muted-color">
      Diese Shell bringt Header, Navigation, Footer, Anmeldung und die Fehlerseiten mit. Alle fachlichen Seiten sind
      Remotes, die zur Laufzeit per Module Federation eingebunden werden. Welche Remotes es gibt, legt das BFF fest.
    </p>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Card v-for="page in frontend.remotes.flatMap((r) => r.pages)" :key="page.path">
        <template #title>
          <span class="flex items-center gap-2"><i :class="page.icon ?? 'pi pi-file'" /> {{ page.title }}</span>
        </template>
        <template #content>
          <p class="text-sm text-muted-color">
            {{ page.roles.length ? `Rollen: ${page.roles.join(', ')}` : 'Für alle sichtbar' }}
          </p>
        </template>
        <template #footer>
          <RouterLink :to="page.path" class="text-sm font-medium text-primary">Öffnen →</RouterLink>
        </template>
      </Card>
    </div>
  </div>
</template>

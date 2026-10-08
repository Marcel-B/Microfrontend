<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { computed, inject, version } from 'vue'
import { frontendKey } from '../lib/remotes'
import { useAuthStore } from '../stores/auth'

const frontend = inject(frontendKey)!
const auth = useAuthStore()

const runtime = computed(() => [
  { key: 'Vue', value: version },
  { key: 'Modus', value: import.meta.env.MODE },
  { key: 'Base-URL', value: import.meta.env.BASE_URL },
  { key: 'Sitzung läuft ab', value: auth.user.sessionExpiresAt ? new Date(auth.user.sessionExpiresAt).toLocaleString() : '–' },
  { key: 'User-Agent', value: navigator.userAgent },
])

const remotes = computed(() =>
  frontend.remotes.flatMap((remote) =>
    remote.pages.map((page) => ({
      remote: remote.name,
      entry: remote.entry,
      module: page.module,
      path: page.path,
      roles: page.roles.join(', ') || '–',
    })),
  ),
)
</script>

<template>
  <div class="flex flex-col gap-6" data-testid="debug-page">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-semibold">Debug</h1>
      <Button label="Neu laden" icon="pi pi-refresh" severity="secondary" size="small" @click="auth.reload()" />
    </div>

    <Message v-if="frontend.error" severity="warn">Remote-Konfiguration nicht geladen: {{ frontend.error }}</Message>

    <Card>
      <template #title>Benutzer</template>
      <template #content>
        <dl class="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-2 text-sm">
          <dt class="text-muted-color">Angemeldet</dt>
          <dd data-testid="debug-authenticated">{{ auth.isAuthenticated ? 'ja' : 'nein' }}</dd>
          <dt class="text-muted-color">Benutzername</dt>
          <dd data-testid="debug-username">{{ auth.user.name ?? '–' }}</dd>
          <dt class="text-muted-color">Rollen</dt>
          <dd class="flex flex-wrap gap-1" data-testid="debug-roles">
            <Tag v-for="role in auth.user.roles" :key="role" :value="role" />
            <span v-if="!auth.user.roles.length">–</span>
          </dd>
        </dl>
      </template>
    </Card>

    <Card>
      <template #title>Claims</template>
      <template #content>
        <DataTable :value="auth.user.claims" size="small" striped-rows>
          <template #empty>Keine Claims (nicht angemeldet).</template>
          <Column field="type" header="Typ" />
          <Column field="value" header="Wert" body-class="break-all" />
        </DataTable>
      </template>
    </Card>

    <Card>
      <template #title>Remotes</template>
      <template #content>
        <DataTable :value="remotes" size="small" striped-rows>
          <template #empty>Keine Remotes konfiguriert.</template>
          <Column field="remote" header="Remote" />
          <Column field="module" header="Modul" />
          <Column field="path" header="Pfad" />
          <Column field="roles" header="Rollen" />
          <Column field="entry" header="Entry" body-class="break-all" />
        </DataTable>
      </template>
    </Card>

    <Card>
      <template #title>Laufzeit</template>
      <template #content>
        <dl class="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-2 text-sm">
          <template v-for="row in runtime" :key="row.key">
            <dt class="text-muted-color">{{ row.key }}</dt>
            <dd class="break-all">{{ row.value }}</dd>
          </template>
        </dl>
      </template>
    </Card>
  </div>
</template>

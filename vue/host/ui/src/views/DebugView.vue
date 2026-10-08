<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { computed, inject, version } from 'vue'
import { useI18n } from 'vue-i18n'
import { frontendKey } from '../lib/remotes'
import { useAuthStore } from '../stores/auth'

const frontend = inject(frontendKey)!
const auth = useAuthStore()
const { t, locale } = useI18n()

const runtime = computed(() => [
  { key: 'Vue', value: version },
  { key: t('debug.mode'), value: import.meta.env.MODE },
  { key: t('debug.language'), value: locale.value },
  {
    key: t('debug.sessionExpires'),
    value: auth.user.sessionExpiresAt ? new Date(auth.user.sessionExpiresAt).toLocaleString(locale.value) : '–',
  },
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
      <h1 class="text-3xl font-semibold">{{ t('debug.title') }}</h1>
      <Button :label="t('debug.reload')" icon="pi pi-refresh" severity="secondary" size="small" @click="auth.reload()" />
    </div>

    <Message v-if="frontend.error" severity="warn">{{ t('debug.configError', { error: frontend.error }) }}</Message>

    <Card>
      <template #title>{{ t('debug.user') }}</template>
      <template #content>
        <dl class="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-2 text-sm">
          <dt class="text-muted-color">{{ t('debug.authenticated') }}</dt>
          <dd data-testid="debug-authenticated">{{ auth.isAuthenticated ? t('debug.yes') : t('debug.no') }}</dd>
          <dt class="text-muted-color">{{ t('debug.userName') }}</dt>
          <dd data-testid="debug-username">{{ auth.user.name ?? '–' }}</dd>
          <dt class="text-muted-color">{{ t('debug.roles') }}</dt>
          <dd class="flex flex-wrap gap-1" data-testid="debug-roles">
            <Tag v-for="role in auth.user.roles" :key="role" :value="role" />
            <span v-if="!auth.user.roles.length">–</span>
          </dd>
        </dl>
      </template>
    </Card>

    <Card>
      <template #title>{{ t('debug.claims') }}</template>
      <template #content>
        <DataTable :value="auth.user.claims" size="small" striped-rows>
          <template #empty>{{ t('debug.noClaims') }}</template>
          <Column field="type" :header="t('debug.type')" />
          <Column field="value" :header="t('debug.value')" body-class="break-all" />
        </DataTable>
      </template>
    </Card>

    <Card>
      <template #title>{{ t('debug.remotes') }}</template>
      <template #content>
        <DataTable :value="remotes" size="small" striped-rows>
          <template #empty>{{ t('debug.noRemotes') }}</template>
          <Column field="remote" :header="t('debug.remote')" />
          <Column field="module" :header="t('debug.module')" />
          <Column field="path" :header="t('debug.path')" />
          <Column field="roles" :header="t('debug.roles')" />
          <Column field="entry" :header="t('debug.entry')" body-class="break-all" />
        </DataTable>
      </template>
    </Card>

    <Card>
      <template #title>{{ t('debug.runtime') }}</template>
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

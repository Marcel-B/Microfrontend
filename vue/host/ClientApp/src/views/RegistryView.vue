<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { localized } from '../i18n'
import { loadRegistry, type Registry, type RegistryEventKind, type RemoteHealth } from '../lib/registry'

/** The page refreshes itself as often as the host checks health, so a change shows up without a click. */
const refreshMs = 5_000

const { t, locale } = useI18n()
const registry = ref<Registry | null>(null)
const error = ref<string | null>(null)
const expanded = ref<Record<string, boolean>>({})
let timer: number | undefined

async function reload(): Promise<void> {
  try {
    registry.value = await loadRegistry()
    error.value = null
  } catch (e) {
    error.value = String(e)
  }
}

onMounted(() => {
  void reload()
  timer = window.setInterval(() => void reload(), refreshMs)
})
onBeforeUnmount(() => window.clearInterval(timer))

const healthSeverity: Record<RemoteHealth, string> = { healthy: 'success', unreachable: 'danger', unknown: 'secondary' }

const eventSeverity: Record<RegistryEventKind, string> = {
  registered: 'success',
  reachable: 'success',
  changed: 'info',
  deregistered: 'secondary',
  expired: 'warn',
  unreachable: 'danger',
  rejected: 'danger',
}

function time(value: string | null): string {
  return value ? new Date(value).toLocaleTimeString(locale.value) : '–'
}

function dateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString(locale.value) : '–'
}

/** "vor 3 s" relative to the registry's own clock, so a skewed browser clock does not matter. */
function ago(value: string | null): string {
  if (!value || !registry.value) return '–'
  const seconds = Math.round((Date.parse(registry.value.at) - Date.parse(value)) / 1000)
  return seconds >= 0 ? t('registry.ago', { seconds }) : t('registry.in', { seconds: -seconds })
}

function name(texts: Record<string, string>, fallback: string): string {
  return Object.keys(texts).length ? localized(texts, locale.value) : fallback
}
</script>

<template>
  <div class="flex flex-col gap-6" data-testid="registry-page">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h1 class="text-3xl font-semibold">{{ t('registry.title') }}</h1>
        <p class="text-sm text-muted-color">{{ t('registry.intro', { seconds: refreshMs / 1000 }) }}</p>
      </div>
      <Button :label="t('debug.reload')" icon="pi pi-refresh" severity="secondary" size="small" @click="reload()" />
    </div>

    <Message v-if="error" severity="error">{{ t('registry.loadError', { error }) }}</Message>

    <template v-if="registry">
      <Card>
        <template #title>{{ t('registry.settings') }}</template>
        <template #content>
          <dl class="grid grid-cols-[12rem_1fr] gap-x-4 gap-y-2 text-sm" data-testid="registry-settings">
            <dt class="text-muted-color">{{ t('registry.apiKeys') }}</dt>
            <dd class="flex flex-wrap gap-1">
              <Tag v-for="id in registry.settings.apiKeys" :key="id" :value="id" severity="secondary" />
              <span v-if="!registry.settings.apiKeys.length" class="text-muted-color">{{ t('registry.noApiKeys') }}</span>
            </dd>
            <dt class="text-muted-color">{{ t('registry.timing') }}</dt>
            <dd>
              {{
                t('registry.timingValue', {
                  heartbeat: registry.settings.heartbeatSeconds,
                  lease: registry.settings.leaseSeconds,
                  check: registry.settings.healthCheckSeconds,
                  threshold: registry.settings.failureThreshold,
                })
              }}
            </dd>
            <dt class="text-muted-color">{{ t('registry.requestedScopes') }}</dt>
            <dd class="flex flex-wrap gap-1">
              <Tag v-for="scope in registry.settings.requestedScopes" :key="scope" :value="scope" severity="secondary" />
            </dd>
            <dt class="text-muted-color">{{ t('registry.at') }}</dt>
            <dd>{{ dateTime(registry.at) }}</dd>
          </dl>
        </template>
      </Card>

      <Card data-testid="registry-remotes">
        <template #title>{{ t('registry.remotes', { count: registry.remotes.length }) }}</template>
        <template #content>
          <DataTable v-model:expanded-rows="expanded" :value="registry.remotes" data-key="id" size="small" striped-rows>
            <template #empty>{{ t('registry.noRemotes') }}</template>
            <Column expander class="w-10" />
            <Column :header="t('registry.remote')">
              <template #body="{ data }">
                <div class="font-medium">{{ name(data.displayName, data.id) }}</div>
                <div class="text-xs text-muted-color">{{ data.id }} · {{ data.federationName }}</div>
              </template>
            </Column>
            <Column :header="t('registry.status')">
              <template #body="{ data }">
                <Tag
                  :value="t(`registry.health.${data.health}`)"
                  :severity="healthSeverity[data.health as RemoteHealth]"
                  :data-testid="`registry-health-${data.id}`"
                />
              </template>
            </Column>
            <Column field="group" :header="t('registry.group')" />
            <Column field="version" :header="t('registry.version')" />
            <Column field="address" :header="t('registry.address')" body-class="break-all" />
            <Column :header="t('registry.heartbeat')">
              <template #body="{ data }">{{ ago(data.lastHeartbeatAt) }}</template>
            </Column>
            <Column :header="t('registry.leaseExpires')">
              <template #body="{ data }">{{ ago(data.leaseExpiresAt) }}</template>
            </Column>
            <template #expansion="{ data }">
              <div class="flex flex-col gap-4 p-2" :data-testid="`registry-details-${data.id}`">
                <dl class="grid grid-cols-[12rem_1fr] gap-x-4 gap-y-1 text-sm">
                  <dt class="text-muted-color">{{ t('registry.entry') }}</dt>
                  <dd class="break-all">{{ data.entry }}</dd>
                  <dt class="text-muted-color">{{ t('registry.routes') }}</dt>
                  <dd>{{ data.uiPath }} · {{ data.apiPath }} → {{ data.address }}</dd>
                  <dt class="text-muted-color">{{ t('registry.apiScope') }}</dt>
                  <dd class="flex items-center gap-2">
                    {{ data.apiScope ?? '–' }}
                    <Tag v-if="!data.apiScopeRequested" :value="t('registry.scopeMissing')" severity="warn" />
                  </dd>
                  <dt class="text-muted-color">{{ t('registry.healthUrl') }}</dt>
                  <dd class="break-all">{{ data.healthUrl }}</dd>
                  <dt class="text-muted-color">{{ t('registry.lastCheck') }}</dt>
                  <dd>{{ time(data.lastCheckedAt) }} · {{ t('registry.lastHealthy') }} {{ time(data.lastHealthyAt) }}</dd>
                  <template v-if="data.lastError">
                    <dt class="text-muted-color">{{ t('registry.lastError') }}</dt>
                    <dd class="text-red-600 dark:text-red-400">{{ data.lastError }} ({{ data.consecutiveFailures }}×)</dd>
                  </template>
                  <dt class="text-muted-color">{{ t('registry.registeredAt') }}</dt>
                  <dd>{{ dateTime(data.registeredAt) }}</dd>
                </dl>
                <DataTable :value="data.pages" size="small">
                  <Column field="path" :header="t('debug.path')" />
                  <Column :header="t('registry.pageTitle')">
                    <template #body="{ data: page }">
                      <span v-for="(text, language) in page.title" :key="language" class="mr-2">
                        <span class="text-muted-color">{{ language }}:</span> {{ text }}
                      </span>
                    </template>
                  </Column>
                  <Column field="module" :header="t('debug.module')" />
                  <Column :header="t('registry.icon')">
                    <template #body="{ data: page }">
                      <span class="flex items-center gap-2"><i :class="page.icon ?? ''" /> {{ page.icon ?? '–' }}</span>
                    </template>
                  </Column>
                  <Column :header="t('debug.roles')">
                    <template #body="{ data: page }">
                      <span class="flex flex-wrap gap-1">
                        <Tag v-for="role in page.roles" :key="role" :value="role" />
                        <span v-if="!page.roles.length">{{ page.requiresAuth ? t('registry.signedIn') : t('home.public') }}</span>
                      </span>
                    </template>
                  </Column>
                  <Column :header="t('registry.nav')">
                    <template #body="{ data: page }">{{ page.showInNav ? page.order : t('registry.hidden') }}</template>
                  </Column>
                </DataTable>
              </div>
            </template>
          </DataTable>
        </template>
      </Card>

      <Card data-testid="registry-former">
        <template #title>{{ t('registry.former') }}</template>
        <template #content>
          <DataTable :value="registry.former" size="small" striped-rows>
            <template #empty>{{ t('registry.noFormer') }}</template>
            <Column :header="t('registry.remote')">
              <template #body="{ data }">
                <div class="font-medium">{{ name(data.displayName, data.id) }}</div>
                <div class="text-xs text-muted-color">{{ data.id }}</div>
              </template>
            </Column>
            <Column :header="t('registry.reason')">
              <template #body="{ data }">
                <Tag :value="t(`registry.events.${data.reason}`)" :severity="eventSeverity[data.reason as RegistryEventKind]" />
              </template>
            </Column>
            <Column :header="t('registry.leftAt')">
              <template #body="{ data }">{{ dateTime(data.leftAt) }}</template>
            </Column>
            <Column field="group" :header="t('registry.group')" />
            <Column field="version" :header="t('registry.version')" />
            <Column field="address" :header="t('registry.address')" body-class="break-all" />
            <Column :header="t('registry.pages')">
              <template #body="{ data }">{{ data.pages.map((p: { path: string }) => p.path).join(', ') }}</template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <Card data-testid="registry-history">
        <template #title>{{ t('registry.history') }}</template>
        <template #content>
          <DataTable :value="registry.history" size="small" striped-rows paginator :rows="15">
            <template #empty>{{ t('registry.noHistory') }}</template>
            <Column :header="t('registry.time')">
              <template #body="{ data }">{{ dateTime(data.at) }}</template>
            </Column>
            <Column field="remoteId" :header="t('registry.remote')" />
            <Column :header="t('registry.event')">
              <template #body="{ data }">
                <Tag :value="t(`registry.events.${data.kind}`)" :severity="eventSeverity[data.kind as RegistryEventKind]" />
              </template>
            </Column>
            <Column field="detail" :header="t('registry.detail')" body-class="break-all" />
          </DataTable>
        </template>
      </Card>
    </template>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { computed, inject, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { clearOverrides, entryUrl, isLoopbackUrl, readOverrides, saveOverrides, type RemoteOverrides } from '../lib/devOverrides'
import { frontendKey } from '../lib/remotes'

const frontend = inject(frontendKey)!
const { t } = useI18n()
const origin = window.location.origin
const examples = { entry: 'http://localhost:5174', api: 'http://localhost:5011' }

// The form starts from what is stored, which is what applies after the next reload.
const stored = readOverrides()
const form = reactive<Record<string, { entry: string; api: string }>>(
  Object.fromEntries(frontend.remotes.map((remote) => [remote.id, { entry: stored[remote.id]?.entry ?? '', api: stored[remote.id]?.api ?? '' }])),
)

// Remotes registered after the page opened get their fields here.
const rows = computed(() =>
  frontend.remotes.map((remote) => ({ remote, fields: (form[remote.id] ??= { entry: '', api: '' }) })),
)

const invalid = (value: string) => value.trim() !== '' && !isLoopbackUrl(value.trim())
const hasErrors = computed(() => Object.values(form).some((fields) => invalid(fields.entry) || invalid(fields.api)))

const apiHint = (id: string) => t('overrides.apiHint', { id })

function save(): void {
  if (hasErrors.value) return
  const overrides: RemoteOverrides = {}
  for (const remote of frontend.remotes) {
    const fields = form[remote.id]
    if (!fields) continue
    const entry = fields.entry.trim() ? entryUrl(fields.entry, remote.entry) : undefined
    const api = fields.api.trim() ? fields.api.trim().replace(/\/$/, '') : undefined
    if (entry || api) overrides[remote.id] = { name: remote.name, entry, api }
  }
  saveOverrides(overrides)
  window.location.reload()
}

function reset(): void {
  clearOverrides()
  window.location.reload()
}
</script>

<template>
  <div class="flex flex-col gap-6" data-testid="dev-overrides-page">
    <div>
      <h1 class="text-3xl font-semibold">{{ t('overrides.title') }}</h1>
      <p class="max-w-3xl text-sm text-muted-color">{{ t('overrides.intro') }}</p>
    </div>

    <Message v-if="!frontend.devOverrides" severity="info" data-testid="dev-overrides-disabled">{{ t('overrides.disabled') }}</Message>

    <template v-else>
      <Message v-if="!frontend.remotes.length" severity="info">{{ t('overrides.noRemotes') }}</Message>

      <form v-else class="flex flex-col gap-4" @submit.prevent="save">
        <Card v-for="{ remote, fields } in rows" :key="remote.id" :data-testid="`dev-override-${remote.id}`">
          <template #title>
            <span class="flex items-center gap-2">
              {{ remote.id }}
              <span class="text-sm font-normal text-muted-color">{{ remote.name }}</span>
              <Tag v-if="frontend.overrides?.[remote.id]" :value="t('overrides.active')" severity="warn" />
            </span>
          </template>
          <template #content>
            <div class="flex flex-col gap-4">
              <p class="break-all text-sm text-muted-color">{{ t('overrides.deployed') }}: {{ remote.entry }}</p>
              <label class="flex flex-col gap-1">
                <span class="text-sm font-medium">{{ t('overrides.ui') }}</span>
                <InputText
                  v-model="fields.entry"
                  :placeholder="examples.entry"
                  :invalid="invalid(fields.entry)"
                  fluid
                  data-testid="dev-override-entry"
                />
                <small :class="invalid(fields.entry) ? 'text-red-600' : 'text-muted-color'">
                  {{ invalid(fields.entry) ? t('overrides.invalid') : t('overrides.uiHint') }}
                </small>
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-sm font-medium">{{ t('overrides.api') }}</span>
                <InputText
                  v-model="fields.api"
                  :placeholder="examples.api"
                  :invalid="invalid(fields.api)"
                  fluid
                  data-testid="dev-override-api"
                />
                <small :class="invalid(fields.api) ? 'text-red-600' : 'text-muted-color'">
                  {{ invalid(fields.api) ? t('overrides.invalid') : apiHint(remote.id) }}
                </small>
              </label>
            </div>
          </template>
        </Card>

        <div class="flex flex-wrap gap-2">
          <Button type="submit" :label="t('overrides.save')" icon="pi pi-save" :disabled="hasErrors" data-testid="dev-overrides-save" />
          <Button :label="t('overrides.reset')" icon="pi pi-times" severity="secondary" data-testid="dev-overrides-reset" @click="reset" />
        </div>
      </form>

      <Card>
        <template #title>{{ t('overrides.setup') }}</template>
        <template #content>
          <ol class="flex list-decimal flex-col gap-2 pl-5 text-sm">
            <li>{{ t('overrides.steps.env', { origin }) }}</li>
            <li>{{ t('overrides.steps.run') }}</li>
            <li>{{ t('overrides.steps.save') }}</li>
            <li>{{ t('overrides.steps.browsers') }}</li>
          </ol>
        </template>
      </Card>
    </template>
  </div>
</template>

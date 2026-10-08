<script setup lang="ts">
import Card from 'primevue/card'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { localized } from '../i18n'
import { frontendKey, pagesInOrder } from '../lib/remotes'
import { useAuthStore } from '../stores/auth'

const frontend = inject(frontendKey)!
const auth = useAuthStore()
const { t, locale } = useI18n()
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-3xl font-semibold">
      {{ auth.isAuthenticated ? t('home.welcomeUser', { name: auth.user.name }) : t('home.welcome') }}
    </h1>
    <p class="max-w-2xl text-muted-color">{{ t('home.intro') }}</p>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Card v-for="page in pagesInOrder(frontend)" :key="page.path">
        <template #title>
          <span class="flex items-center gap-2"><i :class="page.icon ?? 'pi pi-file'" /> {{ localized(page.title, locale) }}</span>
        </template>
        <template #content>
          <p class="text-sm text-muted-color">
            {{ page.roles.length ? t('home.roles', { roles: page.roles.join(', ') }) : t('home.public') }}
          </p>
        </template>
        <template #footer>
          <RouterLink :to="page.path" class="text-sm font-medium text-primary">{{ t('home.open') }}</RouterLink>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import StatusPage from '../components/StatusPage.vue'
</script>

<template>
  <StatusPage code="404" title="Seite nicht gefunden" icon="pi pi-question-circle">
    Diese Seite gibt es nicht.
    <template #actions>
      <Button as="router-link" to="/" label="Zur Startseite" severity="secondary" />
    </template>
  </StatusPage>
</template>

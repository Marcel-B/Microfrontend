<script setup lang="ts">
import Button from 'primevue/button'
import StatusPage from '../components/StatusPage.vue'
</script>

<template>
  <StatusPage code="403" title="Kein Zugriff" icon="pi pi-ban">
    Dein Benutzer hat nicht die nötige Rolle für diese Seite.
    <template #actions>
      <Button as="router-link" to="/" label="Zur Startseite" severity="secondary" />
    </template>
  </StatusPage>
</template>

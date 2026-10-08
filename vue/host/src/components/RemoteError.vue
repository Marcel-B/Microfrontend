<script setup lang="ts">
import Message from 'primevue/message'
</script>

<template>
  <Message severity="error" data-testid="remote-error">
    Diese Seite konnte nicht geladen werden. Läuft das Remote und ist es im BFF konfiguriert?
  </Message>
</template>

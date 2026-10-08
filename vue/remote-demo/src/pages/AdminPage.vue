<script setup lang="ts">
import Message from 'primevue/message'
import '../remote.css'
</script>

<template>
  <div class="demo:flex demo:flex-col demo:gap-6" data-testid="remote-admin">
    <h1 class="demo:text-3xl demo:font-semibold">Administration</h1>
    <Message severity="info">
      Nur Benutzer mit der Rolle <strong>admin</strong> sehen diese Seite. Die Rollen kommen vom Identity Server, die
      Prüfung macht die Shell anhand der Remote-Konfiguration im BFF.
    </Message>
  </div>
</template>

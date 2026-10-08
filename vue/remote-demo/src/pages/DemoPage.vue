<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import { ref } from 'vue'
import '../remote.css'

const clicks = ref(0)
</script>

<template>
  <div class="demo:flex demo:flex-col demo:gap-6" data-testid="remote-demo">
    <h1 class="demo:text-3xl demo:font-semibold">Demo-Remote</h1>
    <p class="demo:max-w-2xl demo:text-muted-color">
      Diese Seite kommt aus dem Remote <code>vueDemo</code> und wird zur Laufzeit per Module Federation in die Shell
      geladen. Vue, Vue Router, Pinia und PrimeVue teilt sie sich mit der Shell.
    </p>
    <Card class="demo:max-w-md">
      <template #title>PrimeVue im Remote</template>
      <template #content>
        <p class="demo:mb-4 demo:text-sm">Button wurde {{ clicks }}-mal geklickt.</p>
        <Button label="Klick mich" icon="pi pi-thumbs-up" @click="clicks++" />
      </template>
    </Card>
  </div>
</template>

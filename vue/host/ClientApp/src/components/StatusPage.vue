<script setup lang="ts">
defineProps<{ code: string; title: string; icon: string }>()
</script>

<template>
  <section class="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center" data-testid="status-page">
    <i :class="[icon, 'text-5xl text-muted-color']" />
    <p class="text-6xl font-bold text-primary">{{ code }}</p>
    <h1 class="text-2xl font-semibold">{{ title }}</h1>
    <p class="text-muted-color"><slot /></p>
    <div class="flex gap-2"><slot name="actions" /></div>
  </section>
</template>

<script setup lang="ts">
/** Kor 页头（对应 Koring setting/SectionTitle.tsx 的 PageHeader）。 */
defineProps<{ title: string; desc?: string }>()
</script>

<template>
  <header class="kor-header">
    <h2 class="kor-header-title">{{ title }}</h2>
    <p v-if="desc" class="kor-header-desc">{{ desc }}</p>
  </header>
</template>

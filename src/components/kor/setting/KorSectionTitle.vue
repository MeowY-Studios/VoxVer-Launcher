<script setup lang="ts">
/** Kor 分组标题（对应 Koring setting/SectionTitle.tsx）。 */
defineProps<{ title?: string }>()
</script>

<template>
  <h3 class="kor-section-title">
    <slot>{{ title }}</slot>
  </h3>
</template>

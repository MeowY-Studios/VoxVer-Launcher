<script setup lang="ts">
/** 设置页页头：标题 20/700 + 描述 14px muted（Koring PageHeader）。 */
defineProps<{ title: string; desc?: string }>()
</script>

<template>
  <header class="kor-header">
    <h2 class="kor-header-title">{{ title }}</h2>
    <p v-if="desc" class="kor-header-desc">{{ desc }}</p>
  </header>
</template>

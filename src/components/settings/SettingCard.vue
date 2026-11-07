<script setup lang="ts">
/**
 * Koring 风格的磨砂玻璃卡片：设置页里所有行的容器。
 */
withDefaults(defineProps<{ flush?: boolean }>(), { flush: false })
</script>

<template>
  <div class="kor-card" :class="{ 'kor-card--flush': flush }">
    <slot />
  </div>
</template>

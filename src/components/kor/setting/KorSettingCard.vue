<script setup lang="ts">
/**
 * Kor 设置卡片（对应 Koring setting/SettingCard.tsx）：
 * px-5 py-4；flush 时纵向内边距、横向贴边，用于卡片内自带行的布局。
 */
withDefaults(defineProps<{ flush?: boolean }>(), { flush: false })
</script>

<template>
  <div class="kor-card" :class="{ 'kor-card--flush': flush }">
    <slot />
  </div>
</template>

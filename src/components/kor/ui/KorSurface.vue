<script setup lang="ts">
/**
 * Kor 卡片表面（对应 Koring setting/SettingSurface.tsx）：
 * 14px 圆角 + 半透明底 + 1px hairline + 12px 毛玻璃。
 */
withDefaults(defineProps<{ flush?: boolean }>(), { flush: false })
</script>

<template>
  <div class="kor-surface" :class="{ 'kor-surface--flush': flush }">
    <slot />
  </div>
</template>

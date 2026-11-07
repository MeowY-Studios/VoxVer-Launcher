<script setup lang="ts">
/**
 * Kor 设置行（对应 Koring setting/SettingRow.tsx）：
 * 左 label 14/500 + desc 13 muted，右控件；行间自动 hairline 分隔。
 */
defineProps<{ label: string; desc?: string }>()
</script>

<template>
  <div class="kor-row">
    <div class="kor-row-main">
      <p class="kor-row-label">{{ label }}</p>
      <p v-if="desc" class="kor-row-desc">{{ desc }}</p>
      <slot name="below" />
    </div>
    <div class="kor-row-control">
      <slot />
    </div>
  </div>
</template>

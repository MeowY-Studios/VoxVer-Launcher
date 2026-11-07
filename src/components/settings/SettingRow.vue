<script setup lang="ts">
/**
 * 一行设置：左侧标题 + 描述，右侧控件插槽。
 * 排版对齐 Koring 的 SettingRow（label 14/500，desc 13px muted，gap 16px）。
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

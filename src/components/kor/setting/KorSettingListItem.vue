<script setup lang="ts">
/**
 * Kor 列表条目（对应 Koring setting/SettingListItem.tsx）：
 * 左侧圆角图标块 + 标题/描述 + 右侧箭头，条目之间自动 hairline。
 */
defineProps<{ label: string; desc?: string; arrow?: boolean; active?: boolean }>()
</script>

<template>
  <button type="button" class="kor-list-item" :class="{ 'is-active': active }">
    <span v-if="$slots.icon" class="kor-list-item__icon">
      <slot name="icon" />
    </span>
    <span class="kor-list-item__main">
      <span class="kor-list-item__label">{{ label }}</span>
      <span v-if="desc" class="kor-list-item__desc">{{ desc }}</span>
    </span>
    <svg
      v-if="arrow !== false"
      class="kor-list-item__arrow"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  </button>
</template>

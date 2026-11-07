<script setup lang="ts">
/**
 * Koring 侧栏账户卡（移植自 koring-launcher 的 SettingsAccountCard）：
 * 统一图标 + 名称 + 一行说明，整卡可点。
 */
defineProps<{
  name: string
  desc?: string
  avatar?: string
}>()

const emit = defineEmits<{ select: [] }>()
</script>

<template>
  <button type="button" class="kor-account-card" @click="emit('select')">
    <span class="kor-account-card__avatar">
      <img v-if="avatar" :src="avatar" alt="" />
      <svg
        v-else
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
        <path d="M10 8l4 4-4 4" />
        <path d="M14 12H3" />
      </svg>
    </span>
    <span class="kor-account-card__meta">
      <span class="kor-account-card__name">{{ name }}</span>
      <span v-if="desc" class="kor-account-card__desc">{{ desc }}</span>
    </span>
  </button>
</template>

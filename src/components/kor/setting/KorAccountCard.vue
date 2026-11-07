<script setup lang="ts">
/**
 * Koring 侧栏账户卡（移植自 koring-launcher 的 SettingsAccountCard）：
 * 头像 + 名称 + 一行说明，整卡可点。
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
    <span class="kor-account-card__avatar">{{ avatar || 'V' }}</span>
    <span class="kor-account-card__meta">
      <span class="kor-account-card__name">{{ name }}</span>
      <span v-if="desc" class="kor-account-card__desc">{{ desc }}</span>
    </span>
  </button>
</template>

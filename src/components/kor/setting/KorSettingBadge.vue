<script setup lang="ts">
/** Kor 设置徽标（对应 Koring setting/SettingBadge.tsx）。 */
withDefaults(defineProps<{ variant?: 'solid' | 'soft' | 'outline' }>(), {
  variant: 'soft'
})
</script>

<template>
  <span class="kor-badge" :class="`kor-badge--${variant}`">
    <slot />
  </span>
</template>

<script setup lang="ts">
/** Kor 徽标（对应 Koring ui/badge.tsx）。 */
withDefaults(defineProps<{ variant?: 'solid' | 'soft' | 'outline' }>(), {
  variant: 'soft'
})
</script>

<template>
  <span class="kor-badge" :class="`kor-badge--${variant}`">
    <slot />
  </span>
</template>

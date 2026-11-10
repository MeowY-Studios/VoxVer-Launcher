<script setup lang="ts">
/** Kor 分隔线（对应 Koring ui/separator.tsx）。 */
withDefaults(defineProps<{ orientation?: 'horizontal' | 'vertical'; inset?: boolean }>(), {
  orientation: 'horizontal',
  inset: false
})
</script>

<template>
  <div
    class="kor-sep"
    :class="orientation === 'vertical' ? 'kor-sep--v' : 'kor-sep--h'"
    :style="inset ? { margin: '0 16px' } : undefined"
    role="separator"
    :aria-orientation="orientation"
  />
</template>

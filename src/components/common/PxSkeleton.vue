<template>
  <div
    :class="[
      'px-skeleton',
      `px-skeleton--${variant}`,
      { 'px-skeleton--animate': animate }
    ]"
    :style="variant === 'rectangle' ? { width, height, borderRadius } : {}"
    role="status"
    :aria-label="ariaLabel"
  />
</template>

<script setup lang="ts">
export interface PxSkeletonProps {
  variant?: 'text' | 'circle' | 'rectangle'
  width?: string
  height?: string
  borderRadius?: string
  animate?: boolean
  ariaLabel?: string
}

withDefaults(defineProps<PxSkeletonProps>(), {
  variant: 'text',
  width: '100%',
  height: '16px',
  borderRadius: 'var(--voxver-radius-sm)',
  animate: true,
  ariaLabel: 'Loading...'
})
</script>

<style scoped>
.px-skeleton {
  background: linear-gradient(
    90deg,
    var(--voxver-bg-tertiary) 25%,
    var(--voxver-bg-hover) 37%,
    var(--voxver-bg-tertiary) 63%
  );
  background-size: 200% 100%;
  flex-shrink: 0;
}

.px-skeleton--text {
  width: 100%;
  height: 16px;
  border-radius: var(--voxver-radius-sm);
}

.px-skeleton--circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.px-skeleton--rectangle {
  /* width/height/borderRadius from props */
}

.px-skeleton--animate {
  animation: shimmer 1.8s ease-in-out infinite;
}
</style>

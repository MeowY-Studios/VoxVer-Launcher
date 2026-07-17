<template>
  <span :class="badgeClasses">
    <span v-if="dot && !pulse" class="px-badge__dot" />
    <span v-if="dot && pulse" :class="['px-badge__dot', 'px-badge__dot--pulse']" />
    <slot>{{ text }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface PxBadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gradient'
  size?: 'sm' | 'md'
  text?: string
  dot?: boolean // * 仅显示圆点
  pulse?: boolean // * 圆点呼吸动画
  outline?: boolean // * 边框风格
  gradient?: boolean // * 渐变背景
}

const props = withDefaults(defineProps<PxBadgeProps>(), {
  variant: 'primary',
  size: 'md',
  text: '',
  dot: false,
  pulse: false,
  outline: false,
  gradient: false
})

const badgeClasses = computed(() => [
  'px-badge',
  `px-badge--${props.variant}`,
  `px-badge--${props.size}`,
  {
    'px-badge--dot-only': props.dot,
    'px-badge--outline': props.outline,
    'px-badge--gradient': props.gradient
  }
])
</script>

<style scoped>
.px-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: var(--voxver-font-medium, 500);
  border-radius: 9999px;
  white-space: nowrap;
  line-height: 1.5;
}

/* Sizes */
.px-badge--sm {
  padding: 1px 7px;
  font-size: 10px;
}
.px-badge--md {
  padding: 2px 10px;
  font-size: 11px;
}

/* * Dot */
.px-badge__dot {
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  background: currentColor;
  flex-shrink: 0;
}
.px-badge__dot--pulse {
  animation: px-badge-pulse 1.5s ease-in-out infinite;
}
@keyframes px-badge-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

/* Dot-only (no text, compact) */
.px-badge--dot-only {
  padding: 0;
  width: 10px;
  height: 10px;
  justify-content: center;
  background: currentColor;
}
.px-badge--dot-only .px-badge__dot {
  width: 6px;
  height: 6px;
  background: #fff;
}

/* * Variants */
.px-badge--primary {
  background: var(--voxver-primary-100, color-mix(in oklab, var(--voxver-primary) 12%, transparent));
  color: var(--voxver-primary-700);
}
.px-badge--success {
  background: var(--voxver-success-bg);
  color: var(--voxver-success);
}
.px-badge--warning {
  background: var(--voxver-warning-bg);
  color: var(--voxver-warning);
}
.px-badge--error {
  background: var(--voxver-error-bg);
  color: var(--voxver-error);
}
.px-badge--info {
  background: var(--voxver-info-bg);
  color: var(--voxver-info);
}
.px-badge--gradient {
  background: var(--voxver-primary);
  color: var(--voxver-text-inverse);
}

/* * Outline variant */
.px-badge--outline.px-badge--primary {
  background: transparent;
  color: var(--voxver-primary-600);
  border: 1px solid var(--voxver-primary-300);
}
.px-badge--outline.px-badge--success {
  background: transparent;
  color: var(--voxver-success);
  border: 1px solid var(--voxver-success-bg);
}
.px-badge--outline.px-badge--warning {
  background: transparent;
  color: var(--voxver-warning);
  border: 1px solid var(--voxver-warning-bg);
}
.px-badge--outline.px-badge--error {
  background: transparent;
  color: var(--voxver-error);
  border: 1px solid var(--voxver-error-bg);
}
.px-badge--outline.px-badge--info {
  background: transparent;
  color: var(--voxver-info);
  border: 1px solid var(--voxver-info-bg);
}
</style>

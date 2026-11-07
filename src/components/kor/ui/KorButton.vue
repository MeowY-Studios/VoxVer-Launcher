<script setup lang="ts">
/**
 * Kor 按钮（对应 Koring ui/button.tsx 的尺寸与变体）。
 * 视觉基底复用 settings-surface.scss 的 .kor-btn。
 */
withDefaults(
  defineProps<{
    variant?: 'default' | 'primary' | 'outline' | 'ghost' | 'danger'
    size?: 'sm' | 'md'
    block?: boolean
    pill?: boolean
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
  }>(),
  { variant: 'outline', size: 'md', type: 'button' }
)
</script>

<template>
  <button
    :type="type"
    class="kor-btn"
    :class="[
      `kor-btn--${variant}`,
      size === 'sm' && 'kor-btn--sm',
      block && 'kor-btn--block',
      pill && 'kor-btn--pill',
      loading && 'is-loading'
    ]"
    :disabled="disabled || loading"
  >
    <slot />
  </button>
</template>

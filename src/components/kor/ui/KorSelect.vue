<script setup lang="ts">
/** Kor 下拉（对应 Koring ui/select.tsx）：32px 高、13px 字、8px 圆角。 */
const value = defineModel<string>({ default: '' })
const props = withDefaults(
  defineProps<{
    options: Array<{ value: string; label: string }>
    width?: number
    label?: string
    disabled?: boolean
  }>(),
  { width: 224 }
)
</script>

<template>
  <div class="kor-select" :style="{ width: `${props.width}px` }">
    <select
      :value="value"
      :aria-label="props.label"
      :disabled="props.disabled"
      @change="value = ($event.target as HTMLSelectElement).value"
    >
      <option v-for="opt in props.options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <svg
      class="kor-select-caret"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </div>
</template>

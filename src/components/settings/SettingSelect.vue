<script setup lang="ts">
/** Koring 风格下拉：32px 高、13px 字、8px 圆角、224px 默认宽。 */
withDefaults(
  defineProps<{
    modelValue: string
    options: Array<{ value: string; label: string }>
    width?: number
    label?: string
  }>(),
  { width: 224 }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="kor-select" :style="{ width: width + 'px' }">
    <select :value="modelValue" :aria-label="label" @change="onChange">
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
    <svg class="kor-select-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </div>
</template>

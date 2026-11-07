<script setup lang="ts">
/** Koring 风格滑杆：6px 轨道 + 主色填充 + 白色拇指。 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    width?: number
    label?: string
  }>(),
  { min: 0, max: 100, step: 1, width: 180 }
)

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const percent = computed(() => {
  const span = props.max - props.min
  if (span <= 0) return 0
  return Math.min(100, Math.max(0, ((props.modelValue - props.min) / span) * 100))
})

function onInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(value)) emit('update:modelValue', value)
}
</script>

<template>
  <div class="kor-slider" :style="{ width: width + 'px' }">
    <div class="kor-slider-track">
      <div class="kor-slider-fill" :style="{ width: percent + '%' }" />
    </div>
    <span class="kor-slider-thumb" :style="{ left: percent + '%' }" />
    <input
      class="kor-slider-input"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      :aria-label="label"
      @input="onInput"
    />
  </div>
</template>

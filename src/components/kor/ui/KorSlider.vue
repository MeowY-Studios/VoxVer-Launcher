<script setup lang="ts">
/** Kor 滑杆（对应 Koring ui/slider.tsx）：6px 轨道 + 主色填充 + 白色拇指。 */
import { computed } from 'vue'

const value = defineModel<number>({ default: 0 })
const props = withDefaults(
  defineProps<{ min?: number; max?: number; step?: number; width?: number; label?: string }>(),
  { min: 0, max: 100, step: 1, width: 180 }
)

const percent = computed(() => {
  const span = props.max - props.min
  if (span <= 0) return 0
  return Math.min(100, Math.max(0, ((value.value - props.min) / span) * 100))
})

function onInput(event: Event) {
  const next = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(next)) value.value = next
}
</script>

<template>
  <div class="kor-slider" :style="{ width: `${props.width}px` }">
    <div class="kor-slider-track">
      <div class="kor-slider-fill" :style="{ width: `${percent}%` }" />
    </div>
    <span class="kor-slider-thumb" :style="{ left: `${percent}%` }" />
    <input
      class="kor-slider-input"
      type="range"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      :value="value"
      :aria-label="props.label"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
/** Kor 进度条（对应 Koring ui/progress.tsx）。 */
import { computed } from 'vue'

const props = withDefaults(defineProps<{ value?: number; max?: number; label?: string }>(), {
  value: 0,
  max: 100
})

const percent = computed(() => Math.min(100, Math.max(0, (props.value / (props.max || 1)) * 100)))
</script>

<template>
  <div
    class="kor-progress"
    role="progressbar"
    :aria-valuenow="props.value"
    :aria-valuemax="props.max"
    :aria-label="props.label"
  >
    <div class="kor-progress__fill" :style="{ width: `${percent}%` }" />
  </div>
</template>

<script setup lang="ts">
/**
 * Kor 数字输入（对应 Koring setting/SettingNumberField）：
 * 「−  数值  ＋」步进条，默认 112px 宽、32px 高；值始终对齐 step 并夹取到 min/max。
 * 只负责控件本身，label / desc 交给外层 KorSettingRow。
 */
const value = defineModel<number>({ default: 0 })

const props = withDefaults(
  defineProps<{
    min?: number
    max?: number
    step?: number
    suffix?: string
    width?: number
    disabled?: boolean
    label?: string
  }>(),
  { step: 1, width: 112 }
)

const stepSize = () => (props.step && props.step > 0 ? props.step : 1)

function normalize(raw: number): number {
  const step = stepSize()
  let next = Number.isFinite(raw) ? raw : 0
  next = Math.round(next / step) * step
  if (props.min !== undefined) next = Math.max(props.min, next)
  if (props.max !== undefined) next = Math.min(props.max, next)
  return Number(next.toFixed(4))
}

function nudge(dir: 1 | -1) {
  if (props.disabled) return
  value.value = normalize((value.value ?? 0) + dir * stepSize())
}

function onInput(event: Event) {
  const next = Number((event.target as HTMLInputElement).value)
  if (!Number.isFinite(next)) return
  value.value = normalize(next)
}
</script>

<template>
  <div
    class="kor-num"
    :class="{ 'is-disabled': props.disabled }"
    :style="{ width: `${props.width}px` }"
  >
    <button
      type="button"
      class="kor-num__btn"
      :disabled="props.disabled"
      :aria-label="props.label ? `${props.label} -` : '-'"
      @click="nudge(-1)"
    >
      −
    </button>
    <input
      class="kor-num__input"
      type="number"
      :value="value"
      :min="props.min"
      :max="props.max"
      :step="stepSize()"
      :disabled="props.disabled"
      :aria-label="props.label"
      @change="onInput"
    />
    <span v-if="props.suffix" class="kor-num__suffix">{{ props.suffix }}</span>
    <button
      type="button"
      class="kor-num__btn"
      :disabled="props.disabled"
      :aria-label="props.label ? `${props.label} +` : '+'"
      @click="nudge(1)"
    >
      ＋
    </button>
  </div>
</template>

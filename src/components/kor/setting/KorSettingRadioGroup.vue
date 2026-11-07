<script setup lang="ts">
/**
 * Kor 单选组（对应 Koring ui/radio-group + setting/SettingRadioGroup）：
 * 竖向列表，选中项主色圆点 + 主色描边；可选 inline 横向排列。
 * 只负责控件本身，标题交给外层 KorSettingRow / KorSectionTitle。
 */
import type { KorRadioOption } from './types'

const value = defineModel<string>({ default: '' })

const props = withDefaults(
  defineProps<{
    options: KorRadioOption[]
    disabled?: boolean
    label?: string
    inline?: boolean
  }>(),
  { inline: false }
)

function select(next: string) {
  if (props.disabled || next === value.value) return
  value.value = next
}
</script>

<template>
  <div
    class="kor-radio"
    :class="{ 'is-inline': props.inline, 'is-disabled': props.disabled }"
    role="radiogroup"
    :aria-label="props.label"
  >
    <button
      v-for="opt in props.options"
      :key="opt.value"
      type="button"
      role="radio"
      class="kor-radio__item"
      :class="{ 'is-checked': value === opt.value }"
      :aria-checked="value === opt.value"
      :disabled="props.disabled"
      @click="select(opt.value)"
    >
      <span class="kor-radio__dot" aria-hidden="true" />
      <span class="kor-radio__text">
        <span class="kor-radio__label">{{ opt.label }}</span>
        <span v-if="opt.desc" class="kor-radio__desc">{{ opt.desc }}</span>
      </span>
    </button>
  </div>
</template>

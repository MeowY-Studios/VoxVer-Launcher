<script setup lang="ts">
/** Kor 输入框（对应 Koring ui/input.tsx）。 */
const value = defineModel<string>({ default: '' })
const props = withDefaults(
  defineProps<{
    type?: string
    placeholder?: string
    label?: string
    disabled?: boolean
    invalid?: boolean
  }>(),
  { type: 'text' }
)
</script>

<template>
  <input
    v-model="value"
    class="kor-input"
    :type="props.type"
    :placeholder="props.placeholder"
    :aria-label="props.label"
    :aria-invalid="props.invalid || undefined"
    :disabled="props.disabled"
  />
</template>

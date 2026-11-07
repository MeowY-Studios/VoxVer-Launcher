<script setup lang="ts">
/** Kor 开关（对应 Koring ui/switch.tsx）：32 × 18.4，拇指 16。 */
const checked = defineModel<boolean>({ default: false })
const props = defineProps<{ disabled?: boolean; label?: string }>()
</script>

<template>
  <button
    type="button"
    class="kor-switch"
    :class="{ 'is-checked': checked }"
    role="switch"
    :aria-checked="checked"
    :aria-label="props.label"
    :disabled="props.disabled"
    @click="checked = !checked"
  >
    <span class="kor-switch-thumb" />
  </button>
</template>

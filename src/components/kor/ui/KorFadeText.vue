<script setup lang="ts">
/** Kor 淡入文本（对应 Koring ui/fade-text.tsx）：挂载时逐字/整块淡入。 */
import { computed } from 'vue'

const props = withDefaults(defineProps<{ text: string; delay?: number }>(), { delay: 0 })

const style = computed(() => ({ animationDelay: `${props.delay}ms` }))
</script>

<template>
  <span class="kor-fade-text" :style="style">{{ props.text }}</span>
</template>

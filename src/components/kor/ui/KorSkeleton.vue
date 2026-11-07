<script setup lang="ts">
/** Kor 骨架屏（对应 Koring ui/skeleton.tsx）。 */
const props = withDefaults(
  defineProps<{ width?: string | number; height?: string | number; radius?: string }>(),
  { width: '100%', height: 16 }
)

function size(v: string | number) {
  return typeof v === 'number' ? `${v}px` : v
}
</script>

<template>
  <div
    class="kor-skeleton"
    :style="{ width: size(props.width), height: size(props.height), borderRadius: props.radius }"
  />
</template>

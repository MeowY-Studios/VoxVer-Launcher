<script setup lang="ts">
/** Kor 空态（对应 Koring ui/empty.tsx）：虚线框 + 标题/描述 + 动作插槽。 */
withDefaults(defineProps<{ title?: string; desc?: string }>(), { title: '' })
</script>

<template>
  <div class="kor-empty">
    <slot name="icon" />
    <p v-if="title" class="kor-empty__title">{{ title }}</p>
    <p v-if="desc" class="kor-empty__desc">{{ desc }}</p>
    <div v-if="$slots.default" class="kor-empty__action">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.kor-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 28px 16px;
  text-align: center;
}

.kor-empty__title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--voxver-text-secondary);
}

.kor-empty__desc {
  margin: 0;
  font-size: 12.5px;
  color: var(--voxver-text-tertiary);
}

.kor-empty__action {
  margin-top: 8px;
}
</style>

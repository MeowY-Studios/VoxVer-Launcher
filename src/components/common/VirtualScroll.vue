<template>
  <div
    class="virtual-scroll-container"
    ref="containerRef"
    @scroll="handleScroll"
  >
    <!-- 空状态 -->
    <div v-if="!items.length" class="virtual-scroll-empty">
      {{ $t('common.noData') }}
    </div>

    <!-- 顶部占位 -->
    <div v-else :style="{ height: topPadding + 'px' }"></div>

    <!-- 可见区域的项目 -->
    <div v-if="items.length" class="virtual-scroll-items">
      <slot
        v-for="(item, index) in visibleItems"
        :item="item"
        :index="startIndex + index"
        :key="getItemKey(item, startIndex + index)"
        name="item"
      >
        <div class="virtual-scroll-item" :style="{ height: itemHeight + 'px' }">
          {{ getItemKey(item, startIndex + index) }}
        </div>
      </slot>
    </div>

    <!-- 底部占位 -->
    <div v-if="items.length" :style="{ height: bottomPadding + 'px' }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'

interface Props {
  items: Record<string, unknown>[]
  itemHeight?: number
  overscan?: number
  getItemKey?: (item: Record<string, unknown>, index: number) => string | number
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 50,
  overscan: 5,
  getItemKey: (_item: Record<string, unknown>, index: number) => index
})

const emit = defineEmits<{
  (e: 'scroll', event: Event): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const containerHeight = ref(0)

const totalHeight = computed(() => props.items.length * props.itemHeight)

const startIndex = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight) - props.overscan
  return Math.max(0, start)
})

const endIndex = computed(() => {
  const visibleCount = Math.ceil(containerHeight.value / props.itemHeight) + props.overscan * 2
  const end = startIndex.value + visibleCount
  return Math.min(props.items.length, end)
})

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value)
})

const topPadding = computed(() => startIndex.value * props.itemHeight)

const bottomPadding = computed(() => {
  return Math.max(0, (props.items.length - endIndex.value) * props.itemHeight)
})

function handleScroll(event: Event) {
  if (!containerRef.value) return
  scrollTop.value = containerRef.value.scrollTop
  emit('scroll', event)
}

function updateContainerHeight() {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight
  }
}

function scrollToIndex(index: number, behavior: ScrollBehavior = 'smooth') {
  if (!containerRef.value) return
  const targetTop = index * props.itemHeight
  containerRef.value.scrollTo({ top: targetTop, behavior })
}

function scrollToTop() {
  if (!containerRef.value) return
  containerRef.value.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  updateContainerHeight()
  window.addEventListener('resize', updateContainerHeight)
})

watch(
  () => props.items.length,
  () => {
    nextTick(() => updateContainerHeight())
  }
)

defineExpose({
  scrollToIndex,
  scrollToTop,
  containerRef
})
</script>

<style scoped>
.virtual-scroll-container {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.virtual-scroll-items {
  position: relative;
}

.virtual-scroll-item {
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid var(--voxver-border-color);
  box-sizing: border-box;
}

.virtual-scroll-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--voxver-text-muted);
  font-size: 13px;
}
</style>

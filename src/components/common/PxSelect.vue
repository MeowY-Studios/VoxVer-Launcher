<template>
  <div class="px-select" ref="selectRef">
    <button
      class="px-select__trigger"
      :class="{ 'px-select__trigger--open': isOpen }"
      @click="toggle"
      type="button"
    >
      <span class="px-select__value">{{ selectedLabel }}</span>
      <svg class="px-select__arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
    <!-- 下拉面板传送到 body，避免被 overflow/滚动容器裁剪 -->
    <Teleport to="body">
      <Transition name="px-select">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="px-select__dropdown"
          :style="dropdownStyle"
        >
          <button
            v-for="opt in options"
            :key="opt.value"
            class="px-select__option"
            :class="{ 'px-select__option--selected': opt.value === modelValue }"
            :disabled="opt.disabled"
            @click="select(opt.value)"
            type="button"
          >
            {{ opt.label }}
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

const props = defineProps<{
  modelValue: string
  options: SelectOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const selectRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownPos = ref({ top: 0, left: 0, width: 0 })

const selectedLabel = computed(() => {
  const found = props.options.find((o) => o.value === props.modelValue)
  return found?.label || props.modelValue
})

/** 下拉面板定位到触发按钮下方（固定定位，避免被容器裁剪） */
const dropdownStyle = computed(() => ({
  top: `${dropdownPos.value.top}px`,
  left: `${dropdownPos.value.left}px`,
  width: `${dropdownPos.value.width}px`
}))

function updateDropdownPos(): void {
  const trigger = selectRef.value
  if (!trigger) return
  const rect = trigger.getBoundingClientRect()
  dropdownPos.value = {
    top: rect.bottom + 4,
    left: rect.left,
    width: rect.width
  }
}

async function toggle(): Promise<void> {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await nextTick()
    updateDropdownPos()
  }
}

function select(value: string): void {
  emit('update:modelValue', value)
  isOpen.value = false
}

function onClickOutside(e: MouseEvent): void {
  const target = e.target as Node
  if (selectRef.value && selectRef.value.contains(target)) return
  if (dropdownRef.value && dropdownRef.value.contains(target)) return
  isOpen.value = false
}

function onViewportChange(): void {
  if (isOpen.value) updateDropdownPos()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  window.addEventListener('resize', onViewportChange)
  window.addEventListener('scroll', onViewportChange, true)
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
})

// 选项或选中值变化时保持面板位置准确
watch(() => props.options, () => {
  if (isOpen.value) void nextTick(updateDropdownPos)
}, { deep: true })
</script>

<style scoped>
.px-select {
  position: relative;
  width: 100%;
}

.px-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  background: var(--voxver-bg-input);
  color: var(--voxver-text-primary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  transition: border-color var(--voxver-transition-fast);
}
.px-select__trigger:hover {
  border-color: var(--voxver-border-strong);
}
.px-select__trigger--open {
  border-color: var(--voxver-accent);
}

.px-select__arrow {
  flex-shrink: 0;
  color: var(--voxver-text-muted);
  transition: transform var(--voxver-transition-fast);
}
.px-select__trigger--open .px-select__arrow {
  transform: rotate(180deg);
}
</style>

<!-- 下拉面板被 Teleport 到 body，需用非 scoped 样式 -->
<style>
.px-select__dropdown {
  position: fixed;
  background: var(--voxver-bg-elevated);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  box-shadow: var(--voxver-shadow-lg);
  z-index: var(--voxver-z-dropdown);
  overflow: hidden;
  max-height: 200px;
  overflow-y: auto;
}

.px-select__option {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  color: var(--voxver-text-secondary);
  font-size: 13px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background var(--voxver-transition-fast), color var(--voxver-transition-fast);
}
.px-select__option:hover {
  background: var(--voxver-bg-hover);
  color: var(--voxver-text-primary);
}
.px-select__option--selected {
  color: var(--voxver-accent);
  background: color-mix(in oklab, var(--voxver-accent) 8%, transparent);
}
.px-select__option:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.px-select__option:disabled:hover {
  background: none;
  color: var(--voxver-text-secondary);
}

/* Transition */
.px-select-enter-active {
  transition: opacity var(--voxver-transition-fast) var(--voxver-ease-out-quart),
              transform var(--voxver-transition-fast) var(--voxver-ease-out-quart);
}
.px-select-leave-active {
  transition: opacity var(--voxver-transition-fast) ease-in,
              transform var(--voxver-transition-fast) ease-in;
}
.px-select-enter-from,
.px-select-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

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
    <Transition name="px-select">
      <div v-if="isOpen" class="px-select__dropdown">
        <button
          v-for="opt in options"
          :key="opt.value"
          class="px-select__option"
          :class="{ 'px-select__option--selected': opt.value === modelValue }"
          @click="select(opt.value)"
          type="button"
        >
          {{ opt.label }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface SelectOption {
  label: string
  value: string
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

const selectedLabel = computed(() => {
  const found = props.options.find((o) => o.value === props.modelValue)
  return found?.label || props.modelValue
})

function toggle() {
  isOpen.value = !isOpen.value
}

function select(value: string) {
  emit('update:modelValue', value)
  isOpen.value = false
}

function onClickOutside(e: MouseEvent) {
  if (selectRef.value && !selectRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
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

.px-select__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
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

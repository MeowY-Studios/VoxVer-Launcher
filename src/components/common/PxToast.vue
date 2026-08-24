<template>
  <Transition name="px-toast">
    <div v-if="visible" :class="['px-toast', `px-toast--${type}`]" role="status" :aria-live="'polite'">
      <!-- Icon -->
      <svg v-if="type === 'success'" class="px-toast__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <svg v-else-if="type === 'error'" class="px-toast__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <svg v-else-if="type === 'warning'" class="px-toast__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <svg v-else class="px-toast__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>

      <span class="px-toast__message">{{ message }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

export interface PxToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

const props = withDefaults(defineProps<PxToastProps>(), {
  type: 'info',
  duration: 2500
})

const emit = defineEmits<{
  done: []
}>()

const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  visible.value = true
  if (props.duration > 0) {
    timer = setTimeout(() => {
      visible.value = false
      setTimeout(() => emit('done'), 300)
    }, props.duration)
  }
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style scoped>
.px-toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--voxver-z-toast-top);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: var(--voxver-radius-full);
  font-size: var(--voxver-text-sm);
  font-weight: 500;
  box-shadow: var(--voxver-shadow-lg);
  pointer-events: none;
  white-space: nowrap;
  max-width: 90vw;
}

.px-toast--success {
  background: color-mix(in oklab, var(--voxver-success) 12%, var(--voxver-bg-elevated));
  border: 1px solid color-mix(in oklab, var(--voxver-success) 25%, transparent);
  color: var(--voxver-success);
}
.px-toast--error {
  background: color-mix(in oklab, var(--voxver-error) 12%, var(--voxver-bg-elevated));
  border: 1px solid color-mix(in oklab, var(--voxver-error) 25%, transparent);
  color: var(--voxver-error);
}
.px-toast--warning {
  background: color-mix(in oklab, var(--voxver-warning) 12%, var(--voxver-bg-elevated));
  border: 1px solid color-mix(in oklab, var(--voxver-warning) 25%, transparent);
  color: var(--voxver-warning);
}
.px-toast--info {
  background: color-mix(in oklab, var(--voxver-accent) 12%, var(--voxver-bg-elevated));
  border: 1px solid color-mix(in oklab, var(--voxver-accent) 25%, transparent);
  color: var(--voxver-accent);
}

.px-toast__icon {
  flex-shrink: 0;
}

.px-toast__message {
  color: var(--voxver-text-primary);
}

/* Transition */
.px-toast-enter-active {
  transition:
    opacity var(--voxver-transition-normal) var(--voxver-ease-out-quart),
    transform var(--voxver-transition-normal) var(--voxver-ease-out-quart);
}
.px-toast-leave-active {
  transition:
    opacity var(--voxver-transition-fast) ease-in,
    transform var(--voxver-transition-fast) ease-in;
}
.px-toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}
.px-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>

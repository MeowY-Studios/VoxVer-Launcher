<template>
  <Transition name="px-modal">
    <div class="px-confirm-overlay" @click.self="onCancel">
      <div class="px-confirm" role="alertdialog" :aria-modal="true" tabindex="-1">
        <!-- Icon -->
        <div :class="['px-confirm__icon', `px-confirm__icon--${type}`]">
          <svg v-if="type === 'danger'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <svg v-else-if="type === 'warning'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>

        <!-- Content -->
        <div class="px-confirm__content">
          <h3 class="px-confirm__title">{{ title }}</h3>
          <p class="px-confirm__message">{{ message }}</p>
        </div>

        <!-- Actions -->
        <div class="px-confirm__actions">
          <button class="vox-btn vox-btn--secondary px-confirm__btn" @click="onCancel">
            {{ cancelText }}
          </button>
          <button
            :class="['vox-btn px-confirm__btn', type === 'danger' ? 'px-confirm__btn--danger' : 'vox-btn--primary']"
            @click="onConfirm"
            ref="confirmBtnRef"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

export interface PxConfirmProps {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

withDefaults(defineProps<PxConfirmProps>(), {
  confirmText: 'OK',
  cancelText: 'Cancel',
  type: 'danger'
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const confirmBtnRef = ref<HTMLElement | null>(null)

function onConfirm() {
  emit('confirm')
}

function onCancel() {
  emit('cancel')
}

onMounted(() => {
  document.body.style.overflow = 'hidden'
  confirmBtnRef.value?.focus()
})
</script>

<style scoped>
.px-confirm-overlay {
  position: fixed;
  inset: 0;
  background: var(--voxver-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--voxver-z-confirm);
  padding: 16px;
  backdrop-filter: blur(3px);
}

.px-confirm {
  background: color-mix(in oklab, var(--voxver-bg-elevated) 92%, transparent);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-lg);
  width: 100%;
  max-width: 380px;
  padding: 24px;
  box-shadow: var(--voxver-shadow-xl);
  outline: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
}

.px-confirm__icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.px-confirm__icon--danger {
  background: color-mix(in oklab, var(--voxver-error) 15%, transparent);
  color: var(--voxver-error);
}
.px-confirm__icon--warning {
  background: color-mix(in oklab, var(--voxver-warning) 15%, transparent);
  color: var(--voxver-warning);
}
.px-confirm__icon--info {
  background: color-mix(in oklab, var(--voxver-accent) 15%, transparent);
  color: var(--voxver-accent);
}

.px-confirm__content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.px-confirm__title {
  font-size: var(--voxver-text-lg);
  font-weight: var(--voxver-font-semibold);
  color: var(--voxver-text-primary);
  margin: 0;
}

.px-confirm__message {
  font-size: var(--voxver-text-sm);
  color: var(--voxver-text-secondary);
  margin: 0;
  line-height: 1.5;
  white-space: pre-line;
}

.px-confirm__actions {
  display: flex;
  gap: 10px;
  width: 100%;
  margin-top: 4px;
}

.px-confirm__btn {
  flex: 1;
  justify-content: center;
}

.px-confirm__btn--danger {
  background: var(--voxver-error);
  color: oklch(100% 0 0);
  border: none;
  border-radius: var(--voxver-radius-full);
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--voxver-transition-fast);
}
.px-confirm__btn--danger:hover {
  background: color-mix(in oklab, var(--voxver-error) 85%, white);
}

/* Transitions */
.px-modal-enter-active,
.px-modal-leave-active {
  transition: opacity var(--voxver-transition-normal) var(--voxver-ease-out-quart);
}
.px-modal-enter-active .px-confirm,
.px-modal-leave-active .px-confirm {
  transition:
    transform var(--voxver-transition-normal) var(--voxver-ease-out-quart),
    opacity var(--voxver-transition-normal) var(--voxver-ease-out-quart);
}
.px-modal-enter-from,
.px-modal-leave-to {
  opacity: 0;
}
.px-modal-enter-from .px-confirm {
  transform: scale(0.92) translateY(12px);
  opacity: 0;
}
.px-modal-leave-to .px-confirm {
  transform: scale(0.92) translateY(12px);
  opacity: 0;
}
</style>

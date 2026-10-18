<template>
  <Transition name="px-modal">
    <div class="px-confirm-overlay" @click.self="onCancel">
      <div class="px-confirm" role="alertdialog" :aria-modal="true" tabindex="-1">
        <!-- Title（左上角） -->
        <h3 class="px-confirm__title">{{ title }}</h3>

        <!-- Message（主内容，居中放大） -->
        <p class="px-confirm__message">{{ message }}</p>

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
import type { PxConfirmProps } from './PxConfirm.types'

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
  align-items: stretch;
  gap: 16px;
}

.px-confirm__title {
  font-size: var(--voxver-text-lg);
  font-weight: var(--voxver-font-semibold);
  color: var(--voxver-text-primary);
  margin: 0;
  text-align: left;
}

.px-confirm__message {
  font-size: var(--voxver-text-lg);
  color: var(--voxver-text-primary);
  margin: 0;
  line-height: 1.6;
  white-space: pre-line;
  text-align: center;
  padding: 12px 0;
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
  border-radius: var(--voxver-radius-md);
}

.px-confirm__btn--danger {
  background: var(--voxver-error);
  color: oklch(100% 0 0);
  border: none;
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

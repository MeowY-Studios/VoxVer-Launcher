<template>
  <Teleport to="body">
    <Transition name="px-modal">
      <div v-if="visible" class="px-launch-progress-overlay" @click.self="handleOverlayClick">
        <div class="px-launch-progress-panel">
          <!-- 标题栏 — 同 PxModal 风格 -->
          <div class="panel-header">
            <div class="panel-title-group">
              <span class="panel-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </span>
              <h3 class="panel-title">{{ $t('component.launchProgressLaunching') }}</h3>
              <span class="panel-version">{{ versionId }}</span>
            </div>
            <button class="panel-close" @click="handleClose" :aria-label="$t('component.closeBtn')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- 进度阶段列表（逐个显示） -->
          <div class="phase-list">
            <TransitionGroup name="phase">
              <div
                v-for="(step, idx) in visiblePhases"
                :key="step.id"
                class="phase-item"
                :class="{
                  active: step.id === phase,
                  done: step.done,
                  error: step.id === phase && phase === 'error'
                }"
              >
                <span class="phase-icon">
                  <template v-if="step.done">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  </template>
                  <template v-else-if="step.id === phase && phase === 'error'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </template>
                  <template v-else-if="step.id === phase">
                    <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
                  </template>
                  <template v-else>
                    <span class="phase-num">{{ idx + 1 }}</span>
                  </template>
                </span>
                <span class="phase-label">{{ step.label }}</span>
                <span class="phase-detail" v-if="step.id === phase">{{ detail || step.detail }}</span>
              </div>
            </TransitionGroup>
          </div>

          <!-- 实时日志（仅运行阶段可展开） -->
          <div class="log-area" v-if="phase === 'running'">
            <div class="log-header" @click="showLog = !showLog">
              <span>{{ showLog ? $t('component.launchProgressCollapseLog') : $t('component.launchProgressExpandLog') }}</span>
            </div>
            <pre v-if="showLog" class="log-content">{{ logBuffer }}</pre>
          </div>

          <!-- 底部按钮 -->
          <div class="panel-footer" v-if="phase === 'running'">
            <button class="px-btn px-btn-sm" @click="$emit('openLog')">{{ $t('component.launchProgressViewFullLog') }}</button>
          </div>
          <div class="panel-footer" v-if="phase === 'error'">
            <button
              class="px-btn px-btn-sm px-btn-danger"
              @click="$emit('showError', errorMessage)"
            >
                {{ $t('component.launchProgressViewError') }}
              </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  versionId?: string
}>()

const emit = defineEmits<{
  openLog: []
  showError: [msg: string]
}>()

const visible = ref(false)
const phase = ref<LaunchPhase>('idle')
const message = ref('')
const detail = ref('')
const logBuffer = ref('')
const showLog = ref(false)
const errorMessage = ref('')

type LaunchPhase =
  | 'idle'
  | 'building-config'
  | 'validating-java'
  | 'checking-files'
  | 'downloading-files'
  | 'launching-process'
  | 'running'
  | 'error'

interface PhaseDef {
  id: LaunchPhase
  label: string
  detail: string
  done: boolean
}

const phases = ref<PhaseDef[]>([
  { id: 'building-config', label: t('component.launchProgressBuildConfig'), detail: t('component.launchProgressBuildingConfig'), done: false },
  { id: 'checking-files', label: t('component.launchProgressCheckFiles'), detail: t('component.launchProgressCheckingFiles'), done: false },
  { id: 'downloading-files', label: t('component.launchProgressDownloadFiles'), detail: t('component.launchProgressDownloadingFiles'), done: false },
  { id: 'validating-java', label: t('component.launchProgressValidateJava'), detail: t('component.launchProgressValidatingJava'), done: false },
  { id: 'launching-process', label: t('component.launchProgressLaunchProcess'), detail: t('component.launchProgressLaunchingProcess'), done: false },
  { id: 'running', label: t('component.launchProgressGameRunning'), detail: t('component.launchProgressGameLaunched'), done: false }
])

// 只显示已完成 + 当前进行中的阶段，不预显示未来的阶段
const visiblePhases = computed(() => {
  if (phase.value === 'idle') return []
  return phases.value.filter((p) => p.done || p.id === phase.value)
})



// * 清理函数引用
let cleanupProgress: (() => void) | null = null
let cleanupLog: (() => void) | null = null
let cleanupExit: (() => void) | null = null

function resetPhases() {
  phases.value.forEach((p) => {
    p.done = false
  })
}

onMounted(() => {
  const api = window.electronAPI
  if (!api?.game) return

  // * 监听进度
  if (api.game.onProgress) {
    cleanupProgress = api.game.onProgress(
      (data: unknown) => {
        const d = data as { phase: LaunchPhase; message: string; detail?: string }
        const { phase: newPhase, message: msg, detail: det } = d

        if (newPhase === 'idle') {
          visible.value = false
          resetPhases()
          return
        }

        if (newPhase === 'error') {
          phase.value = 'error'
          errorMessage.value = msg || t('component.launchProgressLaunchFailed')
          message.value = msg
          detail.value = det || ''
          visible.value = true
          return
        }

        // 标记已完成阶段        
        const phaseOrder: LaunchPhase[] = [
          'building-config',
          'checking-files',
          'downloading-files',
          'validating-java',
          'launching-process',
          'running'
        ]
        const currentIdx = phaseOrder.indexOf(newPhase)
        phases.value.forEach((p, idx) => {
          const pIdx = phaseOrder.indexOf(p.id)
          p.done = pIdx < currentIdx
        })

        // 如果回到前面阶段（如 checking-files / downloading-files 被调用多次），重置后面的
        if (newPhase === 'checking-files' || newPhase === 'downloading-files') {
          phases.value.forEach((p) => {
            if (p.id !== newPhase) p.done = false
          })
        }

        phase.value = newPhase
        message.value = msg
        detail.value = det || ''
        visible.value = true

        // 游戏成功启动后，延迟 2s 自动关闭面板
        if (newPhase === 'running') {
          setTimeout(() => {
            visible.value = false
            resetPhases()
          }, 2000)
        }
      }
    )
  }

  // * 监听日志
  if (api.game.onLog) {
    cleanupLog = api.game.onLog((data: string | { text?: string; level?: string }) => {
      // onLog 可能返回 string 或 { text, level } 对象
      const text = typeof data === 'string' ? data : data?.text ?? ''
      if (!text) return
      logBuffer.value += text
      if (logBuffer.value.length > 50000) {
        logBuffer.value = logBuffer.value.slice(-30000)
      }
    })
  }

  // 监听退出
  if (api.game.onExit) {
    cleanupExit = api.game.onExit(
      (data: { code: number; signal: string | null; instanceId?: string }) => {
        // 退出后延迟关闭面板，让用户看到完成状态
        setTimeout(() => {
          visible.value = false
          resetPhases()
        }, data.code === 0 || data.code === null ? 1500 : 0)
      }
    )
  }
})

onUnmounted(() => {
  cleanupProgress?.()
  cleanupLog?.()
  cleanupExit?.()
  document.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && (phase.value === 'error' || phase.value === 'idle')) {
    visible.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

function handleOverlayClick() {
  visible.value = false
}

function handleClose() {
  visible.value = false
}

defineExpose({
  open: () => {
    visible.value = true
    resetPhases()
    phase.value = 'building-config'
  }
})
</script>

<style scoped>
/* ===== Overlay — 同 PxModal ===== */
.px-launch-progress-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--voxver-z-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--voxver-bg-overlay);
  backdrop-filter: blur(3px);
  padding: 16px;
}

/* ===== Dialog — 同 PxModal 风格 ===== */
.px-launch-progress-panel {
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-lg);
  width: 100%;
  max-width: 400px;
  box-shadow: var(--voxver-shadow-xl);
  overflow: hidden;
}

/* ===== Header ===== */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 0;
  gap: 8px;
}

.panel-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.panel-icon {
  color: var(--voxver-primary);
  animation: pulse 1.2s infinite;
  flex-shrink: 0;
}

.panel-title {
  font-size: var(--voxver-text-lg);
  font-weight: var(--voxver-font-semibold);
  color: var(--voxver-text-primary);
  margin: 0;
}

.panel-version {
  font-size: var(--voxver-text-xs);
  color: var(--voxver-text-tertiary);
  flex-shrink: 0;
}

.panel-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: var(--voxver-text-tertiary);
  border-radius: var(--voxver-radius-sm);
  cursor: pointer;
  transition: all var(--voxver-transition-fast);
  padding: 0;
  flex-shrink: 0;
}
.panel-close:hover {
  background: var(--voxver-bg-tertiary);
  color: var(--voxver-text-primary);
}

/* ===== Body ===== */
.phase-list {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.phase-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--voxver-radius-sm);
  font-size: var(--voxver-text-sm);
  color: var(--voxver-text-secondary);
  transition: all 0.2s;
}

.phase-item.active {
  color: var(--voxver-text-primary);
  background: color-mix(in oklab, var(--voxver-primary) 8%, transparent);
}

.phase-item.done {
  color: var(--voxver-text-tertiary);
}

.phase-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.phase-item.done .phase-icon {
  color: var(--voxver-success);
}

.phase-item.active .phase-icon {
  color: var(--voxver-primary);
}

.phase-item.error .phase-icon {
  color: var(--voxver-danger);
}

.phase-num {
  font-size: var(--voxver-text-xs);
  color: var(--voxver-text-tertiary);
}

.phase-label {
  flex: 0 0 auto;
  white-space: nowrap;
}

.phase-detail {
  margin-left: auto;
  font-size: var(--voxver-text-xs);
  color: var(--voxver-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.spinner {
  animation: spin 1s linear infinite;
}

/* ===== Log area ===== */
.log-area {
  border-top: 1px solid var(--voxver-border-color);
}

.log-header {
  padding: 8px 20px;
  font-size: var(--voxver-text-xs);
  color: var(--voxver-primary);
  cursor: pointer;
  text-align: right;
}
.log-header:hover {
  text-decoration: underline;
}

.log-content {
  max-height: 150px;
  overflow-y: auto;
  padding: 8px 12px;
  font-size: 11px;
  color: var(--voxver-text-muted);
  background: var(--voxver-bg-primary);
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

/* ===== Footer ===== */
.panel-footer {
  padding: 0 20px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.px-btn {
  padding: 6px 14px;
  font-size: var(--voxver-text-sm);
  font-family: inherit;
  border: 1px solid var(--voxver-primary);
  background: transparent;
  color: var(--voxver-primary);
  cursor: pointer;
  border-radius: var(--voxver-radius-sm);
  transition: all var(--voxver-transition-fast);
}
.px-btn:hover {
  background: var(--voxver-primary);
  color: #fff;
}
.px-btn-sm {
  padding: 4px 10px;
  font-size: var(--voxver-text-xs);
}
.px-btn-danger {
  border-color: var(--voxver-danger);
  color: var(--voxver-danger);
}
.px-btn-danger:hover {
  background: var(--voxver-danger);
  color: #fff;
}

/* ===== Transition — 同 PxModal ===== */
.px-modal-enter-active,
.px-modal-leave-active {
  transition: opacity 0.2s ease;
}
.px-modal-enter-active .px-launch-progress-panel,
.px-modal-leave-active .px-launch-progress-panel {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}
.px-modal-enter-from,
.px-modal-leave-to {
  opacity: 0;
}
.px-modal-enter-from .px-launch-progress-panel {
  transform: scale(0.94) translateY(8px);
  opacity: 0;
}
.px-modal-leave-to .px-launch-progress-panel {
  transform: scale(0.94) translateY(8px);
  opacity: 0;
}

/* ===== Phase list transition ===== */
.phase-enter-active {
  transition: all 0.3s ease-out;
}
.phase-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.phase-enter-to {
  opacity: 1;
  transform: translateY(0);
}


</style>

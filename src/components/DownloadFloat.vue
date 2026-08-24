<template>
  <Teleport to="body">
    <Transition name="float">
      <div v-if="store.showFloatPanel && hasAny" class="float-panel">
        <!-- 头部 -->
        <div class="fp-header">
          <span class="fp-title">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {{ $t('download.downloadManager') }}
            <span v-if="activeCount > 0" class="fp-badge">{{ activeCount }}</span>
          </span>
          <div class="fp-actions">
            <button
              class="fp-btn"
              @click="clearCompleted"
              :title="$t('download.clearCompleted')"
              v-if="completedCount > 0"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="3 6 5 6 21 6" />
                <path
                  d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                />
              </svg>
            </button>
            <button class="fp-btn" @click="openManager" :title="$t('component.viewDetails')">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </button>
            <button class="fp-btn fp-close" @click="close" :title="$t('common.close')">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 任务列表 -->
        <div class="fp-tasks">
          <!-- 无任务时 -->
          <div v-if="allTasks.length === 0" class="fp-empty">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <p>{{ $t('component.noDownloadTasks') }}</p>
          </div>

          <!-- 进行中的任务 -->
          <div v-for="task in activeTasks" :key="task.id" class="fp-task fp-task-active">
            <div class="fp-task-info">
              <div class="fp-task-name">{{ task.name }}</div>
              <div class="fp-task-meta">
                <span class="fp-phase">{{ task.phaseLabel }}</span>
                <span v-if="task.speed > 0" class="fp-speed">{{ formatSpeed(task.speed) }}</span>
              </div>
            </div>
            <div class="fp-bar-wrap">
              <div class="fp-bar" :style="{ width: task.progress + '%' }"></div>
            </div>
            <div class="fp-task-footer">
              <span class="fp-pct">{{ task.progress }}%</span>
              <button class="fp-cancel-btn" @click="cancelDownload(task.id)" :title="$t('common.cancel')">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 已完成的任务 -->
          <div
            v-for="task in completedTasks"
            :key="task.id + '-done'"
            class="fp-task fp-task-done fp-task-ok"
          >
            <div class="fp-task-name">{{ task.name }}</div>
            <div class="fp-task-phase">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {{ $t('download.completed') }}
              </div>
              <button class="fp-task-dismiss" @click="dismiss(task.id)">{{ $t('component.remove') }}</button>
          </div>

          <!-- 失败的任务 -->
          <div
            v-for="task in failedTasks"
            :key="task.id + '-err'"
            class="fp-task fp-task-done fp-task-err"
          >
            <div class="fp-task-name">{{ task.name }}</div>
            <div class="fp-task-phase">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {{ $t('download.failed') }}
              </div>
              <button class="fp-task-dismiss" @click="dismiss(task.id)">{{ $t('component.remove') }}</button>
          </div>
        </div>

        <!-- 底部：查看详情 -->
        <button class="fp-view-all" @click="openManager">{{ $t('component.viewDetails') }} →</button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDownloadStore } from '../stores/download.store'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()
const store = useDownloadStore()

const allTasks = computed(() => Array.from(store.versionTasks.values()))

const hasAny = computed(() => allTasks.value.length > 0)
const activeCount = computed(
  () => allTasks.value.filter((t) => t.phase !== 'completed' && t.phase !== 'failed').length
)
const completedCount = computed(
  () => allTasks.value.filter((t) => t.phase === 'completed' || t.phase === 'failed').length
)

const activeTasks = computed(() =>
  allTasks.value.filter((t) => t.phase !== 'completed' && t.phase !== 'failed')
)

const completedTasks = computed(() => allTasks.value.filter((t) => t.phase === 'completed'))
const failedTasks = computed(() => allTasks.value.filter((t) => t.phase === 'failed'))

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec > 1024 * 1024) return (bytesPerSec / 1024 / 1024).toFixed(1) + ' MB/s'
  if (bytesPerSec > 1024) return (bytesPerSec / 1024).toFixed(1) + ' KB/s'
  return bytesPerSec + ' B/s'
}

function openManager() {
  store.showFloatPanel = false
  router.push('/download/manage')
}

function close() {
  store.showFloatPanel = false
}

function dismiss(versionId: string) {
  store.removeVersionTask(versionId)
}

function clearCompleted() {
  completedTasks.value.forEach((t) => store.removeVersionTask(t.id))
  failedTasks.value.forEach((t) => store.removeVersionTask(t.id))
}

async function cancelDownload(id: string) {
  await window.electronAPI?.download?.cancelDownload?.(id)
  store.removeVersionTask(id)
}

// 进入下载管理页面时自动隐藏浮动面板
watch(
  () => route.path,
  (path) => {
    if (path === '/download/manage') {
      store.showFloatPanel = false
    }
  }
)
</script>

<style scoped>
.float-panel {
  position: fixed;
  top: 54px;
  right: 12px;
  width: 300px;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 97%, transparent);
  border: 1px solid var(--voxver-border-color-light);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgb(0 0 0 / 0.5);
  z-index: var(--voxver-z-overlay);
  backdrop-filter: blur(12px);
}

.fp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--voxver-border-color);
}

.fp-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--voxver-primary);
}

.fp-actions {
  display: flex;
  gap: 4px;
}

.fp-btn {
  width: 24px;
  height: 24px;
  border-radius: var(--voxver-radius-sm);
  border: none;
  background: var(--voxver-bg-hover);
  color: var(--voxver-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.fp-btn:hover {
  background: var(--voxver-bg-hover);
  color: var(--voxver-text-primary);
}
.fp-close:hover {
  background: rgb(239 68 68 / 0.2);
  color: var(--voxver-error);
}

.fp-tasks {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.fp-task {
  padding: 10px;
  background: var(--voxver-bg-hover);
  border-radius: var(--voxver-radius-md);
}

.fp-task-done {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.fp-task-ok {
  border-left: 2px solid var(--voxver-success);
}
.fp-task-err {
  border-left: 2px solid var(--voxver-error);
}

.fp-task-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--voxver-text-primary);
  margin-bottom: 2px;
}

.fp-task-phase {
  font-size: 11px;
  color: var(--voxver-text-tertiary);
  margin-bottom: 6px;
}

.fp-bar-wrap {
  height: 6px;
  background: var(--voxver-bg-hover);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}
.fp-bar {
  height: 100%;
  background: var(--voxver-primary);
  border-radius: 2px;
  transition: width 0.4s ease;
}
.fp-task-ok .fp-bar {
  background: var(--voxver-success);
}
.fp-task-err .fp-bar {
  background: var(--voxver-error);
  width: 100% !important;
}

.fp-task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fp-pct {
  font-size: 11px;
  font-weight: 600;
  color: var(--voxver-text-secondary);
}
.fp-speed {
  font-size: 10px;
  color: var(--voxver-text-muted);
}

.fp-task-dismiss {
  font-size: 10px;
  background: var(--voxver-bg-hover);
  border: none;
  color: var(--voxver-text-muted);
  padding: 2px 8px;
  border-radius: var(--voxver-radius-xs);
  cursor: pointer;
  flex-shrink: 0;
}
.fp-task-dismiss:hover {
  color: var(--voxver-text-secondary);
}

.fp-view-all {
  display: block;
  width: 100%;
  padding: 10px;
  background: color-mix(in oklab, var(--voxver-primary) 8%, transparent);
  border: none;
  border-top: 1px solid var(--voxver-border-color);
  color: var(--voxver-primary);
  font-size: 12px;
  cursor: pointer;
  text-align: center;
  transition: background 0.2s;
}
.fp-view-all:hover {
  background: color-mix(in oklab, var(--voxver-primary) 14%, transparent);
}

/* ====== 增强样式 ====== */
.fp-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 5px;
  background: var(--voxver-primary);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: var(--voxver-radius-md);
  margin-left: 4px;
}

.fp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: var(--voxver-text-muted);
  font-size: 12px;

  p {
    margin: 0;
  }
  svg {
    opacity: 0.5;
  }
}

.fp-task-info {
  margin-bottom: 6px;
}

.fp-task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.fp-phase {
  font-size: 11px;
  color: var(--voxver-text-tertiary);
}

.fp-cancel-btn {
  width: 18px;
  height: 18px;
  border-radius: var(--voxver-radius-xs);
  border: none;
  background: var(--voxver-bg-hover);
  color: var(--voxver-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.fp-cancel-btn:hover {
  background: rgb(239 68 68 / 0.2);
  color: var(--voxver-error);
}

.fp-task-done {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.fp-task-done .fp-task-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  color: var(--voxver-text-secondary);
}

.fp-task-done .fp-task-phase {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  flex-shrink: 0;
}

.fp-task-ok .fp-task-phase {
  color: var(--voxver-success);
}
.fp-task-err .fp-task-phase {
  color: var(--voxver-error);
}

/* * 动画 */
.float-enter-active,
.float-leave-active {
  transition: all 0.25s ease;
}
.float-enter-from,
.float-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}
</style>

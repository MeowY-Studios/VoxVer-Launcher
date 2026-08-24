<template>
  <div class="download-queue">
    <!-- 队列头部 -->
    <div class="queue-header" v-if="showHeader">
      <h3>{{ $t('download.downloadQueue') }}</h3>
      <span class="queue-count" v-if="total > 0">{{ $t('component.taskCount', { n: total }) }}</span>
    </div>

    <!-- 空状态 -->
    <div v-if="tasks.length === 0" class="queue-empty">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--voxver-text-muted)" stroke-width="1.5">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
      <p>{{ $t('component.noDownloadTasks') }}</p>
    </div>

    <!-- 任务列表 -->
    <div v-else class="task-list">
      <div v-for="task in tasks" :key="task.id" class="task-item"
        :class="{ active: task.status === 'downloading', error: task.status === 'failed' }">
        <!-- 文件名 -->
        <span class="task-name">{{ task.fileName }}</span>

        <!-- 进度 -->
        <div class="progress-wrap">
          <div class="progress-bar">
            <div class="progress-fill" :class="{ animating: task.status === 'downloading' }"
              :style="{ width: `${task.progress}%` }"></div>
          </div>
          <span class="progress-text">{{ task.progress }}%</span>
        </div>

        <!-- 速度/状态 -->
        <span class="task-speed" v-if="task.status === 'downloading'">
          {{ formatSpeed(task.speed) }}
        </span>
        <span v-else class="task-status" :class="task.status">{{ statusLabel(task.status) }}</span>

        <!-- 操作 -->
        <button v-if="canCancel(task)" class="cancel-btn" @click="$emit('cancel', task.id)" :title="$t('common.cancel')">
          ×
        </button>
      </div>
    </div>

    <!-- 总进度（多任务时显示） -->
    <div v-if="tasks.length > 1 && overallProgress !== undefined" class="overall-progress">
      <span class="label">{{ $t('component.overallProgress') }}</span>
      <div class="overall-bar">
        <div class="overall-fill" :style="{ width: `${overallProgress}%` }"></div>
      </div>
      <span class="overall-pct">{{ overallProgress }}%</span>
      <span v-if="totalSpeed !== undefined" class="overall-speed">{{
        formatSpeed(totalSpeed)
      }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DownloadTask, DownloadStatus } from '../../types/download'
import { formatSpeed as fmtSpeed } from '../../utils/format'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  tasks: DownloadTask[]
  showHeader?: boolean
  overallProgress?: number
  totalSpeed?: number
}>()

defineEmits<{
  (e: 'cancel', taskId: string): void
}>()

const total = defineModel<number>('total', { default: 0 })

function statusLabel(status: DownloadStatus): string {
  const map: Record<DownloadStatus, string> = {
    pending: t('component.downloadStatusPending'),
    queued: t('component.downloadStatusQueued'),
    downloading: t('component.downloadStatusDownloading'),
    paused: t('component.downloadStatusPaused'),
    completed: t('component.downloadStatusCompleted'),
    failed: t('component.downloadStatusFailed'),
    cancelled: t('component.downloadStatusCancelled'),
    error: t('component.downloadStatusError')
  }
  return map[status] || status
}

function canCancel(task: DownloadTask): boolean {
  return ['pending', 'downloading', 'paused'].includes(task.status)
}

function formatSpeed(bytesPerSec: number): string {
  return fmtSpeed(bytesPerSec)
}
</script>

<style scoped lang="scss">
.download-queue {
  width: 100%;
}

.queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;

  h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--voxver-text-primary);
  }

  .queue-count {
    font-size: 12px;
    color: var(--voxver-text-muted);
  }
}

.queue-empty {
  text-align: center;
  padding: 36px 0;
  color: var(--voxver-text-muted);

  p {
    margin-top: 8px;
    font-size: 13px;
  }
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);

  &.active {
    border-color: var(--voxver-primary-300);
  }

  &.error {
    border-color: color-mix(in oklab, var(--voxver-error) 35%, transparent);
  }
}

.task-name {
  font-size: 13px;
  color: var(--voxver-text-primary);
  min-width: 140px;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;

  .progress-bar {
    flex: 1;
    height: 6px;
    background: var(--voxver-bg-hover);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--voxver-gradient-primary);
    border-radius: 3px;
    transition: width 0.2s ease;

    &.animating {
      animation: shimmer 1.5s ease-in-out infinite;
      background-size: 200% 100%;
    }
  }

  .progress-text {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--voxver-text-secondary);
    min-width: 34px;
    text-align: right;
  }
}

.task-speed,
.task-status {
  font-size: 11.5px;
  min-width: 70px;
  text-align: right;

  &.pending {
    color: var(--voxver-text-muted);
  }

  &.downloading {
    color: var(--voxver-primary-500);
  }

  &.paused {
    color: var(--voxver-warning);
  }

  &.completed {
    color: var(--voxver-success);
  }

  &.failed {
    color: var(--voxver-error);
  }
}

.cancel-btn {
  padding: 2px 8px;
  font-size: 16px;
  line-height: 1;
  background: transparent;
  border: none;
  color: var(--voxver-text-muted);
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.1s;

  &:hover {
    color: var(--voxver-error);
    background: color-mix(in oklab, var(--voxver-error) 8%, transparent);
  }
}

/* * 总进度条 */
.overall-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 14px;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);

  .label {
    font-size: 12px;
    color: var(--voxver-text-muted);
    white-space: nowrap;
  }

  .overall-bar {
    flex: 1;
    height: 8px;
    background: var(--voxver-bg-hover);
    border-radius: var(--voxver-radius-xs);
    overflow: hidden;
  }

  .overall-fill {
    height: 100%;
    background: var(--voxver-gradient-success);
    border-radius: var(--voxver-radius-xs);
    transition: width 0.25s;
  }

  .overall-pct {
    font-size: 12px;
    font-weight: 600;
    color: var(--voxver-text-secondary);
    min-width: 36px;
    text-align: right;
  }

  .overall-speed {
    font-size: 11.5px;
    color: var(--voxver-text-muted);
    min-width: 60px;
    text-align: right;
  }
}
</style>

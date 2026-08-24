<template>
  <div class="dm-page">
    <!-- 顶部导航 -->
    <div class="dm-header">
      <button class="back-btn" @click="goBack">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <h1 class="dm-title">{{ $t('download.downloadManager') }}</h1>
      <div class="header-actions">
        <button v-if="completedCount > 0" class="btn-clear vox-btn vox-btn--destructive" @click="clearCompleted">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
          {{ $t('download.clearCompleted') }}
        </button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="dm-toolbar">
      <div class="search-box">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input v-model="searchQuery" type="text" :placeholder="$t('download.searchTask')" class="search-input" />
      </div>

      <!-- 分类标签 -->
      <div class="filter-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="tab-btn"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
          <span class="tab-count" v-if="getTabCount(tab.value) > 0">{{
            getTabCount(tab.value)
          }}</span>
        </button>
      </div>
    </div>

    <!-- 下载统计 -->
    <div class="dm-stats">
      <div class="stat-item">
        <span class="stat-value">{{ totalCount }}</span>
        <span class="stat-label">{{ $t('download.totalTasks') }}</span>
      </div>
      <div class="stat-item downloading">
        <span class="stat-value">{{ downloadingCount }}</span>
        <span class="stat-label">{{ $t('download.downloading') }}</span>
      </div>
      <div class="stat-item completed">
        <span class="stat-value">{{ completedCount }}</span>
        <span class="stat-label">{{ $t('download.completed') }}</span>
      </div>
      <div class="stat-item failed">
        <span class="stat-value">{{ failedCount }}</span>
        <span class="stat-label">{{ $t('download.failed') }}</span>
      </div>
    </div>

    <!-- 活跃下载列表 -->
    <div class="dm-content">
      <template v-if="filteredTasks.length > 0">
        <div class="task-list">
          <div
            v-for="task in filteredTasks"
            :key="task.id"
            class="task-item"
            :class="{
              completed: task.phase === 'completed',
              failed: task.phase === 'failed',
              downloading: task.phase === 'downloading_json' || task.phase === 'downloading_jar'
            }"
          >
            <!-- 选择框 -->
            <label class="task-checkbox">
              <input type="checkbox" v-model="selectedTasks" :value="task.id" />
              <span class="checkmark"></span>
            </label>

            <!-- 图标 -->
            <div class="task-icon">
              <div v-if="task.phase === 'completed'" class="icon-circle success">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div v-else-if="task.phase === 'failed'" class="icon-circle error">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <div v-else class="icon-circle downloading">
                <svg
                  class="download-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
            </div>

            <!-- 中间：信息 -->
            <div class="task-info">
              <div class="task-header">
                <h3 class="task-name">{{ task.name }}</h3>
                <span class="task-size">{{ formatSize(task.totalSize) }}</span>
              </div>
              <div class="task-meta">
                <span class="task-phase-tag" :class="task.phase">
                  {{ task.phaseLabel }}
                </span>
                <span class="task-time">{{ formatTime(task._lastTime) }}</span>
              </div>
              <!-- 进度条 -->
              <div class="task-bar-wrap">
                <div class="task-bar" :style="{ width: task.progress + '%' }">
                  <div class="task-bar-glow" :style="{ width: task.progress + '%' }"></div>
                </div>
                <span class="task-progress-text">{{ task.progress }}%</span>
              </div>
            </div>

            <!-- 右侧：操作 -->
            <div class="task-actions">
              <div
                v-if="task.phase === 'downloading_json' || task.phase === 'downloading_jar'"
                class="speed-info"
              >
                <span class="speed-label">{{ formatSpeed(task.speed) }}</span>
                <span class="speed-status"
                  >{{ $t('download.remaining') }} {{ formatSize(task.totalSize - task.downloadedSize) }}</span
                >
              </div>
              <div v-else class="action-buttons">
                <button
                  v-if="task.phase === 'failed'"
                  class="btn-action retry"
                  @click="retryTask(task)"
                  :title="$t('download.retryDownload')"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M4 20v-6h6" />
                    <path d="M20.49 15a9 9 0 10-2.12 9.36L23 10" />
                  </svg>
                </button>
                <button
                  v-else-if="task.phase === 'completed'"
                  class="btn-action view"
                  @click="viewInstance(task)"
                  :title="$t('download.viewInstance')"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
                <button class="btn-action delete" @click="removeTask(task)" :title="$t('download.deleteTask')">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 无下载任务 -->
      <div v-else class="dm-empty">
        <div class="empty-icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--voxver-border-color)"
            stroke-width="1.5"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <h3>{{ $t('download.noDownloadTasks') }}</h3>
        <p>{{ $t('download.goToDownloadHint') }}</p>
        <button class="btn-go-download vox-btn vox-btn--primary" @click="goToDownloads">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {{ $t('download.goToDownload') }}
        </button>
      </div>
    </div>

    <!-- 底部操作栏（选中时显示） -->
    <div v-if="selectedTasks.length > 0" class="dm-selection-bar">
      <div class="selection-info">
        <span>{{ $t('download.selectedTasks', { count: selectedTasks.length }) }}</span>
      </div>
      <div class="selection-actions">
        <button class="btn-selection" @click="cancelSelection">{{ $t('common.cancel') }}</button>
        <button class="btn-selection danger" @click="deleteSelected">{{ $t('download.deleteSelected') }}</button>
      </div>
    </div>

    <!-- 底部提示 -->
    <div v-else class="dm-footer">
      <p>{{ $t('download.downloadInBackground') }}</p>
      <button class="btn-back-bg" @click="goBackToHome">{{ $t('download.backToHome') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDownloadStore } from '../stores/download.store'
import type { VersionDownloadTask } from '../types/download'

const router = useRouter()
const { t } = useI18n()
const downloadStore = useDownloadStore()

const searchQuery = ref('')
const activeTab = ref('all')
const selectedTasks = ref<string[]>([])

const tabs = computed(() => [
  { label: t('download.all'), value: 'all' },
  { label: t('download.downloading'), value: 'downloading' },
  { label: t('download.completed'), value: 'completed' },
  { label: t('download.failed'), value: 'failed' }
])

const tasks = computed(() => Array.from(downloadStore.versionTasks.values()))

const filteredTasks = computed(() => {
  let result = tasks.value

  // * 按标签筛选
  if (activeTab.value !== 'all') {
    if (activeTab.value === 'downloading') {
      result = result.filter(
        (task) => task.phase === 'downloading_json' || task.phase === 'downloading_jar'
      )
    } else {
      result = result.filter((task) => task.phase === activeTab.value)
    }
  }

  // * 搜索筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((task) => task.name.toLowerCase().includes(query))
  }

  return result
})

const totalCount = computed(() => tasks.value.length)
const downloadingCount = computed(
  () =>
    tasks.value.filter((t) => t.phase === 'downloading_json' || t.phase === 'downloading_jar')
      .length
)
const completedCount = computed(() => tasks.value.filter((t) => t.phase === 'completed').length)
const failedCount = computed(() => tasks.value.filter((t) => t.phase === 'failed').length)

function getTabCount(tab: string): number {
  switch (tab) {
    case 'all':
      return totalCount.value
    case 'downloading':
      return downloadingCount.value
    case 'completed':
      return completedCount.value
    case 'failed':
      return failedCount.value
    default:
      return 0
  }
}

function goBack() {
  router.back()
}

function goBackToHome() {
  router.push('/')
}

function goToDownloads() {
  router.push('/downloads')
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec > 1024 * 1024) {
    return (bytesPerSec / 1024 / 1024).toFixed(1) + ' MB/s'
  }
  if (bytesPerSec > 1024) {
    return (bytesPerSec / 1024).toFixed(1) + ' KB/s'
  }
  return bytesPerSec + ' B/s'
}

function formatSize(bytes: number): string {
  if (bytes > 1024 * 1024 * 1024) {
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
  }
  if (bytes > 1024 * 1024) {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }
  if (bytes > 1024) {
    return (bytes / 1024).toFixed(1) + ' KB'
  }
  return bytes + ' B'
}

function formatTime(timestamp?: number): string {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

async function retryTask(task: VersionDownloadTask) {
  downloadStore.removeVersionTask(task.id)
  await downloadStore.startVersionDownload(task.id, task.targetFolder)
}

async function viewInstance(task: VersionDownloadTask) {
  const api = window.electronAPI
  if (api?.instance) {
    await api.instance.create({
      name: task.id,
      mcVersion: task.id,
      loaderType: 'vanilla',
      loaderVersion: ''
    })
  }
  router.push('/versions')
}

function removeTask(task: VersionDownloadTask) {
  downloadStore.removeVersionTask(task.id)
}

function clearCompleted() {
  tasks.value.forEach((task) => {
    if (task.phase === 'completed') {
      downloadStore.removeVersionTask(task.id)
    }
  })
}

function cancelSelection() {
  selectedTasks.value = []
}

function deleteSelected() {
  selectedTasks.value.forEach((id) => {
    downloadStore.removeVersionTask(id)
  })
  selectedTasks.value = []
}

onMounted(() => {
  downloadStore.attachDownloadListeners()
})

onUnmounted(() => {
  downloadStore.detachDownloadListeners()
})
</script>

<style scoped>
.dm-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* * 顶部导航 */
.dm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  background: color-mix(in oklab, var(--voxver-text) 5%, transparent);
  border-bottom: 1px solid var(--voxver-border-color);
  flex-shrink: 0;
}

.back-btn {
  background: var(--voxver-bg-hover);
  border: 1px solid var(--voxver-border-color-light);
  border-radius: var(--voxver-radius-md);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--voxver-text-muted);
  transition: all 0.25s ease;
}
.back-btn:hover {
  background: var(--voxver-primary-light);
  color: #fff;
  transform: translateX(-2px);
}

.dm-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* * 工具栏 */
.dm-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  gap: 20px;
  border-bottom: 1px solid var(--voxver-border-color);
  flex-shrink: 0;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--voxver-bg-hover);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  padding: 8px 14px;
  flex: 1;
  max-width: 300px;
  color: var(--voxver-text-muted);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--voxver-text-primary);
  font-size: 14px;
}
.search-input::placeholder {
  color: var(--voxver-text-muted);
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: var(--voxver-text-muted);
  padding: 8px 16px;
  border-radius: var(--voxver-radius-md);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn:hover {
  background: var(--voxver-bg-hover);
  color: var(--voxver-text-secondary);
}
.tab-btn.active {
  background: color-mix(in oklab, var(--voxver-primary) 15%, transparent);
  color: var(--voxver-primary);
}

.tab-count {
  background: var(--voxver-bg-hover);
  padding: 2px 8px;
  border-radius: var(--voxver-radius-sm);
  font-size: 11px;
  min-width: 20px;
  text-align: center;
}
.tab-btn.active .tab-count {
  background: color-mix(in oklab, var(--voxver-primary) 30%, transparent);
}

/* * 统计卡片 */
.dm-stats {
  display: flex;
  gap: 12px;
  padding: 12px 20px;
  flex-shrink: 0;
}

.stat-item {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--voxver-text-primary);
}
.stat-label {
  font-size: 11px;
  color: var(--voxver-text-muted);
}

.stat-item.downloading .stat-value {
  color: var(--voxver-warning);
}
.stat-item.completed .stat-value {
  color: var(--voxver-success);
}
.stat-item.failed .stat-value {
  color: var(--voxver-error);
}

/* * 内容区域 */
.dm-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}
.task-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--voxver-shadow-md);
}
.task-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--voxver-gradient-primary);
}
.task-item.completed::before {
  background: var(--voxver-success);
}
.task-item.failed::before {
  background: var(--voxver-error);
}
.task-item.downloading::before {
  background: var(--voxver-warning);
  animation: pulse 2s ease-in-out infinite;
}



.task-checkbox {
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}
.task-checkbox input {
  display: none;
}
.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid var(--voxver-border-color-light);
  border-radius: var(--voxver-radius-sm);
  display: block;
  transition: all 0.2s;
}
.task-checkbox input:checked + .checkmark {
  background: var(--voxver-primary);
  border-color: var(--voxver-primary);
}
.task-checkbox input:checked + .checkmark::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.task-icon {
  flex-shrink: 0;
}

.icon-circle {
  width: 44px;
  height: 44px;
  border-radius: var(--voxver-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}
.icon-circle.success {
  background: color-mix(in oklab, var(--voxver-success) 15%, transparent);
  color: var(--voxver-success);
}
.icon-circle.error {
  background: color-mix(in oklab, var(--voxver-error) 15%, transparent);
  color: var(--voxver-error);
}
.icon-circle.downloading {
  background: color-mix(in oklab, var(--voxver-primary) 15%, transparent);
  color: var(--voxver-primary);
}
.download-icon {
  animation: bounce 1.5s ease-in-out infinite;
}


.task-info {
  flex: 1;
  min-width: 0;
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.task-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--voxver-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-size {
  font-size: 12px;
  color: var(--voxver-text-muted);
  flex-shrink: 0;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.task-phase-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--voxver-radius-xs);
  font-weight: 400;
}
.task-phase-tag.downloading {
  background: color-mix(in oklab, var(--voxver-warning) 20%, transparent);
  color: var(--voxver-warning);
}
.task-phase-tag.completed {
  background: color-mix(in oklab, var(--voxver-success) 20%, transparent);
  color: var(--voxver-success);
}
.task-phase-tag.failed {
  background: color-mix(in oklab, var(--voxver-error) 20%, transparent);
  color: var(--voxver-error);
}

.task-time {
  font-size: 11px;
  color: var(--voxver-text-muted);
}

.task-bar-wrap {
  position: relative;
  height: 6px;
  background: var(--voxver-bg-hover);
  border-radius: 3px;
  overflow: hidden;
}
.task-bar {
  position: relative;
  height: 100%;
  background: var(--voxver-gradient-primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}
.task-bar-glow {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.3), transparent);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

.task-item.completed .task-bar {
  background: linear-gradient(90deg, var(--voxver-success), color-mix(in oklab, var(--voxver-success) 70%, var(--voxver-bg-primary)));
}
.task-item.failed .task-bar {
  background: linear-gradient(90deg, var(--voxver-error), color-mix(in oklab, var(--voxver-error) 70%, var(--voxver-bg-primary)));
}

.task-progress-text {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 600;
  color: var(--voxver-text-tertiary);
}

.task-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.speed-info {
  text-align: right;
}
.speed-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--voxver-primary);
}
.speed-status {
  font-size: 11px;
  color: var(--voxver-text-muted);
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.btn-action {
  width: 34px;
  height: 34px;
  border-radius: var(--voxver-radius-md);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.btn-action.retry {
  background: color-mix(in oklab, var(--voxver-warning) 15%, transparent);
  color: var(--voxver-warning);
}
.btn-action.view {
  background: color-mix(in oklab, var(--voxver-success) 15%, transparent);
  color: var(--voxver-success);
}
.btn-action.delete {
  background: color-mix(in oklab, var(--voxver-error) 15%, transparent);
  color: var(--voxver-error);
}
.btn-action:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

/* * 空状态 */
.dm-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 10px;
}

.dm-empty h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--voxver-text-secondary);
  margin: 0;
}

.dm-empty p {
  font-size: 14px;
  color: var(--voxver-text-muted);
  margin: 0;
}

.btn-go-download {
  margin-top: 10px;
}

/* * 选择栏 */
.dm-selection-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: color-mix(in oklab, var(--voxver-primary) 10%, transparent);
  border-top: 1px solid color-mix(in oklab, var(--voxver-primary) 20%, transparent);
  flex-shrink: 0;
}

.selection-info {
  font-size: 14px;
  color: var(--voxver-text-primary);
}

.selection-actions {
  display: flex;
  gap: 10px;
}

/* * 底部 */
.dm-footer {
  flex-shrink: 0;
  padding: 18px 20px;
  border-top: 1px solid var(--voxver-border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.dm-footer p {
  font-size: 13px;
  color: var(--voxver-text-muted);
  margin: 0;
}

.btn-back-bg {
  padding: 12px 32px;
}
</style>

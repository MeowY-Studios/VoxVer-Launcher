<template>
  <div class="crash-analysis-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>{{ $t('crashAnalysis.title') }}</h2>
      <p class="page-desc">{{ $t('crashAnalysis.description') }}</p>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <button class="vox-btn" @click="refreshList" :disabled="loading">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 4v6h-6M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
        </svg>
        {{ $t('common.refresh') }}
      </button>
      <span class="crash-count" v-if="crashList.length">
        {{ $t('crashAnalysis.totalCrashes', { count: crashList.length }) }}
      </span>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="vox-skeleton" style="height: 60px; margin-bottom: 12px" v-for="i in 3" :key="i" />
    </div>

    <!-- 空状态 -->
    <div v-else-if="crashList.length === 0" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--voxver-text-muted)" stroke-width="1.5">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <p>{{ $t('crashAnalysis.noCrashes') }}</p>
      <span>{{ $t('crashAnalysis.noCrashesHint') }}</span>
    </div>

    <!-- 崩溃列表 -->
    <div v-else class="crash-list">
      <div
        v-for="crash in crashList"
        :key="crash.id"
        class="crash-item vox-card"
        :class="{ selected: selectedCrash?.id === crash.id }"
        @click="selectCrash(crash)"
      >
        <div class="crash-item-header">
          <span class="crash-severity" :class="crash.severity">
            {{ getSeverityLabel(crash.severity) }}
          </span>
          <span class="crash-version">MC {{ crash.minecraftVersion }}</span>
        </div>
        <p class="crash-item-cause">{{ crash.cause }}</p>
        <div class="crash-item-meta">
          <span class="crash-time">{{ formatTime(crash.time) }}</span>
          <span v-if="crash.instanceId" class="crash-instance">{{ crash.instanceId }}</span>
        </div>
      </div>
    </div>

    <!-- 详情面板 -->
    <div v-if="selectedCrash" class="crash-detail-panel">
      <div class="detail-header">
        <h3>{{ $t('crashAnalysis.crashDetail') }}</h3>
        <button class="crash-close" @click="selectedCrash = null">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div class="detail-body">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h4>{{ $t('crashAnalysis.basicInfo') }}</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">{{ $t('crashAnalysis.exception') }}</span>
              <span class="info-value error">{{ selectedCrash.crashCause.exception }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('crashAnalysis.version') }}</span>
              <span class="info-value">{{ selectedCrash.minecraftVersion }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('crashAnalysis.javaVersion') }}</span>
              <span class="info-value">{{ selectedCrash.javaVersion || $t('common.unknown') }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('crashAnalysis.os') }}</span>
              <span class="info-value">{{ selectedCrash.operatingSystem || $t('common.unknown') }}</span>
            </div>
          </div>
        </div>

        <!-- 错误信息 -->
        <div class="detail-section">
          <h4>{{ $t('crashAnalysis.errorMessage') }}</h4>
          <p class="error-message">{{ selectedCrash.crashCause.message }}</p>
          <p v-if="selectedCrash.description" class="error-desc">{{ selectedCrash.description }}</p>
        </div>

        <!-- 可能原因 -->
        <div v-if="selectedCrash.possibleCauses?.length" class="detail-section">
          <h4>{{ $t('crashAnalysis.possibleCauses') }}</h4>
          <ul class="cause-list">
            <li v-for="(cause, i) in selectedCrash.possibleCauses" :key="i">{{ cause }}</li>
          </ul>
        </div>

        <!-- 建议解决方案 -->
        <div v-if="selectedCrash.suggestedSolutions?.length" class="detail-section">
          <h4>{{ $t('crashAnalysis.suggestedSolutions') }}</h4>
          <ul class="solution-list">
            <li v-for="(solution, i) in selectedCrash.suggestedSolutions" :key="i">{{ solution }}</li>
          </ul>
        </div>

        <!-- 堆栈信息 -->
        <div class="detail-section">
          <h4>{{ $t('crashAnalysis.stackTrace') }}</h4>
          <pre class="stack-trace">{{ selectedCrash.crashCause.stackTrace?.join('\n') || selectedCrash.rawContent || $t('crashAnalysis.noStackTrace') }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CrashReport } from '../types/crash'

const { t } = useI18n()

const loading = ref(false)
const crashList = ref<CrashReport[]>([])
const selectedCrash = ref<CrashReport | null>(null)

// 刷新崩溃列表
async function refreshList() {
  const api = window.electronAPI
  if (!api?.crash?.list) return

  loading.value = true
  try {
    // 获取当前游戏目录
    const mcPath = await getCurrentMcPath()
    if (!mcPath) {
      crashList.value = []
      return
    }

    const result = await api.crash.list(mcPath)
    if (result?.ok && result.data) {
      crashList.value = result.data
    }
  } catch (e) {
    console.error('获取崩溃列表失败:', e)
  } finally {
    loading.value = false
  }
}

// 获取当前游戏目录
async function getCurrentMcPath(): Promise<string> {
  const api = window.electronAPI
  try {
    if (api?.folders?.getLast) {
      const last = await api.folders.getLast()
      if (last) return last
    }
    if (api?.path?.getCustom) {
      const custom = await api.path.getCustom()
      if (custom) return custom
    }
  } catch {
    // 忽略错误
  }
  return ''
}

// 选择崩溃报告
async function selectCrash(crash: CrashReport) {
  selectedCrash.value = crash

  // 如果缺少详细信息，尝试获取完整报告
  if (!crash.rawContent && !crash.suggestedSolutions?.length) {
    const api = window.electronAPI
    if (api?.crash?.diagnose) {
      try {
        const result = await api.crash.diagnose('', crash.instanceId)
        if (result?.ok && result.data?.report) {
          selectedCrash.value = result.data.report
        }
      } catch {
        // 使用现有数据
      }
    }
  }
}

// 格式化时间
function formatTime(time: string): string {
  try {
    const date = new Date(time)
    return date.toLocaleString()
  } catch {
    return time
  }
}

// 获取严重程度标签
function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    low: t('crashAnalysis.severityLow'),
    medium: t('crashAnalysis.severityMedium'),
    high: t('crashAnalysis.severityHigh'),
    critical: t('crashAnalysis.severityCritical')
  }
  return labels[severity] || severity
}

onMounted(() => {
  refreshList()
})
</script>

<style scoped lang="scss">
.crash-analysis-page {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--voxver-text-primary);
    margin: 0 0 4px;
  }

  .page-desc {
    font-size: 13px;
    color: var(--voxver-text-muted);
    margin: 0;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;

  .crash-count {
    font-size: 12px;
    color: var(--voxver-text-muted);
  }
}

.loading-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--voxver-text-muted);

  p {
    font-size: 14px;
    color: var(--voxver-text-secondary);
    margin: 0;
  }

  span {
    font-size: 12px;
  }
}

.crash-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.crash-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: all var(--voxver-transition-fast);

  &:hover {
    border-color: var(--voxver-primary);
  }

  &.selected {
    border-color: var(--voxver-error);
    background: color-mix(in oklab, var(--voxver-error) 5%, transparent);
  }
}

.crash-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.crash-severity {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--voxver-radius-full);
  text-transform: uppercase;

  &.low {
    background: var(--voxver-success-light);
    color: var(--voxver-success);
  }

  &.medium {
    background: var(--voxver-warning-light);
    color: var(--voxver-warning);
  }

  &.high {
    background: var(--voxver-error-light);
    color: var(--voxver-error);
  }

  &.critical {
    background: var(--voxver-error);
    color: oklch(100% 0 0);
  }
}

.crash-version {
  font-size: 11px;
  color: var(--voxver-text-muted);
}

.crash-item-cause {
  font-size: 13px;
  color: var(--voxver-text-primary);
  margin: 0 0 6px;
  line-height: 1.4;
}

.crash-item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: var(--voxver-text-muted);
}

/* 详情面板 */
.crash-detail-panel {
  background: var(--voxver-bg-secondary);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-lg);
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--voxver-border-color-light);

  h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--voxver-text-primary);
    margin: 0;
  }
}

.crash-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--voxver-text-muted);
  border-radius: var(--voxver-radius-sm);
  cursor: pointer;
  transition: all var(--voxver-transition-fast);

  &:hover {
    background: color-mix(in oklab, var(--voxver-text) 5%, transparent);
    color: var(--voxver-text-primary);
  }
}

.detail-body {
  padding: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  h4 {
    font-size: 12px;
    font-weight: 600;
    color: var(--voxver-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 10px;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  .info-label {
    display: block;
    font-size: 11px;
    color: var(--voxver-text-muted);
    margin-bottom: 2px;
  }

  .info-value {
    font-size: 13px;
    color: var(--voxver-text-primary);

    &.error {
      color: var(--voxver-error);
      font-weight: 600;
    }
  }
}

.error-message {
  font-size: 13px;
  color: var(--voxver-text-secondary);
  margin: 0 0 8px;
  word-break: break-word;
}

.error-desc {
  font-size: 12px;
  color: var(--voxver-text-muted);
  margin: 0;
}

.cause-list,
.solution-list {
  margin: 0;
  padding-left: 20px;

  li {
    font-size: 13px;
    color: var(--voxver-text-secondary);
    margin: 4px 0;
  }
}

.stack-trace {
  background: var(--voxver-bg-primary);
  border-radius: var(--voxver-radius-md);
  padding: 12px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--voxver-text-muted);
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>

<template>
  <div class="launch-page">
    <!-- 中央启动区 -->
    <div class="launch-center">
      <!-- 启动按钮 -->
      <button
        class="launch-btn"
        :class="{ launching: isLaunching, running: isRunning }"
        @click="handleLaunch"
        :disabled="isLaunching"
      >
        <span class="btn-icon">
          <!-- 就绪：播放图标 -->
          <svg
            v-if="!isLaunching && !isRunning"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          <!-- 启动中：旋转加载 -->
          <svg
            v-else-if="isLaunching && !isRunning"
            class="spin-icon"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <circle cx="12" cy="12" r="10" opacity="0.3" />
            <path d="M12 2a10 10 0 0110 10" stroke-linecap="round" />
          </svg>
          <!-- 运行中：停止方块 -->
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </span>

        <span class="btn-text">{{ launchLabel }}</span>
      </button>

      <!-- .minecraft 路径显示 -->
      <div class="mc-path-bar" :title="mcPath">
        <!-- 加载中 -->
        <template v-if="pathLoading">
          <span class="spin-loader-sm" />
          <span class="mc-path-text">{{ $t('launch.detecting') }}</span>
        </template>
        <!-- 已加载 -->
        <template v-else>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
          <span class="mc-path-text" :class="{ 'not-found': !mcPathExists }">{{
            mcPathDisplay
          }}</span>
          <div class="mc-path-actions">
            <button
              v-if="isCustomPath"
              class="mc-path-btn"
              :title="$t('launch.restoreDefaultPath')"
              @click.stop="restoreDefaultPath"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
            <button class="mc-path-btn" :title="$t('launch.changePath')" @click.stop="changePath">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        </template>
      </div>

      <!-- 状态信息 -->
      <p v-if="statusMessage" class="status-msg" :class="{ error: hasError }">
        {{ statusMessage }}
      </p>
    </div>

    <!-- 账户管理入口 -->
    <button class="btn-account-manage vox-btn" @click="goAccountSettings">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      {{ $t('launch.manageAccounts') }}
    </button>

    <!-- 游戏日志控制台 -->
    <section class="console-section">
      <div class="console-header">
        <h3>{{ $t('launch.gameLog') }}</h3>
        <div class="console-actions">
          <button class="console-btn" @click="clearLog" :title="$t('launch.clearLog')">{{ $t('common.clear') }}</button>
          <button class="console-btn" @click="copyLog" :title="$t('launch.copyLog')">{{ $t('common.copy') }}</button>
          <button
            v-if="isRunning"
            class="console-btn danger"
            @click="terminateGame"
            :title="$t('launch.forceTerminate')"
          >
            {{ $t('launch.terminate') }}
          </button>
        </div>
      </div>
      <div ref="logContainerRef" class="console-output" @scroll="onScrollLog">
        <div
          v-for="(line, idx) in logLines"
          :key="idx"
          class="log-line"
          :class="getLineClass(line)"
        >
          {{ line }}
        </div>
        <div v-if="logLines.length === 0" class="log-empty">{{ $t('launch.noLogOutput') }}</div>
      </div>
    </section>

    <!-- 崩溃分析面板 -->
    <section v-if="crashReport" class="crash-panel">
      <div class="crash-header">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--voxver-error)"
          stroke-width="2"
        >
          <path
            d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <h3>{{ $t('launch.gameCrash') }}</h3>
      </div>
      <div class="crash-body">
        <p class="crash-cause"><strong>{{ $t('launch.crashCause') }}</strong>{{ crashReport.cause }}</p>
        <div v-if="crashReport.recommendedActions?.length" class="crash-actions">
          <strong>{{ $t('launch.suggestedActions') }}</strong>
          <ul>
            <li v-for="(action, i) in crashReport.recommendedActions" :key="i">{{ action }}</li>
          </ul>
        </div>
        <details class="crash-stack">
          <summary>{{ $t('launch.viewCrashStack') }}</summary>
          <pre>{{ crashReport.stackTrace?.join('\n') || $t('launch.noStack') }}</pre>
        </details>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useVersionsStore, useAccountsStore, useInstancesStore } from '../stores'

const { t, locale } = useI18n()

const router = useRouter()
const settingsActive = inject<Ref<string>>('settingsActive')
const accountsStore = useAccountsStore()

// ====== 状态 ======
const isLaunching = ref(false)
const isRunning = ref(false)
const statusMessage = ref('')
const hasError = ref(false)
const logLines = ref<string[]>([])
const logContainerRef = ref<HTMLElement | null>(null)
const autoScroll = ref(true)
const mcPath = ref('')
const mcPathExists = ref(true)
const isCustomPath = ref(false)
const pathLoading = ref(true)
let logListener: ((...args: unknown[]) => void) | null = null
let exitListener: ((data: { code: number; signal: string | null; instanceId?: string }) => void) | null = null
let progressListener: ((...args: unknown[]) => void) | null = null

// 崩溃报告（简化版）
interface CrashInfo {
  cause: string
  recommendedActions: string[]
  stackTrace?: string[]
}
const crashReport = ref<CrashInfo | null>(null)

// ====== 计算属性 ======
const mcPathDisplay = computed(() => {
  if (!mcPath.value) return t('launch.detecting')
  if (!mcPathExists.value) return mcPath.value + t('launch.notFound')
  return mcPath.value
})
const launchLabel = computed(() => {
  if (isRunning.value) return t('launch.running')
  if (isLaunching.value) return t('launch.starting')
  return t('home.launchGame')
})

// ====== 方法 ======
async function handleLaunch() {
  if (isLaunching.value || isRunning.value) {
    await terminateGame()
    return
  }

  isLaunching.value = true
  hasError.value = false
  statusMessage.value = t('launch.buildingArgs')
  crashReport.value = null
  addLog('[VoxVer] 开始启动流程...')

  try {
    // 从 versionsStore 获取当前选中的版本
    const versionsStore = useVersionsStore()
    const instancesStore = useInstancesStore()

    // 优先用 instancesStore 的当前实例
    let instanceId = instancesStore.currentInstanceId || ''
    let accountId = accountsStore.activeAccount?.id || ''

    // 如果没有实例 id，用 versionsStore 当前版本
    const versionId = versionsStore.currentVersionId || ''
    if (!instanceId && versionId) {
      instanceId = versionId
    }

    // 如果没有版本，提示用户
    if (!versionId && !instanceId) {
      hasError.value = true
      statusMessage.value = t('launch.selectVersionFirst')
      addLog('[VoxVer] 未选择版本，无法启动')
      isLaunching.value = false
      return
    }

    addLog(
      `[VoxVer] 启动参数: instanceId="${instanceId}", accountId="${accountId}", versionId="${versionId}"`
    )

    const result = await window.electronAPI?.game.launch(
      instanceId || 'default',
      accountId || 'default',
      versionId
    )
    addLog(`[VoxVer] launch IPC 返回: ${JSON.stringify(result)}`)
  } catch (e: unknown) {
    hasError.value = true
    statusMessage.value = (e as Error).message || t('launch.launchFailed')
    addLog(`[VoxVer] 启动失败: ${(e as Error).message || e}`)
  } finally {
    // 保持 isLaunching，progress 事件会在成功时设为 false
  }
}

async function terminateGame() {
  try {
    const api = window.electronAPI
    if (api?.game?.terminate) {
      await api.game.terminate()
    }
    isRunning.value = false
    statusMessage.value = t('launch.gameTerminated')
    addLog('[VoxVer] 游戏进程已手动终止')
  } catch (e) {
    addLog(`[VoxVer] 终止游戏进程失败: ${(e as Error).message || e}`)
  }
}

/** 检查游戏是否在运行 */
async function checkRunning() {
  try {
    const api = window.electronAPI
    let running = false
    if (api?.game?.isRunning) {
      running = await api.game.isRunning()
    }
    isRunning.value = !!running
    if (running) {
      statusMessage.value = t('launch.gameAlreadyRunning')
    }
  } catch (e) {
    // 忽略
  }
}

/** 添加日志行 */
function addLog(line: string) {
  const now = new Date().toLocaleTimeString(locale.value, { hour12: false })
  logLines.value.push(`[${now}] ${line}`)
  // 自动滚动到底部
  if (autoScroll.value && logContainerRef.value) {
    requestAnimationFrame(() => {
      if (logContainerRef.value) {
        logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight
      }
    })
  }
}

function clearLog() {
  logLines.value = []
}

function copyLog() {
  navigator.clipboard
    .writeText(logLines.value.join('\n'))
    .then(() => {
      statusMessage.value = t('launch.logCopied')
      setTimeout(() => {
        statusMessage.value = ''
      }, 2000)
    })
    .catch(() => {
      statusMessage.value = t('launch.copyFailed')
    })
}

function getLineClass(line: string): string {
  const lower = line.toLowerCase()
  if (lower.includes('error') || lower.includes('exception') || lower.includes('fatal'))
    return 'error'
  if (lower.includes('warn')) return 'warn'
  if (lower.includes('[mcla]')) return 'system'
  return ''
}

function onScrollLog() {
  if (!logContainerRef.value) return
  const el = logContainerRef.value
  const atBottom = el.scrollHeight - el.clientHeight - el.scrollTop < 40
  autoScroll.value = atBottom
}

/** 修改 .minecraft 路径 */
async function changePath() {
  const api = window.electronAPI
  if (!api?.dialog) return

  const selected = await api.dialog.selectFolder()
  if (!selected) return

  // 保存到配置
  await api.path.setCustom(selected)
  // 更新显示
  mcPath.value = selected
  isCustomPath.value = true
  mcPathExists.value = await api.path.exists(selected)
  statusMessage.value = t('launch.switchedTo', { path: selected })
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

/** 恢复默认路径 */
async function restoreDefaultPath() {
  const api = window.electronAPI
  if (!api?.path) return

  await api.path.clearCustom()
  const defaultPath = await api.path.getDefault()
  mcPath.value = defaultPath
  isCustomPath.value = false
  mcPathExists.value = await api.path.exists(defaultPath)
  statusMessage.value = t('launch.restoredDefault', { path: defaultPath })
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

/** 跳转到设置页面的游戏账户与档案 */
function goAccountSettings() {
  settingsActive!.value = 'profile'
  router.push('/settings')
}

// ====== 生命周期 ======
onMounted(async () => {
  // 加载上次选中的版本（从 localStorage，App.vue onVersionSelect 会写这里）
  try {
    const lastVersionId = localStorage.getItem('voxver_last_version') || ''
    const lastVersionName = localStorage.getItem('voxver_last_version_name') || ''
    if (lastVersionId) {
      const versionsStore = useVersionsStore()
      versionsStore.setCurrentVersion(lastVersionId)
    }
  } catch (e) {
    /* ignore */
  }

  // 加载 .minecraft 路径
  try {
    const api = window.electronAPI
    if (api?.path) {
      // 检查是否有自定义路径
      const customPath = await api.path.getCustom()
      if (customPath) {
        mcPath.value = customPath
        isCustomPath.value = true
      } else {
        mcPath.value = await api.path.getMinecraft()
      }
      mcPathExists.value = await api.path.exists(mcPath.value)
    }
  } catch (e) {
    mcPathExists.value = false
  } finally {
    pathLoading.value = false
  }

  // 注册日志监听
  if (window.electronAPI?.game.onLog) {
    logListener = (...args: unknown[]) => {
      const log = args[0] as { text: string; level: string }
      addLog(log.text)
    }
    window.electronAPI.game.onLog(logListener as (log: { text: string; level: string }) => void)
  }

  // 注册退出监听
  if (window.electronAPI?.game.onExit) {
    exitListener = (data) => {
      isRunning.value = false
      isLaunching.value = false
      addLog(`[VoxVer] 游戏进程退出，退出码: ${data.code}`)
      if (data.code !== 0) {
        hasError.value = true
        statusMessage.value = `${t('launch.gameAbnormalExit')} (exit code ${data.code})`
      } else {
        statusMessage.value = t('launch.gameNormalExit')
      }
    }
    window.electronAPI.game.onExit(exitListener)
  }

  // 注册进度监听
  if (window.electronAPI?.game.onProgress) {
    progressListener = (...args: unknown[]) => {
      const progress = args[0] as { phase: string; message: string; detail?: string }
      statusMessage.value = progress.message
      if (progress.detail) addLog(`[进度] ${progress.message} → ${progress.detail}`)
      else addLog(`[进度] ${progress.message}`)
      if (progress.phase === 'running') {
        isLaunching.value = false
        isRunning.value = true
      }
      if (progress.phase === 'error') hasError.value = true
    }
    window.electronAPI.game.onProgress(progressListener as (progress: unknown) => void)
  }

  // 检查是否已有运行中的游戏
  await checkRunning()
})

onUnmounted(() => {
  // 清理监听器
  // electron 的 ipcRenderer.off 需要 channel 名和具体回调引用
  // 这里简化处理——如果需要完整清理可以扩展 preload API
})
</script>

<style scoped lang="scss">
.launch-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 32px 24px;
  min-height: calc(100vh - 44px);
}

/* ====== 启动按钮区域 ====== */
.launch-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}

/* .minecraft 路径显示条 */
.mc-path-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  font-size: 12px;
  color: var(--voxver-text-muted);
  max-width: 560px;
  width: 100%;

  svg {
    flex-shrink: 0;
    opacity: 0.6;
  }

  .mc-path-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--voxver-text-secondary);

    &.not-found {
      color: var(--voxver-text-error);
    }
  }

  .mc-path-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .mc-path-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--voxver-radius-sm);
    color: var(--voxver-text-muted);
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      color: var(--voxver-primary);
      border-color: var(--voxver-primary);
      background: color-mix(in oklab, var(--voxver-primary) 10%, transparent);
    }
  }
}

.launch-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 200px;
  height: 48px;
  padding: 0 28px;
  border: none;
  border-radius: var(--voxver-radius-full);
  background: var(--voxver-primary);
  color: #fff;
  font-size: 17px;
  font-weight: 400;
  line-height: 1.47;
  letter-spacing: -0.374px;
  cursor: pointer;
  transition: background var(--voxver-transition-fast), transform var(--voxver-transition-fast);

  &:not(:disabled):hover {
    opacity: 0.92;
  }

  &:not(:disabled):active {
    transform: scale(0.95);
  }

  &.launching .btn-icon {
    animation: pulse 1.6s ease-in-out infinite;
  }

  &.running {
    background: var(--voxver-success);

    .btn-icon {
      animation: pulse-green 2s ease-in-out infinite;
    }
  }

  &.error {
    background: var(--voxver-error);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    animation: none !important;
  }

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .spin-icon {
    animation: spin 1s linear infinite;
  }

  .btn-text {
    line-height: 1.47;
  }
}

.status-msg {
  font-size: 13.5px;
  color: var(--voxver-text-secondary);
  min-height: 20px;

  &.error {
    color: var(--voxver-text-error);
  }
}

/* ====== 账户管理入口 ====== */
.btn-account-manage {
  &:hover {
    background: color-mix(in oklab, var(--voxver-primary) 10%, transparent);
    border-color: color-mix(in oklab, var(--voxver-primary) 30%, transparent);
    color: var(--voxver-primary);
  }
}

/* ====== 控制台 ====== */
.console-section {
  width: 100%;
  max-width: 900px;
  background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  border: 1px solid var(--voxver-border-color-light);
  border-radius: var(--voxver-radius-lg);
  overflow: hidden;
  flex: 1;
  min-height: 280px;
  max-height: 420px;
  display: flex;
  flex-direction: column;
}

.console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border-bottom: 1px solid var(--voxver-border-color);

  h3 {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--voxver-text-secondary);
  }

  .console-actions {
    display: flex;
    gap: 6px;
  }

  .console-btn {
    padding: 4px 12px;
    font-size: 12px;
    background: transparent;
    border: 1px solid var(--voxver-border-color-light);
    border-radius: var(--voxver-radius-sm);
    color: var(--voxver-text-muted);
    cursor: pointer;
    transition: all 0.12s;

    &:hover {
      color: var(--voxver-primary);
      border-color: var(--voxver-primary-300);
    }

    &.danger:hover {
      color: var(--voxver-error);
      border-color: var(--voxver-error);
      background: color-mix(in oklab, var(--voxver-error) 8%, transparent);
    }
  }
}

.console-output {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  font-family: var(--voxver-font-mono);
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--voxver-text-secondary);

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--voxver-scrollbar-thumb);
    border-radius: 3px;
  }
}

.log-line {
  white-space: pre-wrap;
  word-break: break-all;

  &.error {
    color: var(--voxver-error);
  }
  &.warn {
    color: var(--voxver-warning);
  }
  &.system {
    color: var(--voxver-info);
    opacity: 0.85;
  }
}

.log-empty {
  text-align: center;
  color: var(--voxver-text-muted);
  padding: 60px 0;
  font-style: italic;
}

/* ====== 崩溃面板 ====== */
.crash-panel {
  width: 100%;
  max-width: 900px;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border: 1px solid color-mix(in oklab, var(--voxver-error) 50%, transparent);
  border-left: 3px solid var(--voxver-error);
  border-radius: var(--voxver-radius-lg);
  overflow: hidden;
}

.crash-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  background: color-mix(in oklab, var(--voxver-error) 6%, transparent);

  h3 {
    font-size: 17px;
    font-weight: 600;
    color: var(--voxver-text-error);
  }
}

.crash-body {
  padding: 14px 18px;
  color: var(--voxver-text-secondary);
  font-size: 13.5px;

  .crash-cause {
    color: var(--voxver-text-error);
    margin-bottom: 10px;
  }

  .crash-actions {
    ul {
      margin: 8px 0;
      padding-left: 20px;
      li {
        margin: 4px 0;
      }
    }
  }

  .crash-stack {
    margin-top: 10px;

    summary {
      cursor: pointer;
      color: var(--voxver-text-muted);
      font-size: 12px;
      outline: none;

      &:hover {
        color: var(--voxver-text-secondary);
      }
    }

    pre {
      margin-top: 8px;
      padding: 10px 12px;
      background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
      border-radius: var(--voxver-radius-md);
      font-size: 11px;
      line-height: 1.5;
      max-height: 180px;
      overflow-y: auto;
      color: var(--voxver-text-muted);
    }
  }
}

.spin-loader-sm {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--voxver-border-color);
  border-top-color: var(--voxver-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
</style>

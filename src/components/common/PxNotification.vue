<template>
  <div class="pxn">
    <!-- 铃铛按钮（放在标题栏窗口控制按钮左侧） -->
    <button
      class="pxn-bell"
      :class="{ 'has-unread': unreadCount > 0 }"
      @click="togglePanel"
      :title="$t('component.notificationCount', { n: unreadCount })"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
      <span v-if="unreadCount > 0" class="pxn-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- 通知面板：Teleport 到 body，从窗口右侧滑出 -->
    <Teleport to="body">
      <transition name="pxn-drawer">
        <div v-if="showPanel" class="pxn-drawer">
          <div class="pxn-backdrop" @click="closePanel"></div>
          <aside class="pxn-panel" role="dialog" :aria-label="$t('component.notificationCenter')">
            <div class="pxn-header">
              <h3 class="pxn-title">{{ $t('component.notificationCenter') }}</h3>
              <button
                v-if="clearableCount > 0"
                class="pxn-clear"
                :title="$t('component.clearAll')"
                @click="clearAll"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                  />
                </svg>
                <span>{{ $t('component.clearAll') }}</span>
              </button>
            </div>

            <!-- 有游戏在运行时：一键回到启动页 -->
            <button v-if="gameRunning" class="pxn-game-entry" @click="goToRunningGame">
              <span class="pxn-game-dot"></span>
              <span class="pxn-game-text">{{ $t('component.gameRunningReturn') }}</span>
              <svg
                class="pxn-game-arrow"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <div class="pxn-group">
              <span class="pxn-group-label">{{ $t('component.notificationGroup') }}</span>
              <span class="pxn-group-count">{{ history.length }}</span>
              <button
                v-if="unreadCount > 0"
                class="pxn-markall"
                :title="$t('component.markAllRead')"
                @click="markAllRead"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </div>

            <div class="pxn-list">
              <div v-if="isLoading" class="pxn-empty">{{ $t('common.loading') }}</div>
              <div v-else-if="loadError" class="pxn-empty pxn-error">{{ loadError }}</div>
              <div v-else-if="history.length === 0" class="pxn-empty">
                {{ $t('component.noNotifications') }}
              </div>
              <div
                v-for="item in sortedHistory"
                :key="item.id"
                class="pxn-item"
                :class="{ unread: !item.read, [`type-${item.type}`]: true }"
                @click="onClick(item)"
              >
                <div class="pxn-item-icon">
                  <!-- success -->
                  <svg
                    v-if="item.type === 'success'"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <!-- error -->
                  <svg
                    v-else-if="item.type === 'error'"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <!-- warning -->
                  <svg
                    v-else-if="item.type === 'warning'"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <!-- info -->
                  <svg
                    v-else
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div class="pxn-item-main">
                  <div class="pxn-item-head">
                    <span class="pxn-item-title">{{ item.title }}</span>
                    <span v-if="item.pinned" class="pxn-pin">{{
                      $t('component.officialPinned')
                    }}</span>
                    <span class="pxn-item-time">{{ formatTime(item.timestamp) }}</span>
                  </div>
                  <div v-if="item.body" class="pxn-item-body">{{ item.body }}</div>
                  <!-- 下载等任务型通知的进度条 -->
                  <div
                    v-if="item.status === 'running' && typeof item.progress === 'number'"
                    class="pxn-progress"
                  >
                    <div class="pxn-progress-track">
                      <div
                        class="pxn-progress-bar"
                        :style="{ width: `${Math.min(100, Math.max(0, item.progress))}%` }"
                      ></div>
                    </div>
                    <span class="pxn-progress-value">{{ Math.floor(item.progress) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const router = useRouter()
const showPanel = ref(false)
interface NotificationItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  body: string
  read: boolean
  route?: string
  timestamp: number
  updatedAt?: number
  /** 通知来源：系统 / 下载 / 官方（预留） */
  source?: 'system' | 'download' | 'official'
  status?: 'info' | 'running' | 'success' | 'warning' | 'error'
  progress?: number
  /** 置顶通知（官方），清除时保留 */
  pinned?: boolean
}

const history = ref<NotificationItem[]>([])
const unreadCount = ref(0)
const isLoading = ref(false)
const loadError = ref('')
/** 当前是否有游戏在运行，用于显示“返回启动页”入口 */
const gameRunning = ref(false)

const sortedHistory = computed(() =>
  [...history.value].sort((a, b) => {
    // 置顶通知（官方）始终排在最前面
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
    return b.timestamp - a.timestamp
  })
)

/** 可清除的通知数量（置顶通知不参与清除） */
const clearableCount = computed(() => history.value.filter((h) => !h.pinned).length)

let removeOnNotify: (() => void) | null = null
let removeOnUpdated: (() => void) | null = null
let removeOnClicked: (() => void) | null = null

async function refreshGameRunning() {
  try {
    const running = await window.electronAPI?.game?.isRunning?.()
    gameRunning.value = !!running
  } catch {
    gameRunning.value = false
  }
}

async function togglePanel() {
  showPanel.value = !showPanel.value
  if (showPanel.value) {
    await refreshGameRunning()
  }
}

function closePanel() {
  showPanel.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && showPanel.value) closePanel()
}

function goToRunningGame() {
  showPanel.value = false
  router.push('/launch')
}

async function refreshUnreadCount() {
  if (!window.electronAPI) return
  try {
    const count = await window.electronAPI.notification.getUnreadCount()
    unreadCount.value = count?.data ?? 0
  } catch {
    // 忽略未读数刷新失败
  }
}

async function loadHistory() {
  if (!window.electronAPI) return
  isLoading.value = true
  loadError.value = ''
  try {
    const result = await window.electronAPI.notification.getHistory(50)
    if (result?.ok) {
      history.value = (result.data || []) as NotificationItem[]
    }
    const count = await window.electronAPI.notification.getUnreadCount()
    unreadCount.value = count?.data ?? 0
  } catch (e) {
    console.error('[loadHistory] 加载通知历史失败:', e)
    loadError.value = t('component.loadHistoryFailed')
  } finally {
    isLoading.value = false
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (isToday) {
    return d.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString(locale.value, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function markRead(id: string) {
  if (!window.electronAPI) return
  await window.electronAPI.notification.markRead(id)
  const item = history.value.find((h) => h.id === id)
  if (item) item.read = true
  unreadCount.value = Math.max(0, unreadCount.value - 1)
}

async function markAllRead() {
  if (!window.electronAPI) return
  await window.electronAPI.notification.markAllRead()
  history.value.forEach((h) => (h.read = true))
  unreadCount.value = 0
}

async function clearAll() {
  if (!window.electronAPI) return
  await window.electronAPI.notification.clear()
  // 主进程会保留置顶通知，本地同步移除其余通知
  history.value = history.value.filter((h) => h.pinned)
  await refreshUnreadCount()
  if (history.value.length === 0) unreadCount.value = 0
}

async function onClick(item: NotificationItem) {
  if (!item.read) await markRead(item.id)
  if (item.route) {
    router.push(item.route)
    showPanel.value = false
  }
}

onMounted(async () => {
  await loadHistory()
  window.addEventListener('keydown', onKeydown)

  if (window.electronAPI?.notification?.onNotify) {
    removeOnNotify = window.electronAPI.notification.onNotify((item) => {
      history.value.unshift(item)
      if (!item.read) unreadCount.value++
    })
  }

  // 同 key 的通知原地更新（下载进度、完成状态）
  if (window.electronAPI?.notification?.onUpdated) {
    removeOnUpdated = window.electronAPI.notification.onUpdated((item) => {
      const index = history.value.findIndex((h) => h.id === item.id)
      if (index >= 0) {
        history.value[index] = { ...history.value[index], ...item }
      } else {
        history.value.unshift(item)
      }
      void refreshUnreadCount()
    })
  }

  if (window.electronAPI?.notification?.onClicked) {
    removeOnClicked = window.electronAPI.notification.onClicked((data) => {
      if (data?.route) router.push(data.route)
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  removeOnNotify?.()
  removeOnUpdated?.()
  removeOnClicked?.()
})
</script>

<style scoped lang="scss">
.pxn {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  -webkit-app-region: no-drag;
}

.pxn-bell {
  position: relative;
  width: 36px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--voxver-radius-sm, 6px);
  background: transparent;
  color: var(--voxver-text-secondary);
  cursor: pointer;
  transition: all 0.12s;
  -webkit-app-region: no-drag;

  &:hover {
    background: var(--voxver-bg-hover);
    color: var(--voxver-text-primary);
  }
  &.has-unread {
    color: var(--voxver-text-primary);
  }

  .pxn-badge {
    position: absolute;
    top: 6px;
    right: 6px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: var(--voxver-radius-md);
    background: var(--voxver-error);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
}

/* 抽屉容器：固定覆盖窗口，面板从右侧滑出 */
.pxn-drawer {
  position: fixed;
  inset: 0;
  z-index: var(--voxver-z-modal);
}

.pxn-backdrop {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 0.16);
}

.pxn-panel {
  position: absolute;
  top: 52px;
  right: 12px;
  bottom: 14px;
  width: 348px;
  max-width: calc(100vw - 24px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--voxver-border-color);
  border-radius: 14px;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 92%, transparent);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  box-shadow: -18px 0 44px rgb(0 0 0 / 0.3);
}

html[data-theme='light'] .pxn-panel {
  background: color-mix(in oklab, var(--voxver-bg-elevated) 96%, transparent);
  box-shadow: -18px 0 44px rgb(0 0 0 / 0.12);
}

.pxn-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px 10px;
  flex-shrink: 0;
}
.pxn-title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--voxver-text-primary);
}
.pxn-clear {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--voxver-text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s;

  &:hover {
    color: var(--voxver-text-primary);
    background: var(--voxver-bg-hover);
  }
}

.pxn-game-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 12px 8px;
  padding: 10px 12px;
  border: 1px solid color-mix(in oklab, var(--voxver-primary) 35%, transparent);
  border-radius: 10px;
  background: color-mix(in oklab, var(--voxver-primary) 10%, transparent);
  color: var(--voxver-text-primary);
  font-size: 12.5px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s;
  flex-shrink: 0;

  &:hover {
    background: color-mix(in oklab, var(--voxver-primary) 16%, transparent);
  }
}

.pxn-game-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--voxver-success);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--voxver-success) 22%, transparent);
  flex-shrink: 0;
}

.pxn-game-text {
  flex: 1;
  min-width: 0;
}

.pxn-game-arrow {
  color: var(--voxver-text-muted);
  flex-shrink: 0;
}

.pxn-group {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 16px 8px;
  flex-shrink: 0;
}
.pxn-group-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--voxver-text-muted);
}
.pxn-group-count {
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: color-mix(in oklab, var(--voxver-text-primary) 8%, transparent);
  color: var(--voxver-text-secondary);
  font-size: 11px;
  line-height: 1;
}
.pxn-markall {
  margin-left: auto;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--voxver-text-muted);
  cursor: pointer;

  &:hover {
    color: var(--voxver-primary);
    background: var(--voxver-bg-hover);
  }
}

.pxn-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 12px 12px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: color-mix(in oklab, var(--voxver-text-primary) 18%, transparent);
    border-radius: 2px;
  }
}

.pxn-empty {
  padding: 36px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--voxver-text-muted);
}
.pxn-error {
  color: var(--voxver-error);
}

.pxn-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--voxver-border-color-light, var(--voxver-border-color));
  border-radius: 10px;
  background: color-mix(in oklab, var(--voxver-bg-secondary) 55%, transparent);
  cursor: pointer;
  transition:
    background 0.12s,
    border-color 0.12s;

  &:hover {
    background: color-mix(in oklab, var(--voxver-primary) 8%, transparent);
  }

  &.unread {
    border-color: color-mix(in oklab, var(--voxver-primary) 42%, transparent);
  }

  /* type colors */
  &.type-success .pxn-item-icon {
    color: var(--voxver-success);
  }
  &.type-error .pxn-item-icon {
    color: var(--voxver-error);
  }
  &.type-warning .pxn-item-icon {
    color: var(--voxver-warning);
  }
  &.type-info .pxn-item-icon {
    color: var(--voxver-primary);
  }
}

.pxn-item-icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

.pxn-item-main {
  flex: 1;
  min-width: 0;
}

.pxn-item-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.pxn-item-title {
  flex: 1;
  min-width: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--voxver-text-primary);
  line-height: 1.45;
  overflow-wrap: anywhere;
}

/* 官方置顶标记 */
.pxn-pin {
  flex-shrink: 0;
  align-self: center;
  padding: 0 6px;
  height: 16px;
  line-height: 16px;
  border-radius: 4px;
  font-size: 10px;
  color: var(--voxver-primary);
  background: color-mix(in oklab, var(--voxver-primary) 14%, transparent);
}

.pxn-item-time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--voxver-text-muted);
}

.pxn-item-body {
  margin-top: 3px;
  font-size: 12px;
  color: var(--voxver-text-secondary);
  line-height: 1.45;
  /* 最多三行 */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}

/* 下载进度 */
.pxn-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.pxn-progress-track {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
  background: color-mix(in oklab, var(--voxver-text-primary) 12%, transparent);
}
.pxn-progress-bar {
  height: 100%;
  border-radius: 2px;
  background: var(--voxver-primary);
  transition: width 0.25s ease;
}
.pxn-progress-value {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--voxver-text-secondary);
  font-variant-numeric: tabular-nums;
}

/* * 右侧滑出动画 */
.pxn-drawer-enter-active .pxn-panel,
.pxn-drawer-leave-active .pxn-panel {
  transition:
    transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.24s ease;
}
.pxn-drawer-enter-from .pxn-panel,
.pxn-drawer-leave-to .pxn-panel {
  transform: translateX(28px);
  opacity: 0;
}
.pxn-drawer-enter-active .pxn-backdrop,
.pxn-drawer-leave-active .pxn-backdrop {
  transition: opacity 0.24s ease;
}
.pxn-drawer-enter-from .pxn-backdrop,
.pxn-drawer-leave-to .pxn-backdrop {
  opacity: 0;
}
</style>

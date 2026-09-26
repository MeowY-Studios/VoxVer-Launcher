<template>
  <div class="update-page">
    <!-- 顶部返回栏（自带窗口拖拽与控制，覆盖整个启动器界面） -->
    <div class="page-topbar">
      <button class="back-btn" @click="goBack">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        {{ t('update.updatePage.back') }}
      </button>
      <h2 class="page-title">{{ t('update.updatePage.title') }}</h2>
      <div class="wc">
        <button class="wc-btn" @click="minimizeWindow">
          <svg width="10" height="10" viewBox="0 0 10 10"><rect width="10" height="1" fill="currentColor" /></svg>
        </button>
        <button class="wc-btn" @click="maximizeWindow">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 3V9H7V3H1M3 1H9V7H3V1" stroke="currentColor" stroke-width="1.2" fill="none" />
          </svg>
        </button>
        <button class="wc-btn wc-close" @click="closeWindow">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.2" />
          </svg>
        </button>
      </div>
    </div>

    <div class="page-scroll">
      <!-- 版本横幅（水波纹背景） -->
      <div class="update-hero">
        <div class="hero-canvas">
          <SilkBackground color-a="var(--voxver-accent)" color-b="#0a2540" :speed="1.2" />
        </div>
        <div class="hero-content">
          <img class="hero-logo" src="/Alogo.png" alt="VoxVer" />
          <div class="hero-version">v{{ appVersion }}</div>
          <div class="hero-status" :class="heroStatusClass">{{ heroStatusText }}</div>
        </div>
      </div>

    <!-- 更新内容 -->
    <div class="notes-section">
      <div class="notes-title">
        <span>{{ t('update.updatePage.releaseNotes') }}</span>
        <span class="notes-version" v-if="notesVersion">{{ t('update.updatePage.versionLabel', { version: notesVersion }) }}</span>
        <a class="github-link" @click="openGithub">
          {{ t('update.updatePage.viewOnGitHub') }}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
      <div class="vox-card notes-card">
        <div v-if="notesLoading" class="notes-loading">
          <span class="spinner" />
          <span>{{ t('update.updatePage.loadingNotes') }}</span>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html — 内容已经过 HTML 转义与白名单过滤 -->
        <div v-else-if="notesHtml" class="notes-body" v-html="notesHtml" />
        <div v-else class="notes-empty">{{ t('update.updatePage.noNotes') }}</div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="action-bar vox-card">
      <div class="action-row">
        <span class="action-status" :class="{ error: hasError }">{{ statusText }}</span>
        <span class="action-speed" v-if="state === 'downloading' && status?.bytesPerSecond">{{ formatBytes(status.bytesPerSecond) }}/s</span>
      </div>
      <div class="progress-track" v-if="state === 'downloading'">
        <div class="progress-fill" :style="{ width: Math.min(100, Math.max(0, pct)) + '%' }" />
      </div>
      <div class="action-buttons">
        <button
          class="vox-btn action-main"
          :disabled="state === 'checking'"
          @click="primaryAction"
        >
          <span class="spinner" v-if="state === 'checking'" />
          {{ mainButtonLabel }}
        </button>
        <button
          class="vox-btn action-cancel"
          v-if="state === 'downloading'"
          @click="handleCancel"
        >
          {{ t('update.updatePage.cancelDownload') }}
        </button>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SilkBackground from '../components/SilkBackground.vue'

const router = useRouter()
const { t } = useI18n()

const GITHUB_RELEASES_URL = 'https://github.com/MeowY-Studios/VoxVer-Launcher/releases'

interface CheckResult {
  currentVersion: string
  latestVersion: string | null
  hasUpdate: boolean
  notes: string | null
  error: string | null
}

interface StatusPayload {
  checking: boolean
  available: boolean
  downloading: boolean
  downloadProgress: number
  transferred: number
  total: number
  bytesPerSecond: number
  downloaded: boolean
  error: string | null
  version: string | null
  releaseNotes: string | null
}

const appVersion = ref('...')
const checkResult = ref<CheckResult | null>(null)
const checking = ref(false)
const status = ref<StatusPayload | null>(null)

let unsubStatus: (() => void) | null = null

const pct = computed(() => {
  const total = status.value?.total ?? 0
  if (total > 0) return ((status.value?.transferred ?? 0) / total) * 100
  return status.value?.downloadProgress ?? 0
})

/** 页面状态机：idle < checking < error < downloading < downloaded < available < uptodate */
const state = computed<'idle' | 'checking' | 'downloading' | 'downloaded' | 'available' | 'uptodate' | 'error'>(() => {
  const s = status.value
  if (s?.downloaded) return 'downloaded'
  if (s?.downloading) return 'downloading'
  if (checking.value || s?.checking) return 'checking'
  if (checkResult.value?.error) return 'error'
  if (s?.error && !s.available) return 'error'
  if (checkResult.value?.hasUpdate || s?.available) return 'available'
  if (checkResult.value) return 'uptodate'
  return 'idle'
})

const hasError = computed(() => state.value === 'error')
const errorText = computed(
  () => checkResult.value?.error ?? status.value?.error ?? ''
)

const notesVersion = computed(() => {
  if (checkResult.value?.hasUpdate) return checkResult.value.latestVersion
  if (status.value?.version) return status.value.version
  return checkResult.value?.currentVersion ?? null
})

const notesSource = computed<string | null>(() => {
  if (checkResult.value?.hasUpdate && checkResult.value.notes) return checkResult.value.notes
  // 无更新时展示当前版本的发布说明（检查结果已带回）
  if (checkResult.value) return checkResult.value.notes ?? null
  return status.value?.releaseNotes ?? null
})

const notesLoading = computed(() => state.value === 'checking' && !notesSource.value)

const notesHtml = computed(() => {
  const raw = notesSource.value
  return raw ? renderMarkdown(raw) : ''
})

const heroStatusText = computed(() => {
  switch (state.value) {
    case 'checking':
      return t('update.updatePage.checking')
    case 'available':
      return t('update.updatePage.newVersionAvailable')
    case 'downloading':
      return t('update.updatePage.newVersionAvailable')
    case 'downloaded':
      return t('update.updatePage.newVersionAvailable')
    case 'uptodate':
      return t('update.updatePage.upToDate')
    case 'error':
      return t('update.updatePage.updateFailed', { error: errorText.value })
    default:
      return t('update.updatePage.checkUpdate')
  }
})

const heroStatusClass = computed(() => ({
  ok: state.value === 'uptodate',
  warn: state.value === 'available' || state.value === 'downloading' || state.value === 'downloaded',
  error: state.value === 'error'
}))

const statusText = computed(() => {
  switch (state.value) {
    case 'checking':
      return t('update.updatePage.checking')
    case 'available':
      return checkResult.value?.latestVersion
        ? t('update.updatePage.foundNewVersion', { version: checkResult.value.latestVersion })
        : t('update.updatePage.newVersionAvailable')
    case 'downloading':
      return t('update.updatePage.downloading', {
        percent: pct.value.toFixed(0),
        done: formatBytes(status.value?.transferred ?? 0),
        total: formatBytes(status.value?.total ?? 0)
      })
    case 'downloaded':
      return t('update.updatePage.downloaded')
    case 'uptodate':
      return t('update.updatePage.upToDate')
    case 'error':
      return t('update.updatePage.checkFailed', { error: errorText.value })
    default:
      return ''
  }
})

const mainButtonLabel = computed(() => {
  switch (state.value) {
    case 'checking':
      return t('update.updatePage.checking')
    case 'available':
      return t('update.updatePage.downloadUpdate')
    case 'downloaded':
      return t('update.updatePage.installUpdate')
    case 'error':
      return t('update.updatePage.retry')
    default:
      return t('update.updatePage.checkUpdate')
  }
})

function primaryAction(): void {
  switch (state.value) {
    case 'available':
      void window.electronAPI?.updater?.download?.()
      break
    case 'downloaded':
      void window.electronAPI?.updater?.install?.()
      break
    default:
      void runCheck()
      break
  }
}

async function runCheck(): Promise<void> {
  checking.value = true
  try {
    const res = await window.electronAPI?.updater?.check?.()
    if (res?.success && res.data) {
      checkResult.value = res.data
      if (res.data.currentVersion) appVersion.value = res.data.currentVersion
    } else {
      checkResult.value = {
        currentVersion: appVersion.value,
        latestVersion: null,
        hasUpdate: false,
        notes: null,
        error: 'updater:check failed'
      }
    }
  } finally {
    checking.value = false
  }
}

function handleCancel(): void {
  void window.electronAPI?.updater?.cancel?.()
}

function goBack(): void {
  router.back()
}

// 覆盖层遮住了应用自带标题栏，这里补一组窗口控制
function minimizeWindow(): void {
  window.electronAPI?.window?.minimize?.()
}

function maximizeWindow(): void {
  window.electronAPI?.window?.maximize?.()
}

function closeWindow(): void {
  window.electronAPI?.window?.close?.()
}

function openGithub(): void {
  void window.electronAPI?.shell?.openExternal?.(GITHUB_RELEASES_URL)
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB'
  const mb = bytes / 1024 / 1024
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`
  return `${mb.toFixed(1)} MB`
}

/**
 * 极简 Markdown 渲染：先整体 HTML 转义再按行解析，
 * 仅产出受控标签，防止发布说明中的任意 HTML 注入。
 */
function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let inList = false
  for (const line of lines) {
    const esc = escapeHtml(line)
    const li = /^\s*(?:[-*+]|\d+\.)\s+(.*)$/.exec(esc)
    if (li) {
      if (!inList) {
        out.push('<ul>')
        inList = true
      }
      out.push(`<li>${inline(li[1])}</li>`)
      continue
    }
    if (inList) {
      out.push('</ul>')
      inList = false
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(esc)
    if (h) {
      const level = Math.min(h[1].length + 2, 6)
      out.push(`<h${level}>${inline(h[2])}</h${level}>`)
    } else if (/^\s*(?:---|\*\*\*)\s*$/.test(esc)) {
      out.push('<hr />')
    } else if (esc.trim() === '') {
      out.push('<div class="md-gap"></div>')
    } else {
      out.push(`<p>${inline(esc)}</p>`)
    }
  }
  if (inList) out.push('</ul>')
  return out.join('')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function inline(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, txt: string, url: string) => {
      // 仅允许 http(s) 链接
      if (!/^https?:\/\//.test(url)) return txt
      return `<a href="${url}" data-url="${url}">${txt}</a>`
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

onMounted(async () => {
  const api = window.electronAPI?.updater
  if (api?.onStatusChange) {
    unsubStatus = api.onStatusChange((payload: unknown) => {
      status.value = payload as StatusPayload
    })
  }
  try {
    const st = await api?.getStatus?.()
    if (st?.success) status.value = st.data as StatusPayload
  } catch { /* ignore */ }
  try {
    const v = await window.electronAPI?.app?.getVersion?.()
    if (v) appVersion.value = v
  } catch { /* ignore */ }
  await runCheck()
})

onUnmounted(() => {
  unsubStatus?.()
})
</script>

<style scoped lang="scss">
/* 全屏覆盖层：遮住侧边栏与标题栏，返回后随路由卸载恢复原界面 */
.update-page {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  background: var(--voxver-bg-primary);
}

.page-topbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  -webkit-app-region: drag;

  .page-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--voxver-text);
  }

  .wc {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 2px;
    -webkit-app-region: no-drag;
  }
}

.wc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--voxver-text-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--voxver-bg-hover);
    color: var(--voxver-text);
  }

  &.wc-close:hover {
    background: #e81123;
    color: #ffffff;
  }
}

.page-scroll {
  flex: 1;
  overflow-y: auto;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 12px 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.back-btn {
  -webkit-app-region: no-drag;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  background: var(--voxver-bg-tertiary);
  color: var(--voxver-text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--voxver-bg-hover);
    color: var(--voxver-text);
  }
}

.update-hero {
  position: relative;
  padding: 36px 24px 30px;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(120% 140% at 50% -20%, var(--voxver-accent, #14b8a6) 0%, color-mix(in srgb, var(--voxver-accent, #14b8a6) 72%, #000000) 58%, color-mix(in srgb, var(--voxver-accent, #14b8a6) 48%, #000000) 100%);
  color: #ffffff;
  text-align: center;
  box-shadow: var(--voxver-shadow-md);

  .hero-canvas {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .hero-logo {
    height: 72px;
    width: auto;
    object-fit: contain;
  }

  .hero-version {
    font-size: 14px;
    opacity: 0.92;
  }

  .hero-status {
    margin-top: 6px;
    font-size: 13px;
    font-weight: 600;
    padding: 5px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    max-width: 90%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.ok {
      background: rgba(255, 255, 255, 0.22);
    }

    &.warn {
      background: rgba(0, 0, 0, 0.22);
    }

    &.error {
      background: rgba(0, 0, 0, 0.35);
    }
  }
}

.notes-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notes-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--voxver-text);

  .notes-version {
    font-size: 12px;
    font-weight: 400;
    color: var(--voxver-text-muted);
  }

  .github-link {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 400;
    color: var(--voxver-accent, #14b8a6);
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
}

.notes-card {
  padding: 16px 18px;
  min-height: 80px;
}

.notes-loading,
.notes-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 0;
  font-size: 13px;
  color: var(--voxver-text-muted);
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--voxver-bg-tertiary);
  border-top-color: var(--voxver-accent, #14b8a6);
  border-radius: 50%;
  animation: voxver-update-spin 0.8s linear infinite;
}

@keyframes voxver-update-spin {
  to {
    transform: rotate(360deg);
  }
}

.notes-body {
  font-size: 13.5px;
  line-height: 1.65;
  color: var(--voxver-text);

  :deep(h3),
  :deep(h4),
  :deep(h5) {
    margin: 14px 0 8px;
    font-weight: 600;
    color: var(--voxver-text);
  }

  :deep(h3) {
    font-size: 15px;
  }

  :deep(h4) {
    font-size: 14px;
  }

  :deep(p) {
    margin: 6px 0;
  }

  :deep(ul) {
    margin: 6px 0;
    padding-left: 20px;
  }

  :deep(li) {
    margin: 3px 0;
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid var(--voxver-border);
    margin: 12px 0;
  }

  :deep(code) {
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 12px;
    background: var(--voxver-bg-tertiary);
  }

  :deep(a) {
    color: var(--voxver-accent, #14b8a6);
    text-decoration: underline;
  }

  :deep(.md-gap) {
    height: 6px;
  }
}

.action-bar {
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 18px;
  background: var(--voxver-bg-secondary);
  box-shadow: var(--voxver-shadow-lg);

  .action-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .action-status {
    flex: 1;
    font-size: 13px;
    color: var(--voxver-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.error {
      color: var(--voxver-error, #ef4444);
    }
  }

  .action-speed {
    font-size: 12px;
    color: var(--voxver-text-muted);
  }
}

.progress-track {
  height: 6px;
  border-radius: 999px;
  background: var(--voxver-bg-tertiary);
  overflow: hidden;

  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: var(--voxver-accent, #14b8a6);
    transition: width 0.25s ease;
  }
}

.action-buttons {
  display: flex;
  gap: 10px;

  .action-main {
    flex: 1;
    justify-content: center;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 16px;
    border: none;
    border-radius: 10px;
    background: var(--voxver-accent, #14b8a6);
    color: #ffffff;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    transition: filter 0.15s ease, opacity 0.15s ease;

    &:hover:not(:disabled) {
      filter: brightness(1.08);
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }

  .action-cancel {
    flex: 1;
    justify-content: center;
    display: inline-flex;
    align-items: center;
    padding: 9px 16px;
    border: 1px solid var(--voxver-border);
    border-radius: 10px;
    background: transparent;
    color: var(--voxver-text);
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: var(--voxver-bg-tertiary);
    }
  }
}
</style>

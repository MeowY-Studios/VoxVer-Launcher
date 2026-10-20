<template>
  <div class="update-page">
    <!-- 页面左上角返回按钮 → 设置 -->
    <button class="back-btn" @click="goBack">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
      {{ t('update.updatePage.back') }}
    </button>

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

        <!-- 加载中 -->
        <div v-if="notesLoading" class="notes-loading">
          <span class="spinner" />
          <span>{{ t('update.updatePage.loadingNotes') }}</span>
        </div>

        <!-- 有结构化分区 → 按卡片展示 -->
        <template v-if="parsedSections.length > 0 && parsedSections.some((s) => s.title)">
          <div v-for="(sec, idx) in parsedSections" :key="idx" class="vox-card notes-card">
            <div class="notes-card-header" v-if="sec.title">
              <span class="notes-card-dot" />
              <span class="notes-card-title">{{ sec.title }}</span>
            </div>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="notes-body" v-html="sec.html" />
          </div>
        </template>

        <!-- 无分区 → 单卡片展示 -->
        <div v-else class="vox-card notes-card">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-if="notesHtml" class="notes-body" v-html="notesHtml" />
          <div v-else class="notes-empty">{{ t('update.updatePage.noNotes') }}</div>
        </div>

        <!-- 归属行（MeowY-Studios / GitHub）单独展示 -->
        <div
          v-if="notesFooterHtml"
          class="notes-footer"
          v-html="notesFooterHtml"
        />
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
  if (!raw) return ''
  // 归属行已在 footer 单独展示，正文剔除
  return renderMarkdown(extractFooter(raw).body)
})

interface ParsedSection {
  title: string
  html: string
}

/** 去掉标题中的 emoji 与装饰符号，只保留文字部分用于匹配 */
function stripEmoji(s: string): string {
  return s.replace(/^[^\w\u4e00-\u9fff\u3000-\u303f]+/, '').trim()
}

/** 归属行正则：**MeowY-Studios (EccenTri)** — [GitHub](...) */
const FOOTER_RE = /^\*\*[^*]*MeowY-Studios[^*]*\*\*\s*[—\-–]?\s*\[[^\]]*\]\([^)]+\)\s*$/m

/** 从原文中抽出归属行并返回清理后的正文 */
function extractFooter(raw: string): { body: string; footer: string } {
  const match = FOOTER_RE.exec(raw)
  if (!match) return { body: raw, footer: '' }
  const body = raw.replace(FOOTER_RE, '').replace(/\n{3,}/g, '\n\n').trim()
  return { body, footer: match[0] }
}

/** 拆分更新内容为独立区块：优先按 Markdown 标题（##/###）拆分 */
const parsedSections = computed<ParsedSection[]>(() => {
  const raw = notesSource.value
  if (!raw) return []

  const { body } = extractFooter(raw)
  const lines = body.replace(/\r\n/g, '\n').split('\n')

  // 有 Markdown 标题 → 只按标题拆分（表格/引用都归入当前段，避免被分割线误切）
  const hasHeading = lines.some((l) => /^#{2,4}\s+/.test(l))

  const sections: ParsedSection[] = []
  let currentTitle = ''
  let currentBody: string[] = []

  const pushCurrent = () => {
    if (currentBody.length > 0 || currentTitle) {
      sections.push({ title: currentTitle, html: renderMarkdown(currentBody.join('\n')) })
    }
    currentTitle = ''
    currentBody = []
  }

  for (const line of lines) {
    if (hasHeading) {
      const h = /^#{2,4}\s+(.*)$/.exec(line)
      if (h) {
        pushCurrent()
        currentTitle = h[1].trim()
        continue
      }
      currentBody.push(line)
      continue
    }

    // 无标题 → 按表格行格式拆分：| 标题 | + | 内容 | + |---|---|
    const sep = /^\|[\s:|-]+\|\s*$/.exec(line)
    if (sep) {
      pushCurrent()
      continue
    }
    const cell = /^\|\s*([^|]*?)\s*\|\s*$/.exec(line)
    if (cell && cell[1].trim()) {
      if (!currentTitle) {
        currentTitle = cell[1].trim()
      } else if (currentBody.length === 0) {
        currentBody.push(cell[1].trim())
        pushCurrent()
      } else {
        currentBody.push(cell[1].trim())
      }
      continue
    }
    currentBody.push(line)
  }

  pushCurrent()

  // 过滤「下载」区块（标题可能带 emoji，如 📦 下载）
  const HIDDEN = new Set(['下载', 'download', 'downloads', '下载链接', 'download links'])
  return sections.filter((s) => !HIDDEN.has(stripEmoji(s.title).toLowerCase()))
})

/** 归属行（MeowY-Studios … GitHub）单独展示 */
const notesFooterHtml = computed(() => {
  const raw = notesSource.value
  if (!raw) return ''
  const { footer } = extractFooter(raw)
  return footer ? renderMarkdown(footer) : ''
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
  router.replace('/settings')
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
/* 全屏覆盖层：遮住侧边栏与主内容区，标题栏（44px）由全局 App.vue 提供，本层 top 留出对应高度 */
.update-page {
  position: fixed;
  top: 44px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  background: var(--voxver-bg-primary);
}

/* 返回按钮：独立于滚动区，始终可见 */
.back-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  margin: 8px 0 0 16px;
  border: none;
  border-radius: 8px;
  background: var(--voxver-bg-tertiary);
  color: var(--voxver-text-muted);
  font-size: 13px;
  width: fit-content;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--voxver-bg-hover);
    color: var(--voxver-text);
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

  /* 子项不收缩：空间不足时滚动，而不是把横幅/卡片压扁 */
  > * {
    flex-shrink: 0;
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

.notes-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--voxver-border-color);
}

.notes-card-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--voxver-accent);
  flex-shrink: 0;
}

.notes-card-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--voxver-text-primary);
}

.notes-footer {
  padding: 12px 18px;
  margin-top: 4px;
  text-align: center;
  font-size: 12px;
  color: var(--voxver-text-muted);
  border-top: 1px solid var(--voxver-border-color);

  :deep(strong) {
    color: var(--voxver-text-secondary);
    font-weight: 600;
  }

  :deep(a) {
    color: var(--voxver-accent);
    text-decoration: none;
    border-bottom: 1px solid color-mix(in oklab, var(--voxver-accent) 30%, transparent);
    transition: border-color 0.15s;

    &:hover {
      border-bottom-color: var(--voxver-accent);
    }
  }
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
  animation: spin 0.8s linear infinite;
}

.notes-body {
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--voxver-text);

  // ── 标题层级 ──
  :deep(h3) {
    margin: 20px 0 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--voxver-border-color);
    font-size: 16px;
    font-weight: 700;
    color: var(--voxver-text-primary);
  }

  :deep(h4) {
    margin: 16px 0 8px;
    font-size: 14.5px;
    font-weight: 600;
    color: var(--voxver-text-primary);
  }

  :deep(h5) {
    margin: 12px 0 6px;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--voxver-text-secondary);
  }

  // ── 段落 ──
  :deep(p) {
    margin: 8px 0;
  }

  // ── 列表 ──
  :deep(ul) {
    margin: 8px 0;
    padding-left: 22px;
  }

  :deep(li) {
    margin: 4px 0;
    padding-left: 2px;

    &::marker {
      color: var(--voxver-text-muted);
    }
  }

  // ── 分割线 ──
  :deep(hr) {
    border: none;
    border-top: 1px solid var(--voxver-border-color);
    margin: 16px 0;
  }

  // ── 行内代码 ──
  :deep(code) {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12.5px;
    font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
    background: color-mix(in oklab, var(--voxver-accent) 10%, var(--voxver-bg-tertiary));
    color: var(--voxver-accent);
  }

  // ── 加粗 ──
  :deep(strong) {
    font-weight: 600;
    color: var(--voxver-text-primary);
  }

  // ── 链接 ──
  :deep(a) {
    color: var(--voxver-accent);
    text-decoration: none;
    border-bottom: 1px solid color-mix(in oklab, var(--voxver-accent) 30%, transparent);
    transition: border-color 0.15s;

    &:hover {
      border-bottom-color: var(--voxver-accent);
    }
  }

  // ── 段落间距辅助 ──
  :deep(.md-gap) {
    height: 8px;
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
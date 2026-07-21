<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal-panel" ref="panelRef">
        <!-- 安装确认弹窗 -->
        <Teleport to="body">
          <div
            v-if="showInstallConfirm && pendingFile && currentInstance"
            class="confirm-overlay"
            @click.self="showInstallConfirm = false"
          >
            <div class="confirm-panel">
              <div class="confirm-header">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--voxver-primary)"
                  stroke-width="2"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                <span>{{ $t('mod.confirmInstall') }}</span>
              </div>
              <div class="confirm-body">
                <p class="confirm-mod-name">
                  {{ pendingFile.displayName || pendingFile.filename }}
                </p>
                <p class="confirm-target">
                  {{ $t('mod.installToInstance') }}<strong>{{ currentInstance.name }}</strong>
                </p>
                <p class="confirm-path">{{ selectedTarget }}</p>
              </div>
              <div class="confirm-actions">
                <button
                  class="btn-cancel"
                  @click="
                    showInstallConfirm = false
                    pendingFile = null
                  "
                >
                  {{ $t('common.cancel') }}
                </button>
                <button class="btn-confirm" @click="confirmDownload">{{ $t('mod.confirmInstall') }}</button>
              </div>
            </div>
          </div>
        </Teleport>

        <!-- 顶部标题 -->
        <div class="modal-header">
          <button class="btn-back" @click="close">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span class="modal-title">{{ $t('mod.resourceDownload', { name: detail?.name || 'Mod' }) }}</span>
          <button class="btn-close" @click="close">
            <svg
              width="16"
              height="16"
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

        <!-- 加载状态 -->
        <div v-if="loading" class="modal-loading">
          <div class="spin"></div>
          <span>{{ $t('common.loading') }}</span>
        </div>

        <!-- 内容 -->
        <div v-else-if="detail" class="modal-content">
          <!-- 基本信息卡片 -->
          <div class="info-card">
            <div class="info-header">
              <div class="mod-icon-wrap">
                <img v-if="detail.iconUrl" :src="detail.iconUrl" :alt="detail.name" />
                <div v-else class="icon-placeholder">{{ detail.name?.[0] || 'M' }}</div>
              </div>
              <div class="mod-info">
                <h2 class="mod-name">{{ detail.name }}</h2>
                <p class="mod-desc">{{ detail.description || $t('mod.noDescription') }}</p>
                <div class="mod-meta">
                  <span class="meta-item">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    {{ formatNum(detail.downloads) }}
                  </span>
                  <span class="meta-item">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    {{ detail.loaders?.join(' / ') || '' }}
                  </span>
                  <span class="meta-item time">{{ lastUpdateTime }}</span>
                  <span
                    class="meta-item source"
                    :class="detail.source === 'curseforge' ? 'cf' : 'mr'"
                  >
                    {{ detail.source === 'curseforge' ? $t('mod.curseforge') : $t('mod.modrinth') }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="info-actions">
              <button class="btn-action primary" @click="openInBrowser">
                {{ detail.source === 'curseforge' ? $t('mod.goToCurseforge') : $t('mod.goToModrinth') }}
              </button>
              <button class="btn-action" @click="openMcWiki">{{ $t('mod.goToMcWiki') }}</button>
              <button class="btn-action" @click="copyName">{{ $t('mod.copyName') }}</button>
            </div>
          </div>

          <!-- MC版本标签 -->
          <div v-if="mcVersions.length" class="version-tabs">
            <button
              class="version-tab"
              :class="{ active: !selectedMcVersion }"
              @click="selectMcVersion('')"
            >
              {{ $t('mod.all') }}
            </button>
            <button
              v-for="v in mcVersions"
              :key="v"
              class="version-tab"
              :class="{ active: selectedMcVersion === v }"
              @click="selectMcVersion(v)"
            >
              {{ v }}
            </button>
          </div>

          <!-- 版本文件列表（按MC版本分组） -->
          <div class="files-section">
            <div v-if="filesLoading" class="files-loading">
              <div class="spin-sm"></div>
              <span>{{ $t('mod.loadingFiles') }}</span>
            </div>

            <div v-else-if="!files.length" class="files-empty">{{ $t('mod.noFilesAvailable') }}</div>

            <div v-else class="versions-list">
              <div
                v-for="(group, mcVersion) in groupedFiles"
                :key="mcVersion"
                class="version-group"
              >
                <button
                  class="group-header"
                  :class="{ expanded: expandedVersions.includes(mcVersion) }"
                  @click="toggleVersion(mcVersion)"
                >
                  <span class="group-version">{{ mcVersion }}</span>
                  <span class="group-count">{{ $t('mod.nFiles', { n: group.length }) }}</span>
                  <svg
                    class="group-arrow"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div v-if="expandedVersions.includes(mcVersion)" class="group-files">
                  <div v-for="file in group" :key="file.id" class="file-row">
                    <div class="file-info">
                      <span class="file-name">{{ file.displayName || file.filename }}</span>
                      <span class="file-meta">
                        <span>{{ formatSize(file.size) }}</span>
                        <span>{{ formatDate(file.datePublished) }}</span>
                        <span>{{ $t('mod.nDownloads', { n: formatNum(file.downloads) }) }}</span>
                      </span>
                    </div>
                    <div class="file-loaders">
                      <span v-for="loader in file.loaders" :key="loader" class="loader-tag">{{
                        loader
                      }}</span>
                    </div>
                    <button
                      class="btn-download"
                      :disabled="!selectedTarget || downloadingId === file.id"
                      @click="downloadFile(file)"
                    >
                      <svg
                        v-if="downloadingId === file.id"
                        class="spin-sm"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                      <svg
                        v-else
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                      >
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                      </svg>
                      {{ downloadingId === file.id ? $t('mod.downloadingStatus') : $t('common.download') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-else class="modal-error">
          <p>{{ $t('mod.loadingDetail') }}</p>
          <button class="btn-retry" @click="loadDetail">{{ $t('common.retry') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useInstancesStore } from '../../stores/instances.store'
import { useDownloadStore } from '../../stores/download.store'
import type { ModSearchResult, ProjectFile } from '../../types/download'
import type { GameInstance } from '../../types/instance'
import { formatNumber } from '../../utils/format'

// * ====== Props & Emits ======

interface Props {
  modelValue: boolean
  mod: ModSearchResult | null
  /** 从版本设置页跳转时传入当前实例，下载目标自动填入 */
  instance?: GameInstance | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

// * ====== Stores ======

const instancesStore = useInstancesStore()
const dlStore = useDownloadStore()
const { t } = useI18n()

// * ====== 状态 ======

const panelRef = ref<HTMLElement | null>(null)
const loading = ref(false)
const filesLoading = ref(false)
const detail = ref<ModSearchResult | null>(null)
const files = ref<ProjectFile[]>([])
const downloadingId = ref<string | null>(null)
const selectedInstanceId = ref('')
const showInstallConfirm = ref(false)
const pendingFile = ref<ProjectFile | null>(null)
const selectedMcVersion = ref('')
const expandedVersions = ref<string[]>([])

// * ====== 计算属性 ======

/** 当前选中的实例（props 传入优先，否则用下拉选择） */
const currentInstance = computed(() => {
  if (props.instance) return props.instance
  if (selectedInstanceId.value) {
    return instancesStore.instances.find((i) => i.id === selectedInstanceId.value) ?? null
  }
  return instancesStore.currentInstance
})

/** 是否有自动实例上下文（从版本设置页跳转） */
const autoInstance = computed(() => !!props.instance)

/** 下载目标路径 */
const selectedTarget = computed(() => {
  if (!currentInstance.value) return null
  return getInstanceModsPath(currentInstance.value.id)
})

/** 过滤后的文件列表（按发布日期倒序） */
const filteredFiles = computed(() => {
  return [...files.value].sort(
    (a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime()
  )
})

function isSnapshotVersion(v: string): boolean {
  return (
    v.includes('w') || v.toLowerCase().includes('snapshot') || v.includes('pre') || v.includes('rc')
  )
}

/** 所有 MC 版本列表（快照版合并到单独分组） */
const mcVersions = computed(() => {
  const versions = new Set<string>()
  let hasSnapshot = false

  files.value.forEach((file) => {
    file.gameVersions.forEach((v) => {
      const baseVersion = v.split('-')[0]
      if (isSnapshotVersion(baseVersion)) {
        hasSnapshot = true
      } else {
        const parts = baseVersion.split('.').slice(0, 2)
        const mainVersion = parts.join('.')
        versions.add(mainVersion)
      }
    })
  })

  const sortedVersions = Array.from(versions).sort((a, b) => {
    const aParts = a.split('.').map(Number)
    const bParts = b.split('.').map(Number)
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      if ((aParts[i] || 0) !== (bParts[i] || 0)) {
        return (bParts[i] || 0) - (aParts[i] || 0)
      }
    }
    return 0
  })

  if (hasSnapshot) {
    sortedVersions.push(t('mod.snapshotLabel'))
  }

  return sortedVersions
})

const hasSnapshotVersions = computed(() => {
  return files.value.some((file) =>
    file.gameVersions.some((v) => isSnapshotVersion(v.split('-')[0]))
  )
})

/** 按版本筛选后的文件列表 */
const versionFilteredFiles = computed(() => {
  if (!selectedMcVersion.value) {
    return filteredFiles.value
  }

  if (selectedMcVersion.value === t('mod.snapshotLabel')) {
    return filteredFiles.value.filter((f) =>
      f.gameVersions.some((v) => isSnapshotVersion(v.split('-')[0]))
    )
  }

  return filteredFiles.value.filter((f) =>
    f.gameVersions.some((v) => v.startsWith(selectedMcVersion.value))
  )
})

/** 按 MC 版本分组的文件列表 */
const groupedFiles = computed(() => {
  const filtered = versionFilteredFiles.value
  const groups: Record<string, ProjectFile[]> = {}

  filtered.forEach((file) => {
    file.gameVersions.forEach((mcVersion) => {
      if (!groups[mcVersion]) {
        groups[mcVersion] = []
      }
      if (!groups[mcVersion].find((f) => f.id === file.id)) {
        groups[mcVersion].push(file)
      }
    })
  })

  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const aParts = a.split('.').map(Number)
    const bParts = b.split('.').map(Number)
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      if ((aParts[i] || 0) !== (bParts[i] || 0)) {
        return (bParts[i] || 0) - (aParts[i] || 0)
      }
    }
    return 0
  })

  const result: Record<string, ProjectFile[]> = {}
  sortedKeys.forEach((key) => {
    result[key] = groups[key]
  })

  return result
})

/** 最后更新时间 */
const lastUpdateTime = computed(() => {
  if (!files.value.length) return ''
  const latest = files.value.reduce((prev, curr) => {
    return new Date(curr.datePublished).getTime() > new Date(prev.datePublished).getTime()
      ? curr
      : prev
  })
  const diff = Date.now() - new Date(latest.datePublished).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return t('mod.todayUpdated')
  if (days === 1) return t('mod.yesterdayUpdated')
  if (days < 7) return t('mod.daysAgo', { n: days })
  if (days < 30) return t('mod.weeksAgo', { n: Math.floor(days / 7) })
  if (days < 365) return t('mod.monthsAgo', { n: Math.floor(days / 30) })
  return t('mod.yearsAgo', { n: Math.floor(days / 365) })
})

// ====== 生命周期 ======

watch(
  () => props.modelValue,
  async (val) => {
    if (val && props.mod) {
      await loadAll()
    }
  }
)

watch(
  () => props.mod,
  async (mod, oldMod) => {
    if (mod && oldMod && mod.id !== oldMod.id) {
      await loadAll()
    }
  }
)

// * 当切换选择实例时刷新目标路径提示
watch(selectedInstanceId, async () => {
  await instancesStore.fetchInstances()
})

// * ====== 加载数据 ======

async function loadAll() {
  loading.value = true
  detail.value = null
  files.value = []
  selectedInstanceId.value = ''
  selectedMcVersion.value = ''
  expandedVersions.value = []

  if (!props.mod) {
    loading.value = false
    return
  }

  const currentMod = { ...props.mod }

  detail.value = {
    id: currentMod.id,
    name: currentMod.name,
    author: currentMod.author || '',
    description: currentMod.description || '',
    iconUrl: currentMod.iconUrl,
    downloads: currentMod.downloads || 0,
    follows: currentMod.follows || 0,
    source: currentMod.source,
    categories: currentMod.categories || [],
    gameVersions: currentMod.gameVersions || [],
    loaders: currentMod.loaders || []
  }

  try {
    await loadFiles()
  } catch (e) {
    console.error('Failed to load files:', e)
  } finally {
    loading.value = false
  }
}

async function loadFiles() {
  if (!props.mod) return
  filesLoading.value = true

  const projectId = props.mod.id
  if (!projectId || projectId.length < 3) {
    filesLoading.value = false
    return
  }
  try {
    const res = await window.electronAPI?.download.getFiles(props.mod.id, props.mod.source, {})
    const data = (res as unknown as { data?: Record<string, unknown>[] })?.data || []
    files.value = data.map((f: Record<string, unknown>) => ({
      id: String(f.id),
      filename: f.fileName || f.filename || '',
      displayName: f.displayName || f.fileName || f.filename || '',
      size: f.size ?? 0,
      downloadUrl: f.downloadUrl || f.url || '',
      gameVersions: f.gameVersions || f.gameVersion || [],
      loaders: f.loaders || [],
      releaseType: (f.releaseType || f.release_type || 'release') as 'release' | 'beta' | 'alpha',
      datePublished: f.datePublished || f.date_published || f.date || '',
      downloads: f.downloads ?? 0
    })) as ProjectFile[]
  } catch (e) {
    files.value = []
  } finally {
    filesLoading.value = false
  }
}

async function loadDetail() {
  await loadAll()
}

function selectMcVersion(version: string) {
  selectedMcVersion.value = version
  if (version) {
    expandedVersions.value = [version]
  } else {
    expandedVersions.value = ['']
  }
}

// * ====== 兼容性判断 ======

/**
 * 判断文件是否与当前实例兼容
 * 同时检查 MC 版本和加载器是否兼容
 */
function isCompatible(file: ProjectFile): boolean {
  if (!currentInstance.value) return true
  const inst = currentInstance.value

  // MC 版本兼容
  const mcCompat = file.gameVersions.some(
    (gv) => gv === inst.mcVersion || gv.startsWith(inst.mcVersion + '.')
  )

  // 加载器兼容（vanilla 不检查）
  const loaderCompat =
    !inst.loaderType ||
    inst.loaderType === 'vanilla' ||
    file.loaders.some((l) => l.toLowerCase() === inst.loaderType!.toLowerCase())

  return mcCompat && loaderCompat
}

/**
 * 是否为推荐版本（与当前实例最匹配的版本）
 */
function isRecommended(file: ProjectFile): boolean {
  if (!currentInstance.value) return false
  return file.gameVersions.includes(currentInstance.value.mcVersion)
}

// ====== 下载 ======

async function downloadFile(file: ProjectFile) {
  if (!selectedTarget.value) {
    window.electronAPI?.notification?.send({
      title: t('mod.tip'),
      body: t('mod.selectTargetFirst'),
      type: 'warning'
    })
    return
  }

  // * 先弹出安装确认弹窗
  pendingFile.value = file
  showInstallConfirm.value = true
}

async function confirmDownload() {
  const file = pendingFile.value
  if (!file) return

  showInstallConfirm.value = false
  pendingFile.value = null

  // 完整目标路径 = 实例mods目录 / 文件名
  const target = `${selectedTarget.value}${file.filename || file.displayName}`
  downloadingId.value = file.id
  try {
    const download = window.electronAPI?.download as unknown as Record<string, (params: Record<string, unknown>) => Promise<{ success?: boolean; error?: string }>>
    const res = await download?.file({
      id: file.id,
      fileName: file.filename || file.displayName,
      url: file.downloadUrl,
      gameVersions: file.gameVersions,
      loaders: file.loaders,
      releaseType: file.releaseType,
      datePublished: file.datePublished,
      size: file.size,
      downloads: file.downloads,
      destination: target
    })

    if (res?.success) {
      await dlStore.refreshQueue()
    } else {
      window.electronAPI?.notification?.send({
        title: t('common.error'),
        body: t('mod.downloadFailedBody', { error: res?.error || t('mod.unknownError') }),
        type: 'error'
      })
    }
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: t('mod.downloadErrorBody', { error: (e as Error).message || t('mod.unknownError') }),
      type: 'error'
    })
  } finally {
    downloadingId.value = null
  }
}

// * ====== 工具 ======

function getInstanceModsPath(instanceId: string): string {
  const inst = instancesStore.instances.find((i) => i.id === instanceId)
  if (!inst) return ''
  return `${inst.path}/mods/`
}

function close() {
  emit('update:modelValue', false)
}

function toggleVersion(mcVersion: string) {
  const idx = expandedVersions.value.indexOf(mcVersion)
  if (idx > -1) {
    expandedVersions.value.splice(idx, 1)
  } else {
    expandedVersions.value.push(mcVersion)
  }
}

function openInBrowser() {
  if (!detail.value) return
  const url =
    detail.value.source === 'curseforge'
      ? `https://www.curseforge.com/minecraft/mc-mods/${detail.value.id}`
      : `https://modrinth.com/mod/${detail.value.id}`
  ;(window.electronAPI as unknown as { openExternal: (url: string) => Promise<void> })?.openExternal(url)
}

function openMcWiki() {
  if (!detail.value) return
  const name = encodeURIComponent(detail.value.name)
  ;(window.electronAPI as unknown as { openExternal: (url: string) => Promise<void> })?.openExternal(`https://minecraft.fandom.com/zh/wiki/${name}`)
}

async function copyName() {
  if (!detail.value) return
  try {
    await navigator.clipboard.writeText(detail.value.name)
    window.electronAPI?.notification?.send({ title: t('common.success'), body: t('mod.nameCopied'), type: 'success' })
  } catch {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('mod.copyFailed'), type: 'error' })
  }
}

function formatNum(n: number | undefined): string {
  return formatNumber(n ?? 0)
}

function formatSize(bytes: number): string {
  if (!bytes) return t('mod.unknownVersion')
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return dateStr
  }
}
</script>

<style scoped lang="scss">
/* * ====== 遮罩 + 面板 ====== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-panel {
  width: 640px;
  max-width: 95vw;
  max-height: 85vh;
  background: var(--voxver-bg-elevated);
  border: 1px solid var(--voxver-border-color);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 60px rgb(0 0 0 / 0.5);
}

/* ====== 头部 ====== */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--voxver-border-color);
  flex-shrink: 0;
  gap: 12px;
}

.btn-back {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--voxver-text-muted);
  cursor: pointer;
  border-radius: var(--voxver-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;

  &:hover {
    background: var(--voxver-bg-hover, rgb(255 255 255 / 0.06));
    color: var(--voxver-text-primary);
  }
}

.modal-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--voxver-text-primary);
  text-align: center;
}

.btn-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--voxver-text-muted);
  cursor: pointer;
  border-radius: var(--voxver-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;

  &:hover {
    background: var(--voxver-bg-hover, rgb(255 255 255 / 0.06));
    color: var(--voxver-text-primary);
  }
}

/* ====== 加载/错误提示 ====== */
.modal-loading,
.modal-error,
.files-loading,
.files-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 20px;
  color: var(--voxver-text-muted);
  font-size: 13px;
}

.modal-error {
  .btn-retry {
    padding: 6px 20px;
    border: 1px solid var(--voxver-border-color);
    border-radius: var(--voxver-radius-sm);
    background: transparent;
    color: var(--voxver-text-secondary);
    cursor: pointer;
    font-size: 13px;
    margin-top: 8px;
    transition: all 0.12s;
    &:hover {
      border-color: var(--voxver-primary-400);
      color: var(--voxver-primary-400);
    }
  }
}

/* ====== 滚动内容 ====== */
.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--voxver-bg-hover);
    border-radius: 3px;
  }
}

/* * ====== 基本信息卡片 ====== */
.info-card {
  background: var(--voxver-surface);
  border: 1px solid var(--voxver-border-color);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
}

.info-header {
  display: flex;
  gap: 14px;
  margin-bottom: 14px;
}

.mod-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: var(--voxver-radius-md);
  overflow: hidden;
  background: var(--voxver-bg-secondary);
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .icon-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 24px;
    font-weight: 700;
  }
}

.mod-info {
  flex: 1;
  min-width: 0;
}

.mod-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--voxver-text-primary);
  margin: 0 0 4px;
  word-break: break-word;
}

.mod-desc {
  font-size: 12px;
  color: var(--voxver-text-secondary);
  margin: 0 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mod-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--voxver-text-muted);

  .meta-item {
    display: flex;
    align-items: center;
    gap: 2px;

    svg {
      color: var(--voxver-success);
    }

    &.time {
      color: var(--voxver-text-muted);
    }

    &.source {
      &.mr {
        color: #1bd96a;
      }
      &.cf {
        color: #f16436;
      }
    }
  }
}

.info-actions {
  display: flex;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--voxver-border-color);
}

.btn-action {
  flex: 1;
  height: 30px;
  padding: 0 12px;
  background: var(--voxver-bg-secondary);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  color: var(--voxver-text-secondary);
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.12s;

  &:hover {
    border-color: var(--voxver-primary-400);
    color: var(--voxver-primary-400);
  }

  &.primary {
    background: var(--voxver-primary);
    border-color: var(--voxver-primary);
    color: #fff;

    &:hover {
      background: var(--voxver-primary-hover);
      border-color: var(--voxver-primary-hover);
    }
  }
}

/* * ====== 安装目标选择 ====== */
.target-section {
  background: var(--voxver-bg-secondary);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  padding: 12px 14px;
  margin-bottom: 20px;
}

.target-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--voxver-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.target-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.target-select {
  flex: 1;
  min-width: 200px;
  padding: 7px 10px;
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  background: var(--voxver-bg-elevated);
  color: var(--voxver-text-primary);
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.12s;

  &:focus {
    border-color: var(--voxver-primary-400);
  }
}

.target-path {
  font-size: 11px;
  color: var(--voxver-text-muted);
  font-family: var(--voxver-font-mono, monospace);
  word-break: break-all;
}

.target-hint {
  font-size: 12px;
  color: var(--voxver-text-error);
  margin: 4px 0 0;
}

/* ====== 文件列表 ====== */
.files-section {
  margin-bottom: 8px;
}

.files-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.files-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--voxver-text-primary);
}

.files-count {
  font-size: 11px;
  color: var(--voxver-text-muted);
}

/* MC版本标签 */
.version-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--voxver-border-color);
}

.version-tab {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 400;
  color: var(--voxver-text-secondary);
  background: var(--voxver-bg-secondary);
  border: 1px solid var(--voxver-border-color);
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.12s;

  &:hover {
    border-color: var(--voxver-primary-400);
    color: var(--voxver-primary-400);
  }

  &.active {
    background: var(--voxver-primary-light, color-mix(in oklab, var(--voxver-primary) 12%, transparent));
    border-color: var(--voxver-primary-400);
    color: var(--voxver-primary-300);
  }
}

/* * 版本分组列表 */
.versions-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.version-group {
  background: var(--voxver-surface);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  overflow: hidden;
}

.group-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: var(--voxver-bg-hover, rgb(255 255 255 / 0.03));
  }

  &.expanded {
    background: color-mix(in oklab, var(--voxver-primary) 5%, transparent);
  }
}

.group-version {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}

.group-count {
  font-size: 11px;
  color: var(--voxver-text-muted);
  margin-right: 8px;
}

.group-arrow {
  color: var(--voxver-text-muted);
  transition: transform 0.2s;
}

.expanded .group-arrow {
  transform: rotate(180deg);
}

.group-files {
  border-top: 1px solid var(--voxver-border-color);
}

.file-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--voxver-border-color);
  transition: background 0.12s;

  &:hover {
    background: var(--voxver-bg-hover, rgb(255 255 255 / 0.03));
  }

  &:last-child {
    border-bottom: none;
  }
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-info .file-name {
  font-size: 12px;
  font-weight: 400;
  color: var(--voxver-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-info .file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
  font-size: 11px;
  color: var(--voxver-text-muted);

  span {
    &:not(:last-child)::after {
      content: '|';
      margin-left: 8px;
      color: var(--voxver-text-muted);
    }
  }
}

.file-loaders {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.loader-tag {
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 400;
  background: var(--voxver-bg-secondary);
  color: var(--voxver-text-secondary);
  border-radius: 3px;
  border: 1px solid var(--voxver-border-color);
}

.files-loading {
  flex-direction: row;
  padding: 16px;
  font-size: 12px;
}

.files-empty {
  padding: 20px;
  font-size: 13px;
}

/* ====== 文件项 ====== */
.file-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: var(--voxver-bg-secondary);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  transition: all 0.12s;

  &:hover {
    border-color: var(--voxver-primary-300);
  }

  &.incompatible {
    border-color: rgb(243 139 168 / 0.4);
    &:hover {
      border-color: rgb(243 139 168 / 0.6);
    }
  }

  &.recommended {
    border-color: rgb(166 227 161 / 0.3);
    background: rgb(166 227 161 / 0.03);
    &:hover {
      border-color: rgb(166 227 161 / 0.5);
    }
  }
}

.file-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.file-top {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.file-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text-primary);
  word-break: break-all;
}

.release-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 3px;

  &.release {
    background: rgb(166 227 161 / 0.1);
    color: var(--voxver-success);
  }
  &.beta {
    background: rgb(249 200 70 / 0.1);
    color: #f9c200;
  }
  &.alpha {
    background: rgb(243 139 168 / 0.1);
    color: var(--voxver-text-error);
  }
}

.rec-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgb(166 227 161 / 0.15);
  color: var(--voxver-success);
  border: 1px solid rgb(166 227 161 / 0.2);
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: var(--voxver-text-muted);
}

/* * ====== 兼容性标签 ====== */
.compat-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.compat-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.compat-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--voxver-text-muted);
  min-width: 36px;
}

.compat-tag {
  font-size: 10px;
  padding: 1px 6px;
  background: var(--voxver-bg-elevated);
  color: var(--voxver-text-secondary);
  border-radius: 3px;
  border: 1px solid var(--voxver-border-color);
  transition: all 0.1s;

  &.current {
    background: rgb(166 227 161 / 0.1);
    color: var(--voxver-success);
    border-color: rgb(166 227 161 / 0.3);
    font-weight: 600;
  }
}

.compat-more {
  font-size: 10px;
  color: var(--voxver-text-muted);
}

.incompat-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--voxver-text-error);
  margin-top: 2px;

  svg {
    flex-shrink: 0;
  }
}

/* * ====== 下载按钮 ====== */
.file-action {
  flex-shrink: 0;
  padding-top: 2px;
}

.btn-download {
  height: 32px;
  padding: 0 16px;
  background: var(--voxver-gradient-primary, linear-gradient(135deg, var(--voxver-primary), #0ea5e9));
  border: none;
  border-radius: var(--voxver-radius-sm);
  color: #fff;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.14s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
  }
}

/* ====== Spinner ====== */
.spin {
  width: 28px;
  height: 28px;
  border: 2px solid var(--voxver-border-color);
  border-top-color: var(--voxver-primary-400);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.spin-sm {
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* * ====== 安装确认弹窗 ====== */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

.confirm-panel {
  width: 400px;
  max-width: 90vw;
  background: var(--voxver-bg-elevated);
  border: 1px solid var(--voxver-border-color);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 16px 48px rgb(0 0 0 / 0.5);
}

.confirm-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--voxver-border-color);
  font-size: 14px;
  font-weight: 700;
  color: var(--voxver-text-primary);
}

.confirm-body {
  padding: 16px 18px;
}

.confirm-mod-name {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text-primary);
  word-break: break-all;
}

.confirm-target {
  margin: 0 0 4px;
  font-size: 13px;
  color: var(--voxver-text-secondary);

  strong {
    color: var(--voxver-primary-400);
  }
}

.confirm-path {
  margin: 0;
  font-size: 11px;
  color: var(--voxver-text-muted);
  font-family: var(--voxver-font-mono, monospace);
  word-break: break-all;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid var(--voxver-border-color);
}

.btn-cancel {
  padding: 7px 20px;
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  background: transparent;
  color: var(--voxver-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.12s;

  &:hover {
    border-color: var(--voxver-text-muted);
    color: var(--voxver-text-primary);
  }
}

.btn-confirm {
  padding: 7px 20px;
  border: none;
  border-radius: var(--voxver-radius-sm);
  background: var(--voxver-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.14s;

  &:hover {
    filter: brightness(1.1);
  }
}
</style>

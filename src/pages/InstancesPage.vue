<template>
  <div class="instances-page" :class="{ 'is-kor': isKoring }">
    <!-- 左侧：游戏目录（读取设置里配置的 .minecraft 目录）+ 添加与导入 -->
    <aside class="inst-rail">
      <div class="inst-rail__group">
        <span class="inst-rail__title">{{ t('instance.gameFolders') }}</span>
        <button
          v-for="folder in folders"
          :key="folder.path"
          type="button"
          class="inst-folder"
          :class="{ 'is-active': activeFolder === folder.path }"
          :title="folder.path"
          @click="toggleFolder(folder.path)"
          @contextmenu.prevent="openFolderMenu($event, folder)"
        >
          <svg
            class="inst-folder__icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            aria-hidden="true"
          >
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          <span class="inst-folder__text">
            <span class="inst-folder__name">{{ folder.name }}</span>
            <span class="inst-folder__path">{{ folder.path }}</span>
          </span>
          <span class="inst-folder__count">{{ folder.versions.length }}</span>
        </button>

        <p v-if="!loading && folders.length === 0" class="inst-rail__empty">
          {{ t('instance.emptyDesc') }}
        </p>
      </div>

      <div class="inst-rail__group">
        <span class="inst-rail__title">{{ t('instance.addAndImport') }}</span>
        <button type="button" class="inst-action" :disabled="importing" @click="importFolder">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>{{ importing ? t('instance.importing') : t('instance.importFolder') }}</span>
        </button>
        <button type="button" class="inst-action" @click="refresh">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            aria-hidden="true"
          >
            <polyline points="21 4 21 10 15 10" />
            <path d="M20.5 15a8.5 8.5 0 1 1-2.3-8.4L21 10" />
          </svg>
          <span>{{ t('instance.refresh') }}</span>
        </button>
        <button type="button" class="inst-action" @click="router.push('/downloads')">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>{{ t('instance.newInstance') }}</span>
        </button>
      </div>
    </aside>

    <!-- 右侧：该目录下的已安装版本 -->
    <main class="inst-main">
      <div v-if="loading" class="inst-state">{{ t('common.loading') }}</div>

      <div v-else-if="visibleVersions.length === 0" class="inst-state inst-state--empty">
        <p class="inst-state__title">{{ t('instance.noVersionsTitle') }}</p>
        <p class="inst-state__desc">{{ t('instance.noVersionsDesc') }}</p>
      </div>

      <ul v-else class="inst-list">
        <li
          v-for="ver in visibleVersions"
          :key="`${ver.folderPath}::${ver.id}`"
          class="inst-card"
          :class="{ 'is-active': isSelected(ver) }"
          @click="openVersion(ver)"
          @dblclick="launchVersion(ver)"
        >
          <span class="inst-card__icon">
            <img src="/minecraft-grass-block.png" alt="" class="inst-card__icon-img" />
          </span>
          <span class="inst-card__body">
            <span class="inst-card__name">{{ ver.name }}</span>
            <span class="inst-card__meta">{{ versionMeta(ver) }}</span>
          </span>
          <svg
            v-if="isSelected(ver)"
            class="inst-card__check"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            aria-hidden="true"
          >
            <polyline points="4 12 9 17 20 6" />
          </svg>
        </li>
      </ul>
    </main>

    <!-- 右键菜单：仅从启动器移除目录，不删除磁盘文件 -->
    <Teleport to="body">
      <div
        v-if="ctxMenu"
        class="inst-ctx"
        :style="{ left: `${ctxMenu.x}px`, top: `${ctxMenu.y}px` }"
        @click.stop
      >
        <button type="button" class="inst-ctx__danger" @click="removeFolder()">
          {{ t('instance.removeFolder') }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAppStore, useVersionsStore } from '../stores'
import { useConfirm } from '@/composables/useConfirm'

interface ScannedVersion {
  id: string
  name: string
  type?: string
  baseVersion?: string
  loaderInfo?: string
}

interface FolderEntry {
  path: string
  name: string
  versions: ScannedVersion[]
}

interface VersionItem extends ScannedVersion {
  folderPath: string
  folderName: string
}

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()
const versionsStore = useVersionsStore()
const { confirm: pxConfirm } = useConfirm()

const isKoring = computed(() => appStore.skin === 'koring')
/** 模块级缓存：来回切页面时先秒出上次的结果，再后台刷新，避免每次挂载都闪一下 loading */
let folderCache: FolderEntry[] | null = null
const folders = ref<FolderEntry[]>(folderCache ?? [])
const loading = ref(folderCache === null)
const importing = ref(false)

/** 上次选中的游戏目录（持久化：从别的页面回来也停在这个目录） */
const FOLDER_KEY = 'voxver_last_game_folder'
const VERSION_PATH_KEY = 'voxver_last_version_path'
function readStored(key: string): string {
  try {
    return localStorage.getItem(key) || ''
  } catch {
    return ''
  }
}
function writeStored(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

const activeFolder = ref<string | null>(readStored(FOLDER_KEY) || null)

/** 当前展开的目录；未选中时展示全部目录下的版本 */
const visibleVersions = computed<VersionItem[]>(() => {
  const list: VersionItem[] = []
  for (const folder of folders.value) {
    if (activeFolder.value && folder.path !== activeFolder.value) continue
    for (const ver of folder.versions) {
      list.push({ ...ver, folderPath: folder.path, folderName: folder.name })
    }
  }
  return list
})

function baseName(dir: string): string {
  const parts = dir.replace(/[\\/]+$/, '').split(/[\\/]/)
  const last = parts[parts.length - 1] || dir
  // `.minecraft` 目录名称千篇一律，用上级目录名（如 Zombie100）便于区分
  if (/^\.minecraft$/i.test(last) && parts.length > 1) return parts[parts.length - 2]
  return last
}

/** 同步为启动器当前游戏目录（设置页的「当前文件夹」读取同一个值） */
async function persistActiveFolder(path: string) {
  writeStored(FOLDER_KEY, path)
  try {
    await window.electronAPI?.folders?.setLast?.(path)
  } catch {
    /* ignore */
  }
}

function toggleFolder(path: string) {
  const next = activeFolder.value === path ? null : path
  activeFolder.value = next
  if (next) {
    void persistActiveFolder(next)
  } else {
    writeStored(FOLDER_KEY, '')
  }
}

/** 右键菜单：{ x, y, folder } */
const ctxMenu = ref<{ x: number; y: number; folder: FolderEntry } | null>(null)

function openFolderMenu(e: MouseEvent, folder: FolderEntry) {
  e.preventDefault()
  ctxMenu.value = { x: e.clientX, y: e.clientY, folder }
}

function closeFolderMenu() {
  ctxMenu.value = null
}

/** 规范化路径用于比较（忽略结尾斜杠） */
function normalizePath(p: string): string {
  return p.replace(/[\\/]+$/, '')
}

/** 用户主动增删过目录后，不再自动回退到默认 .minecraft 目录 */
const FOLDER_TOUCHED_KEY = 'voxver_folders_touched'
function hasTouchedFolders(): boolean {
  try {
    return localStorage.getItem(FOLDER_TOUCHED_KEY) === '1'
  } catch {
    return false
  }
}
function markFoldersTouched() {
  try {
    localStorage.setItem(FOLDER_TOUCHED_KEY, '1')
  } catch {
    /* ignore */
  }
}

/**
 * 仅从启动器移除目录路径，不删除磁盘上的任何文件
 */
async function removeFolder() {
  const menu = ctxMenu.value
  ctxMenu.value = null
  if (!menu) return

  const confirmed = await pxConfirm({
    title: t('instance.removeFolderTitle', { name: menu.folder.name }),
    message: t('instance.removeFolderDesc'),
    type: 'warning',
    confirmText: t('instance.removeFolder')
  })
  if (!confirmed) return

  const target = normalizePath(menu.folder.path)
  await window.electronAPI?.folders?.remove?.(menu.folder.path)
  markFoldersTouched()

  // 本地同步移除，避免目录清空后 loadFolders 又回退到默认目录
  folders.value = folders.value.filter((f) => normalizePath(f.path) !== target)
  folderCache = folders.value

  if (activeFolder.value && normalizePath(activeFolder.value) === target) {
    activeFolder.value = null
    writeStored(FOLDER_KEY, '')
  }
  const storedPath = readStored(VERSION_PATH_KEY)
  if (storedPath && normalizePath(storedPath).startsWith(target)) {
    writeStored(VERSION_PATH_KEY, '')
  }
}

function versionMeta(ver: VersionItem): string {
  const loader = ver.loaderInfo?.trim() || t('instance.vanilla')
  const mc = ver.baseVersion?.trim()
  const parts = [loader]
  if (mc && mc !== ver.loaderInfo) parts.push(mc)
  if (!activeFolder.value && ver.folderName) parts.push(ver.folderName)
  return parts.filter(Boolean).join(' · ')
}

function isSelected(ver: VersionItem): boolean {
  if (versionsStore.currentVersionId !== ver.id) return false
  // 不同目录可能有同名版本：有记录时再比一次目录，避免两边同时显示选中
  const storedPath = readStored(VERSION_PATH_KEY)
  if (!storedPath) return true
  return storedPath.replace(/[\\/]+$/, '') === ver.folderPath.replace(/[\\/]+$/, '')
}

/** 选中版本：写回当前版本 + 记住所在目录，并跳到启动页（是否开跑由用户决定） */
function selectVersion(ver: VersionItem) {
  versionsStore.setCurrentVersion(ver.id)
  writeStored('voxver_last_version', ver.id)
  writeStored('voxver_last_version_name', ver.name)
  writeStored(VERSION_PATH_KEY, ver.folderPath)
  activeFolder.value = ver.folderPath
  void persistActiveFolder(ver.folderPath)
}

/** 单击：选中并回到启动页（首页 /），由用户决定是否开跑 */
function openVersion(ver: VersionItem) {
  selectVersion(ver)
  router.push('/')
}

/** 双击：选中并直接进启动页自动启动 */
function launchVersion(ver: VersionItem) {
  selectVersion(ver)
  router.push({ path: '/launch', query: { autostart: '1' } })
}

/** 读取「设置 → 游戏目录」里配置的 .minecraft 目录，并扫描各自的 versions 目录 */
async function loadFolders(silent = false) {
  if (!silent) loading.value = true
  try {
    const api = window.electronAPI
    let paths: string[] = []
    try {
      paths = (await api?.folders?.list?.()) || []
    } catch {
      paths = []
    }
    if (paths.length === 0 && !hasTouchedFolders()) {
      const fallback = await api?.path?.getMinecraft?.()
      if (fallback) paths = [fallback]
    }

    const entries: FolderEntry[] = []
    for (const dir of paths) {
      let versions: ScannedVersion[] = []
      try {
        const raw = (await api?.versions?.scanFolder?.(dir)) as
          | { ok?: boolean; data?: ScannedVersion[] }
          | undefined
        if (raw?.ok && Array.isArray(raw.data)) versions = raw.data
      } catch {
        versions = []
      }
      entries.push({ path: dir, name: baseName(dir), versions })
    }
    folders.value = entries
    folderCache = entries
    // 目录列表变化后校正选中目录：原来那个没了就退回到「上次选中版本所在的目录」
    const exists =
      activeFolder.value &&
      entries.some(
        (e) => e.path.replace(/[\\/]+$/, '') === activeFolder.value!.replace(/[\\/]+$/, '')
      )
    if (!exists) {
      const storedPath = readStored(VERSION_PATH_KEY)
      const match =
        storedPath &&
        entries.find((e) => e.path.replace(/[\\/]+$/, '') === storedPath.replace(/[\\/]+$/, ''))
      activeFolder.value = match ? match.path : null
      writeStored(FOLDER_KEY, activeFolder.value ?? '')
    }
  } finally {
    loading.value = false
  }
}

async function refresh() {
  await loadFolders()
}

/** 导入已有 .minecraft 目录：加入游戏目录列表后重新扫描 */
async function importFolder() {
  const dir = await window.electronAPI?.dialog.selectFolder({ title: t('instance.importFolder') })
  if (!dir) return
  importing.value = true
  try {
    await window.electronAPI?.folders?.add?.(dir)
    markFoldersTouched()
    await loadFolders()
    activeFolder.value = dir.replace(/[\\/]+$/, '')
    void persistActiveFolder(activeFolder.value)
  } finally {
    importing.value = false
  }
}

function onMenuKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeFolderMenu()
}

onMounted(() => {
  // 有缓存时先渲染旧数据，同时后台静默刷新（避免每次切页都闪 loading）
  void loadFolders(folderCache !== null)
  window.addEventListener('click', closeFolderMenu)
  window.addEventListener('keydown', onMenuKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', closeFolderMenu)
  window.removeEventListener('keydown', onMenuKeydown)
})
</script>

<style scoped>
.instances-page {
  position: relative;
  display: flex;
  gap: 20px;
  height: 100%;
  padding: 24px;
  overflow: hidden;
}

/* ===== Koring 背景 ===== */
.inst-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.instances-page.is-kor {
  /* 底色与 V 水印由全局 app-body 提供 */
  background: transparent;
}

.inst-bg::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 52%;
  width: min(120vh, 110%);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    closest-side,
    rgba(255, 255, 255, 0.18),
    rgba(255, 255, 255, 0.04) 62%,
    transparent 78%
  );
  filter: blur(44px);
}

.inst-v {
  position: absolute;
  left: 50%;
  top: 52%;
  width: min(62vh, 50vw);
  aspect-ratio: 1 / 1.12;
  transform: translate(-50%, -50%);
  background: linear-gradient(
    170deg,
    rgba(255, 255, 255, 0.24) 0%,
    rgba(255, 255, 255, 0.1) 42%,
    rgba(255, 255, 255, 0) 94%
  );
  clip-path: polygon(2% 0%, 27% 0%, 50% 61%, 73% 0%, 98% 0%, 62% 100%, 38% 100%);
  filter: blur(1.4px) drop-shadow(0 26px 60px rgba(0, 0, 0, 0.22));
  opacity: 0.68;
}

/* ===== 左侧目录栏 ===== */
.inst-rail {
  position: relative;
  z-index: 2;
  flex: 0 0 236px;
  padding-right: 6px;
  scrollbar-gutter: stable;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 0;
  overflow-y: auto;
}

.inst-rail__group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.inst-rail__title {
  padding: 4px 10px 6px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--voxver-text-tertiary);
}

.instances-page.is-kor .inst-rail__title {
  color: rgba(255, 255, 255, 0.55);
}

.inst-folder,
.inst-action {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--voxver-text-primary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background 140ms ease;
}

.inst-folder:hover,
.inst-action:hover {
  background: var(--voxver-bg-tertiary);
}

.instances-page.is-kor .inst-folder,
.instances-page.is-kor .inst-action {
  color: #fff;
}

.instances-page.is-kor .inst-folder:hover,
.instances-page.is-kor .inst-action:hover {
  background: rgba(255, 255, 255, 0.1);
}

.inst-folder.is-active {
  background: color-mix(in oklab, var(--voxver-primary) 16%, transparent);
}

.instances-page.is-kor .inst-folder.is-active {
  background: rgba(255, 255, 255, 0.14);
}

.inst-folder__icon {
  flex: 0 0 auto;
  opacity: 0.8;
}

.inst-folder__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.inst-folder__name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inst-folder__path {
  font-size: 11px;
  color: var(--voxver-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.instances-page.is-kor .inst-folder__path {
  color: rgba(255, 255, 255, 0.5);
}

.inst-action:disabled {
  opacity: 0.6;
  cursor: default;
}

/* ===== 右侧列表 ===== */
.inst-main {
  position: relative;
  z-index: 2;
  flex: 1 1 auto;
  min-width: 0;
  overflow-y: auto;
}

.inst-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.inst-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid var(--voxver-border-color);
  border-radius: 14px;
  background: var(--voxver-bg-secondary);
  cursor: pointer;
  transition:
    background 150ms ease,
    border-color 150ms ease,
    transform 150ms ease;
}

.inst-card:hover {
  background: var(--voxver-bg-tertiary);
}

.inst-card.is-active {
  border-color: color-mix(in oklab, var(--voxver-primary) 55%, transparent);
}

.instances-page.is-kor .inst-card {
  border-color: var(--kor-hairline, rgba(255, 255, 255, 0.09));
  background: rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(12px);
  color: #fff;
}

.instances-page.is-kor .inst-card:hover {
  background: rgba(0, 0, 0, 0.42);
}

.instances-page.is-kor .inst-card.is-active {
  border-color: rgba(255, 255, 255, 0.22);
  background: rgba(12, 26, 46, 0.6);
}

.inst-card__icon {
  display: inline-flex;
  flex: 0 0 auto;
}

.inst-card__icon-img {
  width: 30px;
  height: 30px;
  display: block;
  object-fit: contain;
}

.inst-card__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.inst-card__name {
  font-size: 14.5px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inst-card__meta {
  font-size: 12.5px;
  color: var(--voxver-text-secondary);
}

.instances-page.is-kor .inst-card__meta {
  color: rgba(255, 255, 255, 0.6);
}

.inst-card__check {
  flex: 0 0 auto;
  margin-left: auto;
  color: #4ade80;
}

.inst-state {
  padding: 40px 4px;
  font-size: 13px;
  color: var(--voxver-text-secondary);
}

.instances-page.is-kor .inst-state {
  color: rgba(255, 255, 255, 0.66);
}

.inst-state__title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}

.instances-page.is-kor .inst-state__title {
  color: #fff;
}

.inst-state__desc {
  margin: 0;
  font-size: 13px;
  opacity: 0.8;
}
.inst-folder__count {
  flex: 0 0 auto;
  margin-left: 8px;
  min-width: 20px;
  padding: 0 6px;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.72);
}

.inst-rail__empty {
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.55);
}

/* ===== 目录右键菜单 ===== */
.inst-ctx {
  position: fixed;
  z-index: 4000;
  min-width: 148px;
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--voxver-border-color);
  background: var(--voxver-bg-secondary);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.28);
}

.inst-ctx__danger {
  display: block;
  width: 100%;
  padding: 7px 12px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #ff6b6b;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}

.inst-ctx__danger:hover {
  background: rgba(255, 107, 107, 0.14);
}
</style>

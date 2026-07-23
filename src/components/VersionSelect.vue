<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="visible" class="vs-overlay" @click.self="close">
        <div class="vs-window">
          <!-- 标题栏 -->
          <header class="vs-header">
            <button class="vs-back" @click="close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span class="vs-title">{{ $t('component.versionSelect') }}</span>
            <div class="vs-wc">
              <button class="vs-wc-btn" @click="minimize">
                <svg width="10" height="1" viewBox="0 0 10 1">
                  <rect width="10" height="1" fill="currentColor" />
                </svg>
              </button>
              <button class="vs-wc-btn vs-close" @click="close">
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.2" />
                </svg>
              </button>
            </div>
          </header>

          <!-- 主体：左右分栏 -->
          <div class="vs-body">
            <!-- ===== 左侧：文件夹列表 ===== -->
            <aside class="vs-sidebar">
              <h3 class="sidebar-title">{{ $t('component.folderList') }}</h3>

              <!-- 有文件夹时：显示当前选中 + 列表 -->
              <template v-if="folders.length > 0">
                <!-- 当前选中文件夹 -->
                <div class="current-folder">
                  <div class="cf-label">{{ $t('component.currentFolder') }}</div>
                  <div class="cf-top">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                    </svg>
                    <span v-if="isLoadingPath" class="cf-name loading-text">{{ $t('component.detecting') }}</span>
                    <span v-else class="cf-name">{{ currentFolderName }}</span>
                  </div>
                  <div class="cf-path" v-if="!isLoadingPath">{{ currentFolderPath }}</div>
                  <div class="cf-path" v-else>{{ $t('common.loading') }}...</div>
                </div>

                <!-- 已添加的其他文件夹列表 -->
                <div v-for="folder in folders.filter((f) => !f.isActive)" :key="folder.path" class="folder-item"
                  @click="switchFolder(folder.path)">
                  <div class="fi-top">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                    </svg>
                    <span class="fi-name">{{ folder.name }}</span>
                  </div>
                  <div class="fi-path">{{ folder.path }}</div>
                  <span class="folder-remove" @click.stop="removeFolder(folder.path)"
                    :title="$t('component.remove')">✕</span>
                </div>

                <!-- 分隔线 -->
                <div class="sidebar-divider"></div>

                <!-- 添加或导入 -->
                <h4 class="sidebar-subtitle">{{ $t('component.addOrImport') }}</h4>
                <div class="action-list">
                  <button class="action-item" @click="addFolder">
                    <span class="action-icon add">＋</span>
                    <span>{{ $t('component.addExistingFolder') }}</span>
                  </button>
                  <button class="action-item" @click="importModpack">
                    <span class="action-icon import">⬇</span>
                    <span>{{ $t('component.importModpack') }}</span>
                  </button>
                </div>
              </template>

              <!-- 无文件夹时：显示提示 -->
              <template v-else>
                <div class="no-folder-hint">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                    <line x1="12" y1="11" x2="12" y2="17" />
                    <line x1="9" y1="14" x2="15" y2="14" />
                  </svg>
                  <p>{{ $t('component.noMinecraftFolder') }}</p>
                  <div class="no-folder-actions">
                    <button class="action-item" @click="addFolder">
                      <span class="action-icon add">＋</span>
                      <span>{{ $t('component.selectExistingFolder') }}</span>
                    </button>
                    <button class="action-item" @click="createMinecraftFolderHere">
                      <span class="action-icon create">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          stroke-width="2">
                          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                        </svg>
                      </span>
                      <span>{{ $t('component.createMinecraft') }}</span>
                    </button>
                  </div>
                </div>
              </template>
            </aside>

            <!-- ===== 右侧：内容区 ===== -->
            <main class="vs-main">
              <!-- 已安装版本区 -->
              <section class="content-section collapsible" :class="{ collapsed: !showInstalled }">
                <header class="sec-header clickable" @click="showInstalled = !showInstalled">
                  <span class="sec-header-title">{{ $t('component.installedVersions') }} ({{ installedVersions.length
                    }})</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                    :style="{ transform: showInstalled ? 'rotate(180deg)' : '' }" style="transition: transform 0.2s">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </header>
                <div v-show="showInstalled" class="sec-body">
                  <!-- 扫描中且有旧数据：显示加载指示器 -->
                  <div v-if="isLoadingVersions && installedVersions.length" class="scanning-indicator">
                    <span class="spin-loader" />
                    <span>{{ $t('component.scanningVersions') }}</span>
                  </div>
                  <!-- 扫描中且无数据 -->
                  <div v-else-if="isLoadingVersions && !installedVersions.length" class="empty-hint scanning-hint">
                    <span class="spin-loader" />
                    <p>{{ $t('component.scanningVersions') }}</p>
                  </div>
                  <!-- 无版本 -->
                  <div v-else-if="!installedVersions.length && !isLoadingVersions" class="empty-hint">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--pcl-text-muted)"
                      stroke-width="1.5">
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p>{{ $t('component.noInstalledVersions') }}</p>
                  </div>
                  <div v-for="ver in installedVersions" :key="ver.id" class="installed-ver-item">
                    <div class="iv-check">
                      <input type="radio" name="activeVersion" :checked="ver.isActive" @change="selectActive(ver)" />
                    </div>
                    <div class="iv-info">
                      <p class="iv-name">{{ ver.name }}</p>
                      <p class="iv-detail">
                        {{ $t('component.releaseVersion') }} {{ ver.baseVersion }} {{ ver.loaderInfo || '' }}
                      </p>
                    </div>
                    <button class="iv-remove" :title="$t('component.deleteVersion')" @click="removeVersion(ver.id)">
                      🗑
                    </button>
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const api = window.electronAPI

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'select', version: { id: string; name: string; loader?: string }): void
}>()

// * 界面状态
const showInstalled = ref(true)
const currentFolderPath = ref(t('component.detecting'))
const currentFolderName = ref(t('component.currentFolder'))
const isLoadingPath = ref(false)
const isLoadingVersions = ref(false)

// * 文件夹列表
interface FolderItem {
  path: string
  name: string
  isActive: boolean
}
const folders = ref<FolderItem[]>([])

// * 弹窗打开时加载 .minecraft 路径
watch(
  () => props.visible,
  async (val) => {
    if (val) {
      await loadMinecraftPath()
    }
  }
)

async function loadMinecraftPath() {
  isLoadingPath.value = true

  if (!api?.path) {
    currentFolderPath.value = t('component.noElectronEnv')
    isLoadingPath.value = false
    return
  }

  // * 1. 加载已保存的文件夹列表  
  const savedPaths: string[] = api.folders ? await api.folders.list() : []

  // * 2. 检查每个保存的路径是否存在
  const validPaths: string[] = []
  for (const path of savedPaths) {
    const exists = await api.path.exists(path)
    if (exists) validPaths.push(path)
  }

  // * 3. 优先使用上次选中的文件夹（如果仍然有效）
  const lastFolder = await api.folders.getLast()
  let effectivePath: string | null = null

  if (lastFolder && validPaths.includes(lastFolder)) {
    effectivePath = lastFolder
  } else if (validPaths.length > 0) {
    // * 上次选中的无效了，使用第一个有效路径    
    effectivePath = validPaths[0]
  }

  // * 4. 构建文件夹列表（只包含有效的路径）
  folders.value = validPaths.map((path) => ({
    path,
    name: path.split(/[\\/]/).pop() || path,
    isActive: path === effectivePath
  }))

  // * 5. 设置当前显示
  if (effectivePath) {
    currentFolderPath.value = effectivePath
    currentFolderName.value = effectivePath.split(/[\\/]/).pop() || '.minecraft'
    isLoadingPath.value = false
    await loadVersionsFromFolder(effectivePath)
  } else {
    // * 没有有效的 .minecraft 文件夹     
    currentFolderPath.value = t('component.notFoundFolder')
    currentFolderName.value = ''
    installedVersions.value = []
    isLoadingPath.value = false
  }
}

function close() {
  emit('update:visible', false)
}

function minimize() {
  api?.window?.minimize?.()
}

async function addFolder() {
  if (!api?.dialog) {
    return
  }
  try {
    const selectedPath = await api.dialog.selectFolder()
    if (!selectedPath) return

    // * 避免重复添加
    if (folders.value.find((f) => f.path === selectedPath)) {
      // * 切换到已存在的文件夹
      switchFolder(selectedPath)
      return
    }

    // * 持久化到数据库    
    if (api.folders) {
      await api.folders.add(selectedPath)
    }

    const folderName = selectedPath.split(/[\\/]/).pop() || selectedPath
    folders.value.push({
      path: selectedPath,
      name: folderName,
      isActive: false
    })

    // * 自动切换到新添加的文件夹
    await switchFolder(selectedPath)
  } catch (err) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('component.addFolderFailed'), type: 'error' })
  }
}

async function importModpack() {
  if (!api?.dialog) return
  try {
    const filePath = await api.dialog.selectFile({
      title: t('component.selectModpackFile'),
      filters: [{ name: t('component.modpackFileFilter'), extensions: ['mrpack', 'zip'] }]
    })
    if (!filePath) return
    close()
    setTimeout(() => {
      api.instance?.scanMinecraft?.(filePath)
    }, 200)
  } catch (err) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('component.importModpackFailed'), type: 'error' })
  }
}

async function switchFolder(path: string) {
  currentFolderPath.value = path
  folders.value.forEach((f) => (f.isActive = f.path === path))
  await loadVersionsFromFolder(path)
  // * 记住选中的文件夹
  if (api?.folders) {
    await api.folders.setLast(path)
  }
}

async function removeFolder(path: string) {
  folders.value = folders.value.filter((f) => f.path !== path)
  // * 从数据库移除
  if (api?.folders) {
    await api.folders.remove(path)
  }
}

async function createMinecraftFolder() {
  if (!api?.dialog) return
  try {
    // * 让用户选择一个父目录
    const parentPath = await api.dialog.selectFolder()
    if (!parentPath) return

    const minecraftPath = parentPath.replace(/[\\/]+$/, '') + '/.minecraft'

    // * 调用主进程创建目录    
    if (api.path) {
      await api.path.createDir(minecraftPath)
    }

    // * 添加到列表并切换
    if (api.folders) {
      await api.folders.add(minecraftPath)
    }

    folders.value.push({
      path: minecraftPath,
      name: '.minecraft',
      isActive: false
    })

    await switchFolder(minecraftPath)
  } catch (err) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('component.detectMinecraftFailed'), type: 'error' })
  }
}

// * 在 VoxVer 安装目录下新建 .minecraft（无文件夹状态使用）
async function createMinecraftFolderHere() {
  try {
    // * 获取 VoxVer 安装目录，直接在安装目录下创建 .minecraft
    const appPath = await api.path.getAppPath()
    const minecraftPath = appPath.replace(/[\\/]+$/, '') + '/.minecraft'

    // * 调用主进程创建目录
    if (api.path) {
      await api.path.createDir(minecraftPath)
    }

    // * 添加到列表并切换
    await api.folders.add(minecraftPath)

    folders.value.push({
      path: minecraftPath,
      name: '.minecraft',
      isActive: false
    })

    await switchFolder(minecraftPath)
  } catch (err) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('component.createFolderFailed'), type: 'error' })
  }
}

// * 已安装版本列表
interface InstalledVer {
  id: string
  name: string
  baseVersion: string
  loaderInfo: string
  isActive: boolean
  jarPath?: string
  jsonPath?: string
}

const installedVersions = ref<InstalledVer[]>([])

async function loadVersionsFromFolder(gameDir: string) {
  if (!api?.versions) {
    return
  }
  isLoadingVersions.value = true
  // * 恢复上次选中的版本（精确匹配 + 前缀模糊匹配）
  const lastId = localStorage.getItem('voxver_last_version') || ''
  const savedName = localStorage.getItem('voxver_last_version_name') || ''
  try {
    const res = await api.versions.scanFolder(gameDir)
    if (res?.ok) {
      const data =
        (res.data as {
          id: string
          name: string
          baseVersion?: string
          loaderInfo?: string
          jarPath?: string
          jsonPath?: string
          isActive?: boolean
        }[]) || []
      installedVersions.value = data.map((v) => {
        // * 精确匹配：id 完全相等
        const exactMatch = v.id === lastId
        // * 模糊匹配：保存的显示名包含在版本 name 里（处理 loader 的完整名称）
        const fuzzyMatch = savedName && v.name && v.name.includes(savedName)
        return {
          id: v.id,
          name: v.name,
          baseVersion: v.baseVersion || '',
          loaderInfo: v.loaderInfo || '',
          isActive: !!exactMatch || !!fuzzyMatch,
          jarPath: v.jarPath,
          jsonPath: v.jsonPath
        }
      })
    } else {
    }
  } catch (err) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('component.loadVersionsFailed'), type: 'error' })
  } finally {
    isLoadingVersions.value = false
  }
}

function selectActive(ver: InstalledVer) {
  installedVersions.value.forEach((v) => (v.isActive = v.id === ver.id))
  emit('select', { id: ver.id, name: ver.name, loader: ver.loaderInfo })
}

async function removeVersion(id: string) {
  if (!confirm(`确认删除版本 ${id}？此操作仅从列表中移除，不会删除游戏文件。`)) return
  installedVersions.value = installedVersions.value.filter((v) => v.id !== id)
  // * 从文件系统删除版本  if (api?.versions) {
  const mcPath = await api.path?.getMinecraft()
  if (mcPath) {
    await api.versions.delete(id, mcPath)
  }
}

</script>

<style scoped lang="scss">
/* * ====== VoxVer Design System ====== */
.vs-overlay {
  /* * 遮罩层 */
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* * ---- 弹窗容器 ---- */
.vs-window {
  width: 800px;
  max-width: 92vw;
  height: 520px;
  max-height: 85vh;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border-radius: var(--voxver-radius-xl);
  border: 1px solid var(--voxver-border-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow:
    var(--voxver-shadow-xl),
    0 0 0 1px color-mix(in oklab, var(--voxver-primary) 10%, transparent);
}

/* * ---- 标题栏 ---- */
.vs-header {
  height: 42px;
  background: color-mix(in oklab, var(--voxver-bg-secondary) 65%, transparent);
  border-bottom: 1px solid var(--voxver-border-color);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 10px;
  flex-shrink: 0;
  -webkit-app-region: drag;
}

.vs-back {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: var(--voxver-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--voxver-radius-sm);
  transition: all 0.12s;
  -webkit-app-region: no-drag;

  &:hover {
    background: var(--voxver-bg-hover);
    color: var(--voxver-text-primary);
  }
}

.vs-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}

.vs-wc {
  margin-left: auto;
  display: flex;
  -webkit-app-region: no-drag;

  .vs-wc-btn {
    width: 42px;
    height: 42px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--voxver-text-tertiary);
    transition: background 0.12s;

    &:hover {
      background: var(--voxver-bg-hover);
      color: var(--voxver-text-primary);
    }

    &.vs-close:hover {
      background: rgb(239 68 68 / 0.15);
      color: var(--voxver-error);
    }
  }
}

/* * ---- 主体左右分栏 ---- */
.vs-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* * ====== 左侧边栏 ====== */
.vs-sidebar {
  width: 220px;
  min-width: 180px;
  background: color-mix(in oklab, var(--voxver-bg-secondary) 65%, transparent);
  border-right: 1px solid var(--voxver-border-color);
  padding: 16px 14px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--voxver-border-color);
    border-radius: 2px;
  }
}

.sidebar-title {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 700;
  color: var(--voxver-text-muted);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* * 未找到文件夹提示 */
.no-folder-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 10px;
  text-align: center;
  color: var(--voxver-text-muted);

  svg {
    opacity: 0.4;
  }

  p {
    margin: 0;
    font-size: 12px;
  }

  .no-folder-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }

  .action-item {
    .action-icon.create {
      color: var(--voxver-primary-muted);
    }
  }
}

/* * 当前文件夹 */
.current-folder {
  padding: 10px 12px;
  background: color-mix(in oklab, var(--voxver-primary) 8%, transparent);
  border-radius: var(--voxver-radius-md);
  border-left: 3px solid var(--voxver-primary);

  .cf-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--voxver-primary-muted);
    margin-bottom: 4px;
  }

  .cf-top {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 2px;
  }

  .cf-name {
    font-size: 12px;
    color: var(--voxver-text-primary);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cf-path {
    font-size: 10px;
    color: var(--voxver-text-muted);
    word-break: break-all;
    line-height: 1.4;
    font-family: var(--voxver-font-mono);
    padding-left: 18px;
  }
}

/* * 分隔线 */
.sidebar-divider {
  height: 1px;
  background: var(--voxver-border-color);
  margin: 14px 0 10px;
}

/* * 文件夹列表 */
.folder-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.folder-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 7px 28px 7px 10px;
  border-radius: var(--voxver-radius-sm);
  cursor: pointer;
  transition: background 0.12s;
  gap: 2px;
  position: relative;

  &:hover {
    background: color-mix(in oklab, var(--voxver-primary) 8%, transparent);
  }

  .fi-top {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .fi-name {
    font-size: 12px;
    color: var(--voxver-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fi-path {
    font-size: 10px;
    color: var(--voxver-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-left: 17px;
  }

  .folder-remove {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 10px;
    color: var(--voxver-text-muted);
    opacity: 0;
    transition: opacity 0.12s;
    padding: 2px 4px;
    border-radius: 3px;

    &:hover {
      color: var(--voxver-error);
      background: rgb(239 68 68 / 0.08);
    }
  }

  &:hover .folder-remove {
    opacity: 1;
  }
}

/* * 子标题 */
.sidebar-subtitle {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 400;
  color: var(--voxver-text-muted);
}

/* * 操作按钮列表 */
.action-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: none;
  background: transparent;
  border-radius: var(--voxver-radius-md);
  font-size: 12px;
  color: var(--voxver-text-secondary);
  cursor: pointer;
  transition: all 0.13s;
  text-align: left;

  &:hover {
    background: color-mix(in oklab, var(--voxver-primary) 8%, transparent);
    color: var(--voxver-primary-muted);

    .action-icon.add {
      color: var(--voxver-success);
    }

    .action-icon.import {
      color: var(--voxver-primary-muted);
    }
  }

  .action-icon {
    font-size: 14px;
    flex-shrink: 0;

    &.add {
      color: var(--voxver-success);
    }

    &.import {
      color: var(--voxver-text-muted);
    }
  }
}

/* * ====== 右侧内容 ===== */
.vs-main {
  flex: 1;
  overflow-y: auto;
  background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--voxver-border-color);
    border-radius: 3px;
  }
}

/* * 内容区块 */
.content-section {
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border-radius: var(--voxver-radius-lg);
  border: 1px solid var(--voxver-border-color);
  overflow: hidden;

  .sec-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 14px;
    cursor: default;
    user-select: none;

    &.clickable {
      cursor: pointer;

      &:hover {
        background: var(--voxver-bg-hover);
      }
    }

    .sec-header-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--voxver-text-primary);
    }

    svg {
      flex-shrink: 0;
      color: var(--voxver-text-tertiary);
    }
  }

  .sec-body {
    padding: 0 14px 12px;
    animation: slideDown 0.2s ease;
  }

  &.collapsed .sec-body {
    display: none;
  }
}

/* * ----- 已安装版本项 ----- */
.installed-ver-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 8px;
  border-radius: var(--voxver-radius-md);
  transition: background 0.12s;

  &:hover {
    background: var(--voxver-bg-hover);
  }

  .iv-check {
    flex-shrink: 0;

    input[type='radio'] {
      width: 15px;
      height: 15px;
      accent-color: var(--voxver-primary);
      cursor: pointer;
    }
  }

  .iv-info {
    flex: 1;
    min-width: 0;

    .iv-name {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--voxver-text-primary);
    }

    .iv-detail {
      margin: 2px 0 0;
      font-size: 11px;
      color: var(--voxver-text-muted);
    }
  }

  .iv-remove {
    width: 26px;
    height: 26px;
    border: none;
    background: transparent;
    border-radius: var(--voxver-radius-sm);
    font-size: 13px;
    cursor: pointer;
    opacity: 0;
    transition: all 0.12s;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:hover {
      background: rgb(239 68 68 / 0.1);
    }
  }

  &:hover .iv-remove {
    opacity: 1;
  }
}

/* * 空状态提示 */
.empty-hint {
  text-align: center;
  padding: 30px 0 16px;
  color: var(--voxver-text-muted);

  p {
    margin: 8px 0 0;
    font-size: 12px;
  }

  svg {
    opacity: 0.35;
  }

  &.scanning-hint {
    p {
      margin-top: 10px;
    }
  }
}

/* * 扫描指示器 */
.scanning-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 12px;
  color: var(--voxver-text-muted);
}

/* * 动画 */
.modal-fade-enter-active {
  transition: opacity 0.18s ease;
}

.modal-fade-leave-active {
  transition: opacity 0.12s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .vs-window {
  transition:
    transform 0.2s ease,
    opacity 0.18s ease;
}

.modal-fade-enter-from .vs-window {
  transform: scale(0.96) translateY(10px);
  opacity: 0;
}

/* * ===== 加载动画 ===== */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spin-loader {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid var(--voxver-border-color);
  border-top-color: var(--voxver-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
</style>

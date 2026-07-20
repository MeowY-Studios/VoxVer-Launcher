<template>
  <div class="instances-page">
    <!-- 顶部操作栏 -->
    <div class="page-toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">{{ $t('instance.manager') }}</h2>
        <span class="instance-count">{{ $t('instance.count', { count: instances.length }) }}</span>
      </div>
      <div class="toolbar-right">
        <!-- 视图切换 -->
        <div class="view-toggle">
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
            :title="$t('instance.gridView')"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
            :title="$t('instance.listView')"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
        <button class="vox-btn" @click="rescanVersions" :disabled="scanning" :title="$t('instance.refresh')">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            :class="{ spinning: scanning }"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
        <button class="vox-btn vox-btn--primary" @click="showNewInstance = true">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          {{ $t('instance.newInstance') }}
        </button>
        <button class="vox-btn" @click="showImport = true" :title="$t('instance.import')">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {{ $t('instance.import') }}
        </button>
        <button
          class="vox-btn"
          @click="showExport = true"
          :disabled="!selectedId"
          :title="$t('instance.exportSelected')"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {{ $t('instance.export') }}
        </button>
      </div>
    </div>

    <!-- 当前 .minecraft 路径提示 -->
    <div class="current-mc-path" v-if="currentMcPath">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
      <span>{{ currentMcPath }}</span>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input type="text" v-model="searchQuery" :placeholder="$t('instance.searchInstance')" />
    </div>

    <!-- ===== 自动检测到的版本 ====== -->
    <div v-if="detectedVersions.length" class="detected-section">
      <div class="detected-header">
        <h3 class="detected-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {{ $t('instance.detectedVersions') }}
        </h3>
        <span class="detected-count">{{ detectedVersions.length }}</span>
      </div>
      <div class="detected-list">
        <div v-for="dv in filteredDetectedVersions" :key="dv.id" class="detected-item">
          <div class="dv-icon" :style="{ background: getVersionColor(dv.id) }">
            <span>{{ dv.baseVersion.slice(0, 2) }}</span>
          </div>
          <div class="dv-info">
            <div class="dv-name">{{ dv.id }}</div>
            <div class="dv-meta">
              <span class="dv-tag" v-if="dv.loaderInfo">{{ dv.loaderInfo }}</span>
              <span class="dv-type">{{ dv.type }}</span>
            </div>
          </div>
          <button class="dv-launch" @click="launchDetectedVersion(dv)" :title="$t('instance.launch')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            {{ $t('instance.launch') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== 网格视图 ====== -->
    <div v-if="viewMode === 'grid' && filteredInstances.length" class="instance-grid">
      <div
        v-for="inst in filteredInstances"
        :key="inst.id"
        class="instance-card vox-card"
        @click="selectInstance(inst)"
        :class="{ selected: selectedId === inst.id }"
      >
        <!-- 封面图区域 -->
        <div class="card-cover" :style="{ background: getCoverGradient(inst) }">
          <div class="cover-loader-tag" v-if="getLoaderLabel(inst)">
            {{ getLoaderLabel(inst) }}
          </div>
          <div class="cover-version-tag">
            {{ inst.mc_version }}
          </div>
        </div>

        <!-- 信息区域 -->
        <div class="card-body">
          <h3 class="card-name">{{ inst.name }}</h3>
          <p class="card-meta">
            <span class="meta-item" v-if="getLoaderLabel(inst)">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
                />
              </svg>
              {{ getLoaderLabel(inst) }}
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
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {{ inst.last_played ? formatTime(inst.last_played) : $t('instance.neverPlayed') }}
            </span>
          </p>
        </div>

        <!-- 操作按钮区 -->
        <div class="card-actions">
          <button class="action-btn launch" @click.stop="launchInstance(inst)" :title="$t('instance.launch')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <button class="action-btn" @click.stop="openFolder(inst)" :title="$t('instance.openFolder')">
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
          </button>
          <button class="action-btn" @click.stop="editInstance(inst)" :title="$t('instance.settings')">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
              />
            </svg>
          </button>
          <button class="action-btn danger" @click.stop="confirmDeleteInstance(inst)" :title="$t('common.delete')">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ===== 列表视图 ====== -->
    <div v-if="viewMode === 'list' && filteredInstances.length" class="instance-list">
      <div
        v-for="inst in filteredInstances"
        :key="inst.id"
        class="list-item vox-list-card"
        @click="selectInstance(inst)"
        :class="{ selected: selectedId === inst.id }"
      >
        <div class="list-icon" :style="{ background: getCoverGradient(inst) }">
          <span class="list-icon-ver">{{ inst.mc_version }}</span>
        </div>
        <div class="list-info">
          <p class="list-name">{{ inst.name }}</p>
          <p class="list-meta">
            {{ inst.mc_version }} · {{ getLoaderLabel(inst) || $t('game.vanilla') }} ·
            {{ inst.last_played ? formatTime(inst.last_played) : $t('instance.neverPlayed') }}
          </p>
        </div>
        <div class="list-actions">
          <button class="action-btn launch" @click.stop="launchInstance(inst)" :title="$t('instance.launch')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <button class="action-btn danger" @click.stop="confirmDeleteInstance(inst)" :title="$t('common.delete')">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!filteredInstances.length" class="empty-state">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.2"
        style="color: var(--voxver-text-muted); margin-bottom: 12px"
      >
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <line x1="9" y1="9" x2="15" y2="15" />
        <line x1="15" y1="9" x2="9" y2="15" />
      </svg>
      <p>{{ searchQuery ? $t('instance.noMatchingInstances') : $t('instance.noInstancesYet') }}</p>
      <span class="hint" v-if="!searchQuery">{{ $t('instance.createFirstHint') }}</span>
    </div>

    <!-- 新建实例弹窗 -->
    <div class="modal-overlay" v-if="showNewInstance" @click.self="showNewInstance = false">
      <div class="modal-content vox-card">
        <h3>{{ $t('instance.newGameInstance') }}</h3>
        <form @submit.prevent="handleCreateInstance">
          <div class="form-group">
            <label>{{ $t('instance.instanceNameLabel') }}</label>
            <input class="vox-input" v-model="newInst.name" :placeholder="$t('instance.instanceNamePlaceholder')" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ $t('instance.gameVersionLabel') }}</label>
              <select class="vox-input" v-model="newInst.mc_version">
                <option value="1.20.4">1.20.4</option>
                <option value="1.20.1">1.20.1</option>
                <option value="1.21.3">1.21.3</option>
                <option value="1.19.2">1.19.2</option>
                <option value="1.18.2">1.18.2</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ $t('instance.loaderLabel') }}</label>
              <select class="vox-input" v-model="newInst.loader_type">
                <option value="vanilla">{{ $t('instance.vanillaOption') }}</option>
                <option value="fabric">Fabric</option>
                <option value="forge">Forge</option>
                <option value="neoforge">NeoForge</option>
              </select>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="vox-btn" @click="showNewInstance = false">{{ $t('common.cancel') }}</button>
            <button type="submit" class="vox-btn vox-btn--primary">{{ $t('instance.createInstanceBtn') }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 导入实例弹窗 -->
    <div class="modal-overlay" v-if="showImport" @click.self="closeImport">
      <div class="modal-content vox-card">
        <h3>{{ $t('instance.importExistingInstance') }}</h3>

        <!-- 步骤1: 选择目录 -->
        <div v-if="importStep === 'select'" class="import-step">
          <p class="import-hint">
            {{ $t('instance.selectDirectoryHint') }}
          </p>
          <div class="form-group">
            <label>{{ $t('instance.directoryPath') }}</label>
            <div class="dir-picker">
              <input class="vox-input" v-model="importDir" :placeholder="$t('instance.directoryPlaceholder')" readonly />
              <button class="vox-btn" @click="selectImportDir">{{ $t('common.pleaseSelect') }}</button>
            </div>
          </div>
        </div>

        <!-- 步骤2: 扫描中 -->
        <div v-else-if="importStep === 'scanning'" class="import-step">
          <div class="spinner-row">
            <div class="spinner"></div>
            <span>{{ $t('instance.scanningDirectory') }}</span>
          </div>
        </div>

        <!-- 步骤3: 预览 -->
        <div v-else-if="importStep === 'preview'" class="import-step">
          <div class="scan-result" v-if="importScanResult">
            <div class="result-item">
              <span class="result-label">{{ $t('instance.gameVersionResult') }}</span>
              <span class="result-value">{{ importScanResult.mcVersion || $t('common.noData') }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">{{ $t('instance.loaderResult') }}</span>
              <span class="result-value"
                >{{ importScanResult.loaderType || $t('instance.vanillaOption') }}
                {{ importScanResult.loaderVersion }}</span
              >
            </div>
            <div class="result-item">
              <span class="result-label">{{ $t('instance.modCount') }}</span>
              <span class="result-value">{{ importScanResult.modsCount || 0 }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">{{ $t('instance.configFileCount') }}</span>
              <span class="result-value">{{ importScanResult.configCount || 0 }}</span>
            </div>
          </div>
          <div class="modal-actions">
            <button class="vox-btn" @click="closeImport">{{ $t('common.cancel') }}</button>
            <button class="vox-btn vox-btn--primary" @click="doImport">{{ $t('common.confirm') }}{{ $t('instance.import') }}</button>
          </div>
        </div>

        <!-- 步骤4: 导入中 -->
        <div v-else-if="importStep === 'importing'" class="import-step">
          <div class="spinner-row">
            <div class="spinner"></div>
            <span>{{ $t('instance.importingInstance') }}</span>
          </div>
        </div>

        <!-- 步骤5: 完成 -->
        <div v-else-if="importStep === 'done'" class="import-step">
          <div class="result-success">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--voxver-success)"
              stroke-width="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p>{{ $t('instance.importSuccess') }}</p>
          </div>
          <div class="modal-actions">
            <button class="vox-btn vox-btn--primary" @click="closeImport">{{ $t('common.finish') }}</button>
          </div>
        </div>

        <!-- 步骤6: 错误 -->
        <div v-else-if="importStep === 'error'" class="import-step">
          <div class="result-error">
            <p>{{ importError }}</p>
          </div>
          <div class="modal-actions">
            <button class="vox-btn" @click="closeImport">{{ $t('common.close') }}</button>
            <button class="vox-btn" @click="importStep = 'select'">{{ $t('instance.reselectBtn') }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 导出实例弹窗 -->
    <div class="modal-overlay" v-if="showExport" @click.self="showExport = false">
      <div class="modal-content vox-card">
        <h3>{{ $t('instance.export') }}{{ $t('instance.instance') }}</h3>
        <p class="export-desc">{{ $t('instance.export') }}为 .mcla 可分享包</p>
        <div class="export-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="exportOptions.includeMods" />
            {{ $t('mod.includeMods') }}
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="exportOptions.includeConfigs" />
            {{ $t('mod.includeConfigs') }}
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="exportOptions.includeSaves" />
            {{ $t('instance.includeSavesHint') }}
          </label>
        </div>
        <div class="modal-actions">
          <button class="vox-btn" @click="showExport = false">{{ $t('common.cancel') }}</button>
          <button class="vox-btn vox-btn--primary" @click="doExport" :disabled="exportLoading">
            {{ exportLoading ? $t('instance.export') + '...' : $t('instance.export') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 实例类型（统一使用 camelCase）
interface Instance {
  id: string
  name: string
  path: string
  mc_version: string
  loader_type: 'vanilla' | 'forge' | 'fabric' | 'neoforge' | 'quilt'
  loader_version: string
  icon: string
  java_path: string
  jvm_args: string
  min_memory: number
  max_memory: number
  width: number
  height: number
  fullscreen: number
  is_favorited: number
  last_played: string | null
  play_time: number
  created_at: string
  updated_at: string
}

const router = useRouter()
const searchQuery = ref('')
const showNewInstance = ref(false)
const selectedId = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const instances = ref<Instance[]>([])

// 自动检测到的版本
interface DetectedVersion {
  id: string
  name: string
  type: string
  baseVersion: string
  loaderInfo: string
  jarPath: string
  jsonPath: string
}
const detectedVersions = ref<DetectedVersion[]>([])
const scanning = ref(false)
const currentMcPath = ref('')

const filteredDetectedVersions = computed(() => {
  if (!searchQuery.value) return detectedVersions.value
  const q = searchQuery.value.toLowerCase()
  return detectedVersions.value.filter(
    (v) => v.id.toLowerCase().includes(q) || v.baseVersion.includes(q)
  )
})

// $t('instance.import')/$t('instance.export')状态
const showImport = ref(false)
const showExport = ref(false)
const importStep = ref<'select' | 'scanning' | 'preview' | 'importing' | 'done' | 'error'>('select')
const importDir = ref('')
const importScanResult = ref<any>(null)
const importError = ref('')
const exportLoading = ref(false)
const exportOptions = ref({ includeMods: true, includeConfigs: true, includeSaves: false })

// 新建表单
const newInst = ref({
  name: '',
  mc_version: '1.20.4',
  loader_type: 'vanilla'
})

// 封面色池 — Apple 主色 + 状态色（基于 ID 哈希分配，保持稳定）
const gradients = [
  'var(--voxver-primary)',
  'var(--voxver-success)',
  'var(--voxver-warning)',
  'var(--voxver-error)',
  '#0071e3',
  '#30b350',
  '#e08600',
  '#e0352b'
]

function getCoverGradient(inst: Instance): string {
  let hash = 0
  for (let i = 0; i < inst.id.length; i++) {
    hash = (hash << 5) - hash + inst.id.charCodeAt(i)
    hash |= 0
  }
  return gradients[Math.abs(hash) % gradients.length]
}

function getLoaderLabel(inst: Instance): string {
  if (!inst.loader_type || inst.loader_type === 'vanilla') return ''
  if (inst.loader_version) return `${capitalizeFirst(inst.loader_type)} ${inst.loader_version}`
  return capitalizeFirst(inst.loader_type)
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// 从数据库加载实例列表
async function loadInstances() {
  try {
    const result = await window.electronAPI?.instance?.list()
    instances.value = (result || []) as Instance[]
  } catch (e) {
    instances.value = []
  }
}

// 获取当前 .minecraft 路径（优先使用设置中选择的文件夹）
async function getCurrentMcPath(): Promise<string> {
  try {
    const last = await window.electronAPI?.folders?.getLast?.()
    if (last) return last
    const custom = await window.electronAPI?.path?.getCustom?.()
    if (custom) return custom
    return (await window.electronAPI?.path?.getMinecraft?.()) || ''
  } catch {
    return ''
  }
}

// 扫描当前 .minecraft 目录下的版本
async function rescanVersions() {
  scanning.value = true
  try {
    const mcPath = await getCurrentMcPath()
    currentMcPath.value = mcPath
    if (!mcPath) {
      detectedVersions.value = []
      return
    }
    const res = await window.electronAPI?.versions?.scanFolder(mcPath)
    if (res?.ok && res.data) {
      detectedVersions.value = res.data as DetectedVersion[]
    } else {
      detectedVersions.value = []
    }
  } catch {
    detectedVersions.value = []
  } finally {
    scanning.value = false
  }
}

// 版本颜色（基于 id 哈希）
function getVersionColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  return gradients[Math.abs(hash) % gradients.length]
}

// 一键启动检测到的版本
function launchDetectedVersion(dv: DetectedVersion) {
  window.electronAPI?.game?.launch?.('', '', dv.id)
}

const filteredInstances = computed(() => {
  if (!searchQuery.value) return instances.value
  const q = searchQuery.value.toLowerCase()
  return instances.value.filter((i) => i.name.toLowerCase().includes(q) || i.mc_version.includes(q))
})

function selectInstance(inst: Instance) {
  selectedId.value = inst.id
}

// 创建实例（写入数据库）
async function handleCreateInstance() {
  if (!newInst.value.name.trim()) return

  // 获取用户选择的 .minecraft 路径（自定义路径优先）
  let customPath = ''
  try {
    const api = window.electronAPI
    if (api?.path) {
      const custom = await api.path.getCustom()
      if (custom) {
        customPath = custom
      } else {
        customPath = await api.path.getMinecraft()
      }
    }
  } catch (e) {}

  try {
    await window.electronAPI?.instance?.create({
      name: newInst.value.name.trim(),
      mcVersion: newInst.value.mc_version,
      loaderType: newInst.value.loader_type,
      customPath, // 传入用户选择的 .minecraft 路径
      loaderVersion: '',
      javaPath: '',
      minMemory: 512,
      maxMemory: 2048
    })

    // 重新加载列表
    await loadInstances()

    // 重置表单
    newInst.value = { name: '', mc_version: '1.20.4', loader_type: 'vanilla' }
    showNewInstance.value = false
  } catch (e) {}
}

function launchInstance(inst: Instance) {
  window.electronAPI?.game?.launch?.(inst.id, '', inst.mc_version)
}

async function openFolder(inst: Instance) {
  if (inst.path) {
    window.electronAPI?.shell?.openPath?.(inst.path)
  }
}

// ====== $t('instance.import')/$t('instance.export') ======
async function selectImportDir() {
  const dir = await window.electronAPI?.dialog?.selectFolder()
  if (!dir) return
  importDir.value = dir
  await scanImportDir()
}

async function scanImportDir() {
  if (!importDir.value) return
  importStep.value = 'scanning'
  importError.value = ''
  try {
    const res = await window.electronAPI?.instance?.scanMinecraft(importDir.value)
    if (res?.ok && res.data) {
      importScanResult.value = res.data
      importStep.value = res.data.valid ? 'preview' : 'error'
      if (!res.data.valid) importError.value = res.data.suggestions?.[0] || '目录无效'
    } else {
      importStep.value = 'error'
      importError.value = res?.error || t('instance.scanFailed')
    }
  } catch (e: any) {
    importStep.value = 'error'
    importError.value = e.message
  }
}

async function doImport() {
  if (!importDir.value) return
  importStep.value = 'importing'
  try {
    const minecraftPath = await window.electronAPI?.path?.getMinecraft()
    if (!minecraftPath) {
      importStep.value = 'error'
      importError.value = t('instance.cannotGetMinecraftDir')
      return
    }
    const res = await window.electronAPI?.instance?.importInstance(importDir.value, minecraftPath)
    if (res?.ok) {
      importStep.value = 'done'
      await loadInstances()
    } else {
      importStep.value = 'error'
      importError.value = res?.error || t('instance.importFailed')
    }
  } catch (e: any) {
    importStep.value = 'error'
    importError.value = e.message
  }
}

function closeImport() {
  showImport.value = false
  importStep.value = 'select'
  importDir.value = ''
  importScanResult.value = null
  importError.value = ''
}

async function doExport() {
  if (!selectedId.value) return
  exportLoading.value = true
  try {
    const destPath = await window.electronAPI?.dialog?.selectFile({
      title: t('instance.exportInstanceTitle') as string,
      filters: [{ name: t('instance.voxVerExportPackage') as string, extensions: ['mcla'] }]
    })
    if (!destPath) return
    const fullPath = destPath.endsWith('.mcla') ? destPath : destPath + '.mcla'
    const res = await window.electronAPI?.instance?.exportInstance(
      selectedId.value,
      fullPath,
      exportOptions.value
    )
    if (res?.ok) {
      showExport.value = false
    } else {
      window.electronAPI?.notification?.send({
        title: t('common.error'),
        body: (t('instance.exportFailed') as string).replace('{error}', res?.error || (t('download.unknownError') as string)),
        type: 'error'
      })
    }
  } finally {
    exportLoading.value = false
  }
}

function editInstance(inst: Instance) {
  router.push(`/instance/${inst.id}`)
}

// 确认删除（写入数据库）
async function confirmDeleteInstance(inst: Instance) {
  if (!confirm(t('instance.deleteConfirm') + `「${inst.name}」？`)) return
  try {
    await window.electronAPI?.instance?.delete(inst.id)
    await loadInstances()
    if (selectedId.value === inst.id) selectedId.value = ''
  } catch (e) {}
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return t('instance.neverPlayed') as string
  const ts = new Date(dateStr).getTime()
  if (isNaN(ts)) return t('instance.unknown') as string
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return (t('instance.minutesAgo') as string).replace('{n}', String(mins))
  const hours = Math.floor(mins / 60)
  if (hours < 24) return (t('instance.hoursAgo') as string).replace('{n}', String(hours))
  const days = Math.floor(hours / 24)
  if (days < 30) return (t('instance.daysAgo') as string).replace('{n}', String(days))
  return (t('instance.monthsAgo') as string).replace('{n}', String(Math.floor(days / 30)))
}

onMounted(() => {
  loadInstances()
  rescanVersions()
})
</script>

<style scoped lang="scss">
.instances-page {
  padding: 20px 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ====== 工具栏 ====== */
.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.page-title {
  font-size: 17px;
  font-weight: 700;
  margin: 0;
  color: var(--voxver-text-primary);
}

.instance-count {
  font-size: 12px;
  color: var(--voxver-text-muted);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 视图切换 */
.view-toggle {
  display: flex;
  background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  border-radius: var(--voxver-radius-sm);
  border: none;

  .toggle-btn {
    width: 32px;
    height: 30px;
    border: none;
    background: transparent;
    color: var(--voxver-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--voxver-radius-sm);
    transition: all 0.12s;

    &:hover {
      color: var(--voxver-text-secondary);
    }
    &.active {
      background: color-mix(in oklab, var(--voxver-primary) 10%, transparent);
      color: var(--voxver-primary-600);
    }
  }
}

/* ====== 搜索 ====== */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border: 1px solid var(--voxver-border-color-light);
  border-radius: var(--voxver-radius-sm);
  margin-bottom: 16px;
  flex-shrink: 0;

  svg {
    color: var(--voxver-text-muted);
    flex-shrink: 0;
  }
  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 13px;
    color: var(--voxver-text-primary);
    background: transparent;

    &::placeholder {
      color: var(--voxver-text-muted);
    }
  }
}

/* ====== 当前路径提示 ====== */
.current-mc-path {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--voxver-text-muted);
  margin-bottom: 12px;
  flex-shrink: 0;
  padding: 0 2px;

  svg {
    flex-shrink: 0;
    opacity: 0.7;
  }
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* ====== 自动检测版本 ====== */
.detected-section {
  margin-bottom: 16px;
  flex-shrink: 0;
  background: color-mix(in oklab, var(--voxver-text) 4%, transparent);
  border: 1px solid var(--voxver-border-color-light);
  border-radius: var(--voxver-radius-md);
  padding: 12px 14px;
}

.detected-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.detected-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--voxver-text-primary);
  display: flex;
  align-items: center;
  gap: 6px;

  svg {
    color: var(--voxver-primary);
    flex-shrink: 0;
  }
}

.detected-count {
  font-size: 11px;
  color: var(--voxver-text-muted);
  background: color-mix(in oklab, var(--voxver-text) 8%, transparent);
  padding: 1px 8px;
  border-radius: 10px;
}

.detected-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 240px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgb(0 0 0 / 0.1);
    border-radius: 2px;
  }
}

.detected-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--voxver-radius-sm);
  transition: background 0.12s;

  &:hover {
    background: color-mix(in oklab, var(--voxver-primary) 6%, transparent);
  }
}

.dv-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--voxver-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
}

.dv-info {
  flex: 1;
  min-width: 0;

  .dv-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--voxver-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dv-meta {
    display: flex;
    gap: 6px;
    margin-top: 2px;
  }

  .dv-tag {
    font-size: 10px;
    color: var(--voxver-primary);
    background: color-mix(in oklab, var(--voxver-primary) 10%, transparent);
    padding: 1px 6px;
    border-radius: 3px;
  }

  .dv-type {
    font-size: 10px;
    color: var(--voxver-text-muted);
  }
}

.dv-launch {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: var(--voxver-radius-sm);
  background: var(--voxver-primary);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s;
  flex-shrink: 0;

  &:hover {
    background: var(--voxver-primary-600);
  }
}

/* 刷新按钮旋转动画 */
.spinning {
  animation: spin 0.8s linear infinite;
}

/* ====== 网格视图 ====== */
.instance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
  overflow-y: auto;
  padding-right: 4px;
  flex: 1;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgb(0 0 0 / 0.1);
    border-radius: 3px;
  }
}

.instance-card {
  overflow: hidden;
  cursor: pointer;
  transition: all var(--voxver-transition-normal);
  display: flex;
  flex-direction: column;
  height: 160px;

  &:hover {
    background: color-mix(in oklab, var(--voxver-primary) 6%, transparent);
  }

  &.selected {
    border: 1px solid var(--voxver-primary);
  }
}

/* 封面 */
.card-cover {
  height: 80px; /* 减小封面高度 */
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
  background: rgb(0 0 0 / 0.12);
  }
}

.cover-loader-tag {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 1;
  padding: 1px 6px;
  font-size: 9px;
  font-weight: 600;
  color: var(--voxver-text-inverse);
  background: rgb(0 0 0 / 0.35);
  backdrop-filter: blur(4px);
  border-radius: var(--voxver-radius-xs);
  letter-spacing: 0.3px;
}

.cover-version-tag {
  position: absolute;
  bottom: 6px;
  right: 6px;
  z-index: 1;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 600;
  color: var(--voxver-text-inverse);
  background: rgb(0 0 0 / 0.4);
  backdrop-filter: blur(4px);
  border-radius: var(--voxver-radius-xs);
}

/* 信息区 */
.card-body {
  padding: 8px 12px 6px;
  flex: 1;

  .card-name {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--voxver-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-meta {
    margin: 3px 0 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    color: var(--voxver-text-muted);

    svg {
      flex-shrink: 0;
      opacity: 0.7;
    }
  }
}

/* 操作按钮 */
.card-actions {
  display: flex;
  border-top: 1.5px solid var(--voxver-border-color);
  padding: 2px;

  .action-btn {
    flex: 1;
    height: 34px;
    border: none;
    background: transparent;
    color: var(--voxver-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--voxver-radius-sm);
    transition: all 0.12s;

    &:hover {
      background: var(--voxver-bg-tertiary);
      color: var(--voxver-primary-600);
    }

    &.launch {
      &:hover {
        background: var(--voxver-primary);
        color: #fff;
      }
    }

    &.danger {
      &:hover {
        background: var(--voxver-error-bg);
        color: var(--voxver-error);
      }
    }
  }
}

/* ====== 列表视图 ====== */
.instance-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  flex: 1;
}

.list-item {
  gap: 12px;

  &:hover {
    background: color-mix(in oklab, var(--voxver-primary) 6%, transparent);
  }

  &.selected {
    border: 1px solid var(--voxver-primary);
  }
}

.list-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--voxver-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .list-icon-ver {
    font-size: 10px;
    font-weight: 700;
    color: var(--voxver-text-inverse);
  }
}

.list-info {
  flex: 1;
  min-width: 0;

  .list-name {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--voxver-text-primary);
  }

  .list-meta {
    margin: 2px 0 0;
    font-size: 12px;
    color: var(--voxver-text-muted);
  }
}

.list-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;

  .list-item:hover & {
    opacity: 1;
  }

  .action-btn {
    width: 30px;
    height: 30px;
    border: none;
    background: transparent;
    color: var(--voxver-primary-500);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--voxver-radius-sm);
    transition: all 0.12s;

    &:hover {
      background: var(--voxver-primary);
      color: #fff;
    }
    &.danger {
      color: var(--voxver-error);
      &:hover {
        background: var(--voxver-error);
        color: #fff;
      }
    }
  }
}

/* ====== 空状态 ====== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--voxver-text-secondary);

  p {
    margin: 0 0 6px;
    font-size: 14px;
  }
  .hint {
    font-size: 12px;
    color: var(--voxver-text-muted);
  }
}

/* ====== 弹窗 ====== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--voxver-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  backdrop-filter: blur(4px);
}

.modal-content {
  padding: 28px 24px;
  width: 420px;
  max-width: 90vw;
  box-shadow: var(--voxver-shadow-xl);
  border-radius: var(--voxver-radius-xl);

  h3 {
    margin: 0 0 20px;
    font-size: 17px;
    font-weight: 700;
    color: var(--voxver-text-primary);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-group {
  flex: 1;
  label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--voxver-text-secondary);
    margin-bottom: 5px;
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

/* ====== $t('instance.import')/$t('instance.export')弹窗 ====== */
.import-hint {
  font-size: 13px;
  color: var(--voxver-text-secondary);
  margin: 0 0 16px;
  line-height: 1.5;
}

.dir-picker {
  display: flex;
  gap: 8px;

  input {
    flex: 1;
  }
}

.import-step {
  min-height: 80px;
  display: flex;
  flex-direction: column;
}

.spinner-row {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--voxver-text-muted);
  font-size: 13px;
  padding: 20px 0;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--voxver-border-color);
  border-top-color: var(--voxver-primary-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.scan-result {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 3px;

  .result-label {
    font-size: 11px;
    color: var(--voxver-text-muted);
    font-weight: 600;
    text-transform: uppercase;
  }

  .result-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--voxver-text-primary);
  }
}

.result-success,
.result-error {
  text-align: center;
  padding: 20px 0;

  p {
    margin: 12px 0 0;
    font-size: 14px;
    color: var(--voxver-text-primary);
  }
}

.result-error p {
  color: var(--voxver-error);
}

/* $t('instance.export')选项 */
.export-desc {
  font-size: 13px;
  color: var(--voxver-text-secondary);
  margin: -12px 0 16px;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--voxver-text-primary);
  cursor: pointer;

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: var(--voxver-primary);
  }
}
</style>

<template>
  <div class="mod-manager">
    <!-- 搜索框 -->
    <div class="mod-search-card">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="text"
        class="mod-search-input"
        :placeholder="$t('mod.searchPlaceholder')"
        v-model="modSearchText"
      />
    </div>

    <!-- 操作按钮组 --> 
    <div class="mod-toolbar">
      <button class="form-action-btn primary-outline" @click="openModFolder">{{ $t('mod.openFolder') }}</button>
      <button class="form-action-btn" @click="installModFromFile">{{ $t('mod.installFromFile') }}</button>
      <button class="form-action-btn" @click="goToDownloads">{{ $t('mod.downloadMod') }}</button>
      <button
        class="form-action-btn"
        :class="{ checking: checkingUpdates }"
        @click="checkAllUpdates"
        :disabled="checkingUpdates"
      >
        <svg
          v-if="checkingUpdates"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="spin-icon-sm"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        {{
          checkingUpdates
            ? $t('mod.checking')
            : hasUpdateCount > 0
              ? $t('mod.checkUpdatesCount', { count: hasUpdateCount })
              : $t('mod.checkUpdates')
        }}
      </button>
      <button
        class="form-action-btn"
        :class="{ checking: checkingDependencies }"
        @click="checkAllDependencies"
        :disabled="checkingDependencies"
      >
        <svg
          v-if="checkingDependencies"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="spin-icon-sm"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        {{
          checkingDependencies
            ? $t('mod.checking')
            : missingDepsCount > 0
              ? $t('mod.checkDepsCount', { count: missingDepsCount })
              : $t('mod.checkDependencies')
        }}
      </button>
      <button
        class="form-action-btn"
        :class="{ checking: checkingCompat }"
        @click="checkCompatibility"
        :disabled="checkingCompat"
      >
        <svg
          v-if="checkingCompat"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="spin-icon-sm"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        {{
          checkingCompat
            ? $t('mod.checking')
            : compatIncompatibleCount > 0
              ? $t('mod.compatIssuesCount', { count: compatIncompatibleCount })
              : $t('mod.checkCompatibility')
        }}
      </button>
    </div>

    <!-- 分类筛选 + 排序 -->
    <div class="mod-tabs-row">
      <div class="mod-tabs">
        <button
          v-for="tab in modFilterTabs"
          :key="tab.key"
          class="mod-tab"
          :class="{ active: modFilter === tab.key }"
          @click="modFilter = tab.key"
        >
          {{ tab.label }} <span class="mod-tab-count">({{ tab.count }})</span>
        </button>
      </div>
      <select v-if="filteredMods.length > 0" v-model="modSort" class="mod-sort-select">
        <option value="name">{{ $t('mod.sortByName') }}</option>
        <option value="version">{{ $t('mod.sortByVersion') }}</option>
        <option value="status">{{ $t('mod.sortByStatus') }}</option>
      </select>
    </div>

    <!-- 全选栏 -->
    <div v-if="filteredMods.length > 0" class="mod-select-all-bar">
      <label class="mod-select-all-label">
        <input
          type="checkbox"
          :checked="isAllSelected"
          :indeterminate="isIndeterminate"
          @change="toggleSelectAll"
          class="mod-checkbox"
        />
        <span v-if="selectedMods.size > 0">{{ $t('mod.selectedCount', { n: selectedMods.size }) }}</span>
        <span v-else>{{ $t('common.selectAll') }}</span>
      </label>
    </div>

    <!-- Mod 列表 -->
    <div class="mod-list-section">
      <div v-if="modsStore.loading" class="empty-state">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--voxver-text-muted)"
          stroke-width="2"
          class="spin-icon"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <p>{{ $t('mod.loadingMods') }}</p>
      </div>
      <div v-else-if="filteredMods.length" class="mod-list-wrapper">
        <VirtualScroll
          :items="filteredMods"
          :item-height="64"
          :overscan="6"
          :get-item-key="(item: ModItem) => item.filePath"
          class="mod-virtual-list"
        >
          <template #item="{ item: mod }">
            <div
              class="mod-item"
              :class="{
                selected: selectedMod === mod.filePath,
                'has-update': updateInfoMap[mod.filePath]?.hasUpdate,
                'missing-deps': depCheckMap[mod.filePath]?.missingDependencies?.length > 0,
                'compat-incompatible': compatBadgeMap[mod.filePath]
              }"
              @click="selectMod(mod.filePath)"
              @mouseenter="mod.hovered = true"
              @mouseleave="mod.hovered = false"
            >
              <input
                type="checkbox"
                class="mod-checkbox"
                :checked="selectedMods.has(mod.filePath)"
                @click.stop="toggleModSelection(mod.filePath)"
              />

              <!-- 更新中进度条 -->
              <div v-if="updatingMod === mod.filePath" class="mod-update-progress-bar">
                <div
                  class="mod-update-progress-fill"
                  :style="{ width: (updateProgressMap[mod.filePath] ?? 0) * 100 + '%' }"
                ></div>
              </div>

              <img
                v-if="mod.logoUrl"
                :src="mod.logoUrl"
                class="mod-icon"
                alt=""
                @error="(e: Event) => ((e.target as HTMLImageElement).style.display = 'none')"
              />
              <div v-else class="mod-icon-default">{{ mod.name.slice(0, 1).toUpperCase() }}</div>

              <div class="mod-info">
                <div class="mod-name-row">
                  <span class="mod-name">{{ mod.name }}</span>
                  <span class="mod-version">{{ mod.version }}</span>
                  <span v-if="!mod.enabled" class="mod-disabled-badge">{{ $t('mod.disabled') }}</span>    
                  <!-- 有更新角标 -->
                  <span v-if="updateInfoMap[mod.filePath]?.hasUpdate" class="mod-update-badge">
                    {{ $t('mod.updateBadge', { name: updateInfoMap[mod.filePath].latestVersionName }) }}
                  </span>
                  <!-- 缺失依赖角标 -->
                  <span
                    v-if="depCheckMap[mod.filePath]?.missingDependencies?.length > 0"
                    class="mod-dep-badge"
                  >
                    {{ $t('mod.missingDepsBadge', { count: depCheckMap[mod.filePath].missingDependencies.length }) }}
                  </span>
                  <!-- 不兼容角标 -->
                  <span v-if="compatBadgeMap[mod.filePath]" class="mod-compat-badge" :title="compatBadgeMap[mod.filePath]">
                    {{ $t('mod.compatBadge') }}
                  </span>
                </div>
                <p class="mod-desc">{{ mod.description || $t('mod.noDescription') }}</p>
              </div>

              <div
                class="mod-actions"
                :class="{ visible: mod.hovered || selectedMod === mod.filePath }"
              >
                <button class="mod-action-btn" @click.stop="showModDetails(mod)">{{ $t('mod.detail') }}</button>
                <button class="mod-action-btn" @click.stop="openModFile(mod)">{{ $t('mod.fileLocation') }}</button>
                <button class="mod-action-btn" @click.stop="toggleModEnable(mod)">
                  {{ mod.enabled ? $t('mod.disable') : $t('mod.enable') }}
                </button>
                <button class="mod-action-btn danger" @click.stop="removeMod(mod)">{{ $t('common.delete') }}</button>
              </div>
            </div>
          </template>
        </VirtualScroll>
      </div>
      <div v-else class="empty-state">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--voxver-text-muted)"
          stroke-width="1.5"
        >
          <path
            d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM9 17v-5l-2 2-2-2v5"
          />
        </svg>
        <p>{{ $t('mod.noMatchingMods') }}</p>  
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div v-if="selectedMods.size > 0" class="mod-bottom-bar">
      <span class="mod-bottom-label">
        {{
          selectedMods.size === 1
            ? $t('mod.selectedLabel', { name: selectedModName })
            : $t('mod.selectedCount', { n: selectedMods.size })
        }}
      </span>
      <div class="mod-bottom-actions">
        <button class="mod-bottom-btn" @click="batchEnable">{{ $t('mod.enable') }}</button>
        <button class="mod-bottom-btn" @click="batchDisable">{{ $t('mod.disable') }}</button>
        <button v-if="selectedMods.size === 1 && selectedModHasUpdate"
          class="mod-bottom-btn has-update"
          :disabled="updatingMod === selectedMod"
          @click="updateSelectedMod"
        >
          <template v-if="updatingMod === selectedMod">
            {{ $t('mod.updatingProgress', { percent: Math.round((updateProgressMap[selectedMod!] ?? 0) * 100) }) }}
          </template>
          <template v-else>{{ $t('mod.updateAvailable') }}</template>
        </button>
        <button class="mod-bottom-btn" @click="batchDelete">{{ $t('common.delete') }}</button>
        <button class="mod-bottom-btn" @click="exportSelected">{{ $t('mod.exportSelected') }}</button>
        <button class="mod-bottom-btn" @click="selectedMods.clear(); selectedMod = null">{{ $t('mod.cancelSelection') }}</button>
      </div>
    </div>

    <!-- Mod 详情弹窗 -->
    <transition name="modal-fade">
      <div v-if="showDetailModal" class="mod-detail-overlay" @click.self="showDetailModal = false">
        <div class="mod-detail-window">
          <header class="mod-detail-header">
            <span class="mod-detail-title">{{ $t('mod.modDetails') }}</span>
            <button class="mod-detail-close" @click="showDetailModal = false">
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.2" />
              </svg>
            </button>
          </header>
          <div class="mod-detail-body" v-if="selectedDetailMod">
            <img
              v-if="selectedDetailMod.logoUrl"
              :src="selectedDetailMod.logoUrl"
              class="mod-detail-icon"
            />
            <div v-else class="mod-detail-icon-default">{{ selectedDetailMod.name[0] }}</div>

            <h3 class="mod-detail-name">{{ selectedDetailMod.name }}</h3>
            <p class="mod-detail-version">{{ $t('mod.detailVersion', { version: selectedDetailMod.version }) }}</p>
            <p v-if="selectedDetailMod.authors?.length" class="mod-detail-authors">
              {{ $t('mod.detailAuthors', { authors: selectedDetailMod.authors.join('、') }) }}
            </p>
            <p v-if="selectedDetailMod.description" class="mod-detail-desc">
              {{ selectedDetailMod.description }}
            </p>
            <p v-if="selectedDetailMod.dependencies?.length" class="mod-detail-deps">
              {{ $t('mod.detailDependencies', { deps: selectedDetailMod.dependencies.join('、') }) }}
            </p>
            <p v-if="selectedDetailMod.url" class="mod-detail-url">
              {{ $t('mod.detailLink') }}<a :href="selectedDetailMod.url" target="_blank">{{ selectedDetailMod.url }}</a>
            </p>
            <p class="mod-detail-path">{{ $t('mod.detailPath', { path: selectedDetailMod.filePath }) }}</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- 兼容性检查结果 -->
    <div v-if="compatResults.length > 0" class="mod-compat-panel">
      <div class="mod-compat-header">
        <span class="mod-compat-title">{{ $t('mod.compatResults') }}</span>
        <span class="mod-compat-summary">
          <span class="compat-ok">{{ $t('mod.compatCompatible', { n: compatCompatibleCount }) }}</span>
          <span v-if="compatIncompatibleCount > 0" class="compat-bad">
            {{ $t('mod.compatIncompatible', { n: compatIncompatibleCount }) }}
          </span>
        </span>
        <button class="mod-compat-close" @click="compatResults = []">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.2" />
          </svg>
        </button>
      </div>
      <div class="mod-compat-list">
        <div
          v-for="item in compatResults"
          :key="item.filePath"
          class="mod-compat-item"
          :class="{ 'is-incompatible': !item.compatible }"
        >
          <span class="mod-compat-icon">
            <svg v-if="item.compatible" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--voxver-success)" stroke-width="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--voxver-error)" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </span>
          <span class="mod-compat-name">{{ item.modName }}</span>
          <span class="mod-compat-reason">{{ item.reason }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useModsStore } from '../stores/mods.store'
import VirtualScroll from './common/VirtualScroll.vue'
import { useConfirm } from '@/composables/useConfirm'

const { t } = useI18n()
const { confirm: pxConfirm } = useConfirm()

const props = defineProps<{
  gameDir: string
  mcVersion?: string
  loader?: string
}>()

const emit = defineEmits<{
  (e: 'navigate'): void
}>()

const router = useRouter()
const modsStore = useModsStore()

function goToDownloads() {
  emit('navigate')
  const query: Record<string, string> = { category: 'mod' }
  if (props.mcVersion) query.mcVersion = props.mcVersion
  if (props.loader) query.loader = props.loader
  router.push({ path: '/downloads', query })
}

interface ModItem {
  name: string
  version: string
  description: string
  logoUrl: string
  enabled: boolean
  filePath: string
  fileName: string
  url: string
  authors: string[]
  dependencies: string[]
  hovered?: boolean
}

interface ModUpdateInfo {
  filePath: string
  hash: string
  hasUpdate: boolean
  projectId?: string
  currentVersionName?: string
  latestVersionId?: string
  latestVersionName?: string
  latestDownloadUrl?: string
  latestFileName?: string
  latestFileSize?: number
}

interface ModDependencyInfo {
  project_id: string
  project_type: string
  dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded'
  version_id?: string
  project?: {
    id: string
    title: string
    icon_url: string | null
  }
}

interface ModDependencyCheckResult {
  mod: ModItem
  dependencies: ModDependencyInfo[]
  missingDependencies: ModDependencyInfo[]
  installedDependencies: ModDependencyInfo[]
}

// * 数据
const modSearchText = ref('')
const modFilter = ref('all')
const modSort = ref('name')
const installedMods = ref<ModItem[]>([])

// * 更新检测状态
const checkingUpdates = ref(false)
// * filePath -> ModUpdateInfo
const updateInfoMap = ref<Record<string, ModUpdateInfo>>({})
const updatingMod = ref<string | null>(null) // * 正在更新的Mod
const updateProgressMap = ref<Record<string, number>>({}) // * filePath -> 0~1

// * 可更新的 mod 数量（用 ?tab）
const hasUpdateCount = computed(
  () => Object.values(updateInfoMap.value).filter((u: ModUpdateInfo) => u.hasUpdate).length
)

// * 依赖检查状态
const checkingDependencies = ref(false)
const depCheckMap = ref<Record<string, ModDependencyCheckResult>>({})
const installingDeps = ref<string | null>(null)
const depInstallProgress = ref<Record<string, number>>({})

// * 兼容性检查状态
const checkingCompat = ref(false)
interface CompatResult {
  filePath: string
  modName: string
  compatible: boolean
  reason: string
}
const compatResults = ref<CompatResult[]>([])
const compatCompatibleCount = computed(
  () => compatResults.value.filter((r) => r.compatible).length
)
const compatIncompatibleCount = computed(
  () => compatResults.value.filter((r) => !r.compatible).length
)

// * filePath -> 不兼容原因（用于列表角标）
const compatBadgeMap = computed(() => {
  const map: Record<string, string> = {}
  for (const r of compatResults.value) {
    if (!r.compatible) map[r.filePath] = r.reason
  }
  return map
})

// * 有缺失依赖的 mod 数量
const missingDepsCount = computed(
  () => Object.values(depCheckMap.value).filter((d) => d.missingDependencies.length > 0).length
)

// * 单点选中
const selectedMod = ref<string | null>(null)
// * 多选
const selectedMods = ref<Set<string>>(new Set())

// * 是否全选
const isAllSelected = computed(() => {
  if (filteredMods.value.length === 0) return false
  return filteredMods.value.every((m) => selectedMods.value.has(m.filePath))
})

// * 半选状态
const isIndeterminate = computed(() => {
  if (selectedMods.value.size === 0) return false
  return !isAllSelected.value
})
const selectedModName = computed(() => {
  if (!selectedMod.value) return ''
  const m = installedMods.value.find((m) => m.filePath === selectedMod.value)
  return m?.name || ''
})
const selectedModEnabled = computed(() => {
  if (!selectedMod.value) return false
  const m = installedMods.value.find((m) => m.filePath === selectedMod.value)
  return m?.enabled !== false
})
const selectedModHasUpdate = computed(() => {
  if (!selectedMod.value) return false
  return updateInfoMap.value[selectedMod.value]?.hasUpdate === true
})

const selectedModMissingDeps = computed(() => {
  if (!selectedMod.value) return 0
  return depCheckMap.value[selectedMod.value]?.missingDependencies?.length || 0
})

// 点击选中 / 再点击取消选中（行点击，点击到checkbox时不触发这个）
function selectMod(filePath: string) {
  selectedMod.value = selectedMod.value === filePath ? null : filePath
  if (!selectedMods.value.has(filePath)) {
    selectedMods.value = new Set([filePath])
  }
}

// * Checkbox 切换选中
function toggleModSelection(filePath: string) {
  const next = new Set(selectedMods.value)
  if (next.has(filePath)) {
    next.delete(filePath)
  } else {
    next.add(filePath)
  }
  selectedMods.value = next
  selectedMod.value = next.size === 1 ? filePath : null
}

// * 全选/取消全选
function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedMods.value = new Set()
    selectedMod.value = null
  } else {
    const allPaths = new Set(filteredMods.value.map((m) => m.filePath))
    selectedMods.value = allPaths
    selectedMod.value = null
  }
}

// * 批量启用
async function batchEnable() {
  for (const filePath of Array.from(selectedMods.value)) {
    await window.electronAPI?.mod.enable(filePath)
  }
  await loadMods()
}

// * 批量禁用
async function batchDisable() {
  for (const filePath of Array.from(selectedMods.value)) {
    await window.electronAPI?.mod.disable(filePath)
  }
  await loadMods()
}

// * 批量删除
async function batchDelete() {
  const names = Array.from(selectedMods.value)
    .map((fp) => installedMods.value.find((m) => m.filePath === fp)?.name || fp)
    .join('、')
  if (!await pxConfirm({ title: t('common.warning'), message: t('mod.confirmBatchDelete', { names }), type: 'danger', confirmText: t('common.confirm') })) return
  for (const filePath of Array.from(selectedMods.value)) {
    try {
      await window.electronAPI?.mod.uninstall(filePath)
    } catch {
      // * 单个失败继续
    }
  }
  selectedMods.value = new Set()
  selectedMod.value = null
  await loadMods()
}

// * 导出选中的 Mod 为 zip
async function exportSelected() {
  const api = window.electronAPI
  if (!api?.mod?.exportMods) {
    api?.notification?.send({ title: t('common.error'), body: t('mod.exportNotSupported'), type: 'error' })
    return
  }
  const filePaths = Array.from(selectedMods.value)
  try {
    const result = await api.mod.exportMods(filePaths)
    if (result?.ok) {
      api?.notification?.send({
        title: t('common.success'),
        body: t('mod.exportSuccess', { path: result.data }),
        type: 'success'
      })
    } else {
      api?.notification?.send({
        title: t('common.error'),
        body: t('mod.exportFailed', { error: result?.error || '' }),
        type: 'error'
      })
    }
  } catch (e) {
    api?.notification?.send({
      title: t('common.error'),
      body: t('mod.exportFailed', { error: (e as Error).message }),
      type: 'error'
    })
  }
}

// * 兼容性检查
async function checkCompatibility() {
  if (checkingCompat.value || installedMods.value.length === 0) return
  checkingCompat.value = true
  compatResults.value = []
  try {
    const api = window.electronAPI
    if (!api?.mod?.checkCompatibility) {
      // * 降级为本地检查
      await checkCompatibilityLocal()
      return
    }
    const result = await api.mod.checkCompatibility(
      installedMods.value,
      props.mcVersion || '',
      props.loader
    )
    if (result?.ok && Array.isArray(result.data)) {
      compatResults.value = result.data as CompatResult[]
    } else {
      await checkCompatibilityLocal()
    }
  } catch {
    await checkCompatibilityLocal()
  } finally {
    checkingCompat.value = false
  }
}

// * 本地兼容性检查（基于 loader 和 MC 版本）
async function checkCompatibilityLocal() {
  const results: CompatResult[] = []
  const loaderType = (props.loader || '').toLowerCase()
  const mcMajor = props.mcVersion ? parseInt(props.mcVersion.split('.')[1] || '0') : 0

  for (const mod of installedMods.value) {
    const deps = mod.dependencies || []
    let compatible = true
    let reason = t('mod.compatOk')

    // * 检查 loader 兼容性
    if (loaderType && deps.length > 0) {
      // * Fabric mods should have fabric loader deps
      const hasFabricDep = deps.some(
        (d) => d.toLowerCase().includes('fabric') || d.toLowerCase().includes('fabric-loader')
      )
      const hasForgeDep = deps.some(
        (d) => d.toLowerCase().includes('forge') || d.toLowerCase().includes('neoforged')
      )
      if (loaderType === 'fabric' && hasForgeDep) {
        compatible = false
        reason = t('mod.compatForgeOnFabric')
      } else if ((loaderType === 'forge' || loaderType === 'neoforge') && hasFabricDep) {
        compatible = false
        reason = t('mod.compatFabricOnForge')
      }
    }

    // * 检查版本名称中的 MC 版本（如 modname-1.20.1-xxx.jar）
    if (compatible && props.mcVersion) {
      const fileName = mod.fileName.toLowerCase()
      const versionMatch = fileName.match(/(\d+)\.(\d+)(?:\.(\d+))?/)
      if (versionMatch) {
        const fileMcMajor = parseInt(versionMatch[2])
        if (fileMcMajor !== mcMajor && mcMajor > 0) {
          compatible = false
          reason = t('mod.compatMcVersionMismatch', {
            expected: props.mcVersion,
            found: `1.${versionMatch[2]}`
          })
        }
      }
    }

    results.push({
      filePath: mod.filePath,
      modName: mod.name,
      compatible,
      reason
    })
  }
  compatResults.value = results
}

// 详情弹窗
const showDetailModal = ref(false)
const selectedDetailMod = ref<ModItem | null>(null)

// 筛选器 Tabs
const modFilterTabs = computed(() => {
  const all = installedMods.value.length
  const enabled = installedMods.value.filter((m) => m.enabled).length
  const disabled = installedMods.value.filter((m) => !m.enabled).length
  return [
    { key: 'all', label: t('mod.all'), count: all },
    { key: 'enabled', label: t('mod.enable'), count: enabled },
    { key: 'disabled', label: t('mod.disable'), count: disabled }
  ]
})

// * 过滤后的列表
const filteredMods = computed(() => {
  let list = installedMods.value
  if (modFilter.value === 'enabled') {
    list = list.filter((m) => m.enabled)
  } else if (modFilter.value === 'disabled') {
    list = list.filter((m) => !m.enabled)
  }
  if (modSearchText.value.trim()) {
    const kw = modSearchText.value.toLowerCase()
    list = list.filter(
      (m) => m.name.toLowerCase().includes(kw) || (m.description || '').toLowerCase().includes(kw)
    )
  }
  // * 排序
  if (modSort.value === 'version') {
    list = [...list].sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
  } else if (modSort.value === 'status') {
    list = [...list].sort((a, b) => (a.enabled === b.enabled ? 0 : a.enabled ? -1 : 1))
  } else {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name))
  }
  return list
})

// 加载 Mod 列表
async function loadMods() {
  if (!props.gameDir) return
  await modsStore.fetchMods(props.gameDir)
  installedMods.value = modsStore.mods.map((m) => ({
    name: m.displayName || m.fileName || m.id,
    version: m.version || t('mod.unknownVersion'),
    description: m.description || m.fileName || '',
    logoUrl: '',
    hovered: false,
    enabled: m.status === 'active',
    filePath: m.filePath,
    fileName: m.fileName,
    url: '',
    authors: m.author ? [m.author] : [],
    dependencies: m.dependencies || []
  }))
}

// 检查所有 mod 更新
async function checkAllUpdates() {
  if (checkingUpdates.value || installedMods.value.length === 0) return
  checkingUpdates.value = true
  updateInfoMap.value = {}
  try {
    const api = window.electronAPI
    if (!api?.mod?.checkUpdate) return
    const result = await api.mod.checkUpdate(installedMods.value, props.mcVersion, props.loader)
    if (result?.ok && Array.isArray(result.data)) {
      const map: Record<string, ModUpdateInfo> = {}
      for (const info of result.data) {
        map[info.filePath] = info
      }
      updateInfoMap.value = map
    }
  } catch (e) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('mod.updateCheckFailed'), type: 'error' })
  } finally {
    checkingUpdates.value = false
  }
}

// * 底部栏操作（单选）
async function updateSelectedMod() {
  if (!selectedMod.value) return
  const mod = installedMods.value.find((m) => m.filePath === selectedMod.value)
  const info = updateInfoMap.value[selectedMod.value]
  if (!mod || !info?.hasUpdate) {
    // * 还没检查或没有更新，先检查一次
    await checkAllUpdates()
    const newInfo = updateInfoMap.value[selectedMod.value]
    const currentMod = installedMods.value.find((m) => m.filePath === selectedMod.value)
    if (!newInfo?.hasUpdate || !currentMod) {
      window.electronAPI?.notification?.send({
        title: t('common.success'),
        body: t('mod.upToDateMsg', { name: mod?.name || '', version: mod?.version || '' }),
        type: 'success'
      })
      return
    }
    await doUpdateMod(currentMod, newInfo as ModUpdateInfo)
    return
  }
  await doUpdateMod(mod, info as ModUpdateInfo)
}

async function doUpdateMod(mod: ModItem, info: ModUpdateInfo) {
  if (!info?.latestDownloadUrl) {
    window.electronAPI?.notification?.send({
      title: t('common.info'),
      body: t('mod.updateFileNotFound'),
      type: 'warning'
    })
    return
  }
  if (!await pxConfirm({ title: t('common.warning'), message: t('mod.confirmUpdate', { name: mod.name, currentVersion: info.currentVersionName, latestVersion: info.latestVersionName }), type: 'warning', confirmText: t('common.confirm') }))
    return

  updatingMod.value = mod.filePath
  updateProgressMap.value[mod.filePath] = 0

  try {
    const api = window.electronAPI

    // * 监听更新进度
    const unsubProgress = api.mod?.onUpdateProgress?.(
      (data: { filePath: string; progress: number }) => {
        if (data.filePath === mod.filePath) {
          updateProgressMap.value[data.filePath] = data.progress
        }
      }
    )

    const result = await api.mod.update(mod, info)
    unsubProgress?.()

    if (result?.ok) {
      // * 更新成功 清除已更新的记录
      const newMap = { ...updateInfoMap.value }
      delete newMap[mod.filePath]
      updateInfoMap.value = newMap
      await loadMods()
    } else {
      window.electronAPI?.notification?.send({
        title: t('common.error'),
        body: t('mod.updateFailedMsg', { error: result?.error || t('mod.unknownError') }),
        type: 'error'
      })
    }
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: t('mod.updateErrorMsg', { error: (e as Error).message }),
      type: 'error'
    })
  } finally {
    updatingMod.value = null
    delete updateProgressMap.value[mod.filePath]
  }
}

// * 检查所有 mod 依赖
async function checkAllDependencies() {
  if (checkingDependencies.value || installedMods.value.length === 0) return
  checkingDependencies.value = true
  depCheckMap.value = {}
  try {
    const api = window.electronAPI
    if (!api?.mod?.checkDependencies) return
    const result = await api.mod.checkDependencies(installedMods.value, props.mcVersion, props.loader)
    if (result?.ok && Array.isArray(result.data)) {
      const map: Record<string, ModDependencyCheckResult> = {}
      for (const info of result.data) {
        map[info.mod.filePath] = info
      }
      depCheckMap.value = map
    }
  } catch (e) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('mod.dependencyCheckFailed'), type: 'error' })
  } finally {
    checkingDependencies.value = false
  }
}

// * 安装选中 mod 的缺失依赖
async function installSelectedDeps() {
  if (!selectedMod.value || installingDeps.value) return
  const mod = installedMods.value.find((m) => m.filePath === selectedMod.value)
  const depCheck = depCheckMap.value[selectedMod.value]
  if (!mod || !depCheck || depCheck.missingDependencies.length === 0) {
    await checkAllDependencies()
    const newDepCheck = depCheckMap.value[selectedMod.value]
    if (!newDepCheck || newDepCheck.missingDependencies.length === 0) {
      window.electronAPI?.notification?.send({
        title: t('common.info'),
        body: t('mod.noMissingDeps'),
        type: 'info'
      })
      return
    }
    // * 重新获取 mod，确保类型正确
    const currentMod = installedMods.value.find((m) => m.filePath === selectedMod.value)
    if (currentMod) {
      await doInstallDeps(currentMod, newDepCheck)
    }
    return
  }
  await doInstallDeps(mod, depCheck)
}

async function doInstallDeps(mod: ModItem, depCheck: ModDependencyCheckResult) {
  if (!await pxConfirm({ title: t('common.warning'), message: t('mod.confirmInstallDeps', { name: mod.name, count: depCheck.missingDependencies.length }), type: 'warning', confirmText: t('common.confirm') }))
    return

  installingDeps.value = mod.filePath
  depInstallProgress.value = {}

  try {
    const api = window.electronAPI

    const unsubProgress = api.mod?.onDependencyProgress?.(
      (data: { modPath: string; depName: string; progress: number }) => {
        if (data.modPath === mod.filePath) {
          depInstallProgress.value[data.depName] = data.progress
        }
      }
    )

    const result = await api.mod.installDependencies(mod, props.gameDir, props.mcVersion, props.loader)
    unsubProgress?.()

    if (result?.ok) {
      const data = (result as { data?: { success?: string[]; failed?: string[] } }).data || {}
      window.electronAPI?.notification?.send({
        title: t('mod.depInstallComplete'),
        body: t('mod.depInstallResult', { success: data.success?.length || 0, failed: data.failed?.length || 0 }),
        type: data.failed?.length ? 'warning' : 'success'
      })
      await loadMods()
      await checkAllDependencies()
    } else {
      window.electronAPI?.notification?.send({
        title: t('common.error'),
        body: t('mod.installFailedMsg', { error: result?.error || t('mod.unknownError') }),
        type: 'error'
      })
    }
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: t('mod.installErrorMsg', { error: (e as Error).message }),
      type: 'error'
    })
  } finally {
    installingDeps.value = null
    depInstallProgress.value = {}
  }
}

async function toggleSelectedModEnable() {
  if (!selectedMod.value) return
  const mod = installedMods.value.find((m) => m.filePath === selectedMod.value)
  if (!mod) return
  try {
    if (mod.enabled) {
      await window.electronAPI?.mod.disable(mod.filePath)
    } else {
      await window.electronAPI?.mod.enable(mod.filePath)
    }
    await loadMods()
  } catch (e) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('mod.toggleModFailed'), type: 'error' })
  }
}

async function removeSelectedMod() {
  if (!selectedMod.value) return
  const mod = installedMods.value.find((m) => m.filePath === selectedMod.value)
  if (!mod) return
  if (!await pxConfirm({ title: t('common.warning'), message: t('mod.confirmDeleteMod', { name: mod.name }), type: 'danger', confirmText: t('common.confirm') })) return
  try {
    await window.electronAPI?.mod.uninstall(mod.filePath)
    await loadMods()
    selectedMod.value = null
  } catch (e) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('mod.deleteModFailed'), type: 'error' })
  }
}

async function openModFolder() {
  const api = window.electronAPI
  if (!api?.shell) return
  // * 优先版本隔离目录
  const isolated = `${props.gameDir}/mods`
  const exists = await api.path?.exists(isolated)
  if (exists) {
    await api.shell.openPath(isolated)
  } else {
    // * 回退全局 .minecraft/mods
    const parts = props.gameDir.split(/[\\/]/)
    const idx = parts.indexOf('.minecraft')
    const mcRoot = idx >= 0 ? parts.slice(0, idx + 1).join('/') : props.gameDir
    await api.shell.openPath(`${mcRoot}/mods`)
  }
}

// 从文件安装 Mod
async function installModFromFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.accept = '.jar'
  input.onchange = async () => {
    const files = Array.from(input.files || [])
    if (!files.length) return
    const isolatedMods = `${props.gameDir}/mods`
    const isolatedExists = await window.electronAPI?.path?.exists(isolatedMods)
    let dest: string
    if (isolatedExists) {
      dest = isolatedMods
    } else {
      const parts = props.gameDir.split(/[\\/]/)
      const idx = parts.indexOf('.minecraft')
      const mcRoot = idx >= 0 ? parts.slice(0, idx + 1).join('/') : props.gameDir
      dest = `${mcRoot}/mods`
    }
    await window.electronAPI?.mod.installBatch(
      files.map((f) => (f as File & { path: string }).path),
      dest
    )
    await loadMods()
  }
  input.click()
}

// 显示详情
function showModDetails(mod: ModItem) {
  selectedDetailMod.value = mod
  showDetailModal.value = true
}

// * 打开文件位置
async function openModFile(mod: ModItem) {
  const dir = mod.filePath.replace(/[\\/][^\\/]+$/, '')
  await window.electronAPI?.shell.openPath(dir)
}

// 切换启用/禁用
async function toggleModEnable(mod: ModItem) {
  try {
    if (mod.enabled) {
      await window.electronAPI?.mod.disable(mod.filePath)
    } else {
      await window.electronAPI?.mod.enable(mod.filePath)
    }
    await loadMods()
  } catch (e) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('mod.toggleModFailed'), type: 'error' })
  }
}

// * 删除单个 Mod
async function removeMod(mod: ModItem) {
  if (!await pxConfirm({ title: t('common.warning'), message: t('mod.confirmDeleteMod', { name: mod.name }), type: 'danger', confirmText: t('common.confirm') })) return
  try {
    await window.electronAPI?.mod.uninstall(mod.filePath)
    await loadMods()
  } catch (e) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('mod.deleteModFailed'), type: 'error' })
  }
}

onMounted(() => {
  loadMods()
})
</script>

<style scoped lang="scss">
.mod-manager {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  overflow: hidden;
}

  /* 搜索卡片 */
.mod-search-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: color-mix(in oklab, var(--voxver-bg-secondary) 65%, transparent);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  padding: 0 12px;
  height: 36px;
  svg {
    flex-shrink: 0;
  }
}
.mod-search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--voxver-text-primary);
  font-size: 13px;
  outline: none;
  &::placeholder {
    color: var(--voxver-text-muted);
  }
}

  /* 操作按钮 */  
.mod-toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.form-action-btn {
  padding: 6px 14px;
  border-radius: var(--voxver-radius-sm);
  font-size: 12.5px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.12s;
  border: 1px solid var(--voxver-border-color);
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  color: var(--voxver-text-primary);
  &:hover {
    background: var(--voxver-bg-hover);
  }
  &.primary-outline {
    border-color: var(--voxver-primary);
    color: var(--voxver-primary);
    &:hover {
      background: color-mix(in oklab, var(--voxver-primary) 8%, transparent);
    }
  }
}

  /* 筛选器 Tabs */
.mod-tabs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.mod-tabs {
  display: flex;
  gap: 4px;
}
.mod-sort-select {
  padding: 4px 8px;
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  background: color-mix(in oklab, var(--voxver-bg-secondary) 65%, transparent);
  color: var(--voxver-text-secondary);
  font-size: 12px;
  outline: none;
  cursor: pointer;
  &:focus {
    border-color: var(--voxver-primary);
  }
}
.mod-tab {
  padding: 5px 12px;
  border: none;
  background: transparent;
  color: var(--voxver-text-secondary);
  font-size: 12.5px;
  cursor: pointer;
  border-radius: var(--voxver-radius-sm);
  transition: all 0.12s;
  &.active {
    background: var(--voxver-primary);
    color: #fff;
  }
  &:hover:not(.active) {
    background: var(--voxver-bg-hover);
  }
}
.mod-tab-count {
  opacity: 0.7;
  font-size: 11px;
}

/* Mod 列表（虚拟滚动） */
.mod-list-section {
  flex: 1;
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.mod-list-wrapper {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.mod-virtual-list {
  height: 100%;
}

.mod-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--voxver-radius-md);
  background: color-mix(in oklab, var(--voxver-bg-secondary) 65%, transparent);
  border: 1px solid transparent;
  transition: all 0.12s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  height: 64px;
  box-sizing: border-box;
  margin-bottom: 4px;
  &:hover {
    border-color: var(--voxver-border-color);
    background: var(--voxver-bg-hover);
  }
  &.selected {
    border-color: var(--voxver-primary);
    background: color-mix(in oklab, var(--voxver-primary) 6%, transparent);
    border-left: 3px solid var(--voxver-primary);
    padding-left: 9px;
  }
}
.mod-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--voxver-primary);
  cursor: pointer;
  flex-shrink: 0;
}
.mod-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--voxver-radius-sm);
  object-fit: cover;
  flex-shrink: 0;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
}
.mod-icon-default {
  width: 36px;
  height: 36px;
  border-radius: var(--voxver-radius-sm);
  background: var(--voxver-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}
.mod-info {
  flex: 1;
  min-width: 0;
}
.mod-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.mod-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mod-version {
  font-size: 11px;
  color: var(--voxver-text-muted);
  flex-shrink: 0;
}
.mod-disabled-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: var(--voxver-radius-xs);
  background: var(--voxver-warning);
  color: #fff;
  flex-shrink: 0;
}
.mod-desc {
  font-size: 11.5px;
  color: var(--voxver-text-secondary);
  margin: 2px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* * 悬浮操作按钮 */
.mod-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.12s;
  flex-shrink: 0;
  &.visible {
    opacity: 1;
  }
}
.mod-action-btn {
  padding: 4px 10px;
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  color: var(--voxver-text-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
  &:hover {
    background: var(--voxver-bg-hover);
  }
  &.danger {
    color: var(--voxver-error);
    border-color: var(--voxver-error);
  }
  &.danger:hover {
    background: rgb(239 68 68 / 0.1);
  }
}

  /* 底部操作栏 */
.mod-bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  background: color-mix(in oklab, var(--voxver-bg-secondary) 65%, transparent);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  flex-shrink: 0;
}
.mod-bottom-count {
  font-size: 12.5px;
  color: var(--voxver-text-secondary);
  white-space: nowrap;
}
.mod-bottom-actions {
  display: flex;
  gap: 6px;
}
.mod-bottom-btn {
  padding: 5px 12px;
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  color: var(--voxver-text-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
  &:hover:not(:disabled) {
    background: var(--voxver-bg-hover);
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  &.danger {
    color: var(--voxver-error);
  }
  &.danger:hover:not(:disabled) {
    background: rgb(239 68 68 / 0.1);
  }
}

/* 详情弹窗 */
.mod-detail-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--voxver-z-toast);
}
.mod-detail-window {
  width: 480px;
  max-width: 90vw;
  max-height: 80vh;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border-radius: var(--voxver-radius-xl);
  border: 1px solid var(--voxver-border-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--voxver-shadow-xl);
}
.mod-detail-header {
  height: 42px;
  background: color-mix(in oklab, var(--voxver-bg-secondary) 65%, transparent);
  border-bottom: 1px solid var(--voxver-border-color);
  display: flex;
  align-items: center;
  padding: 0 12px;
  justify-content: space-between;
}
.mod-detail-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}
.mod-detail-close {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: var(--voxver-text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--voxver-radius-sm);
  transition: all 0.12s;
  &:hover {
    background: var(--voxver-bg-hover);
    color: var(--voxver-text-primary);
  }
}
.mod-detail-body {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.mod-detail-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--voxver-radius-md);
  object-fit: cover;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
}
.mod-detail-icon-default {
  width: 64px;
  height: 64px;
  border-radius: var(--voxver-radius-md);
  background: var(--voxver-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 28px;
}
.mod-detail-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--voxver-text-primary);
  text-align: center;
}
.mod-detail-version,
.mod-detail-authors,
.mod-detail-deps,
.mod-detail-url,
.mod-detail-path {
  font-size: 13px;
  color: var(--voxver-text-secondary);
  text-align: center;
  word-break: break-all;
}
.mod-detail-desc {
  font-size: 13px;
  color: var(--voxver-text-primary);
  text-align: center;
  line-height: 1.5;
}
.mod-detail-url a {
  color: var(--voxver-primary);
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

  /* * 空状态 */
 .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--voxver-text-muted);
  font-size: 13px;
  gap: 10px;
  .spin-icon {
    animation: spin 1s linear infinite;
  }
}


/* 弹窗过渡 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* * ── Mod 更新相关 ── */
.spin-icon-sm {
  animation: spin 1s linear infinite;
  display: inline-block;
  vertical-align: middle;
  margin-right: 4px;
}

/* mod 卡片有更新时的右侧橙色边框 */
.mod-item.has-update {
  border-right: 3px solid var(--voxver-warning);
}

/* * 有更新角标 */
.mod-update-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: var(--voxver-radius-xs);
  font-size: 10px;
  font-weight: 600;
  background: rgb(245 158 11 / 0.15);
  color: var(--voxver-warning);
  border: 1px solid rgb(245 158 11 / 0.35);
  margin-left: 4px;
}

/* 缺失依赖角标 */
.mod-dep-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: var(--voxver-radius-xs);
  font-size: 10px;
  font-weight: 600;
  background: rgb(239 68 68 / 0.15);
  color: var(--voxver-error);
  border: 1px solid rgb(239 68 68 / 0.35);
  margin-left: 4px;
}

/* 不兼容角标 */
.mod-compat-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: var(--voxver-radius-xs);
  font-size: 10px;
  font-weight: 600;
  background: rgb(239 68 68 / 0.15);
  color: var(--voxver-error);
  border: 1px solid rgb(239 68 68 / 0.35);
  margin-left: 4px;
  cursor: help;
}

/* 不兼容时底部橙色边框 */
.mod-item.compat-incompatible {
  border-bottom: 2px solid var(--voxver-error);
}

/* 缺失依赖时的左边框 */
.mod-item.missing-deps {
  border-left: 3px solid var(--voxver-error);
}

/* * 更新中进度条（覆盖在卡片顶部） */
.mod-update-progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: color-mix(in oklab, var(--voxver-primary) 15%, transparent);
  border-radius: 2px 2px 0 0;
  overflow: hidden;

  .mod-update-progress-fill {
    height: 100%;
    background: var(--voxver-primary);
    transition: width 0.2s ease;
  }
}

/* * 底部操作栏「更新」按钮有更新时变橙色高亮 */
.mod-bottom-btn.has-update {
  background: rgb(245 158 11 / 0.12);
  color: var(--voxver-warning);
  border-color: rgb(245 158 11 / 0.4);

  &:hover:not(:disabled) {
    background: rgb(245 158 11 / 0.22);
  }
}

/* * 底部操作栏「安装依赖」按钮有缺失时变红色高亮 */
.mod-bottom-btn.missing-deps {
  background: rgb(239 68 68 / 0.12);
  color: var(--voxver-error);
  border-color: rgb(239 68 68 / 0.4);

  &:hover:not(:disabled) {
    background: rgb(239 68 68 / 0.22);
  }
}

/* * 工具栏检查更新按钮检查中状态 */
.form-action-btn.checking {
  opacity: 0.7;
  cursor: wait;
}

/* * 全选栏 */
.mod-select-all-bar {
  padding: 4px 0;
}
.mod-select-all-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--voxver-text-secondary);
  cursor: pointer;
}

/* * 兼容性检查面板 */
.mod-compat-panel {
  flex-shrink: 0;
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  background: color-mix(in oklab, var(--voxver-bg-secondary) 65%, transparent);
  max-height: 180px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.mod-compat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--voxver-border-color);
  flex-shrink: 0;
}
.mod-compat-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}
.mod-compat-summary {
  flex: 1;
  font-size: 11.5px;
  display: flex;
  gap: 8px;
}
.compat-ok {
  color: var(--voxver-success);
}
.compat-bad {
  color: var(--voxver-error);
}
.mod-compat-close {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--voxver-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--voxver-radius-sm);
  flex-shrink: 0;
  &:hover {
    background: var(--voxver-bg-hover);
    color: var(--voxver-text-primary);
  }
}
.mod-compat-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}
.mod-compat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 12px;
  &.is-incompatible {
    background: rgb(239 68 68 / 0.06);
  }
}
.mod-compat-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.mod-compat-name {
  font-weight: 500;
  color: var(--voxver-text-primary);
  flex-shrink: 0;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mod-compat-reason {
  color: var(--voxver-text-secondary);
}
</style>

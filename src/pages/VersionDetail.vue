<template>
  <div class="version-detail-page">
    <!-- 顶部导航栏 -->
    <div class="vd-header">
      <button class="back-btn" @click="goBack">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <h1 class="vd-title">{{ $t('version.detail') }}</h1>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="vd-loading">
      <div class="spinner"></div>
      <span>{{ $t('download.loading') }}</span>
    </div>

    <!-- 版本信息 -->
    <template v-else-if="versionInfo">
      <div class="vd-hero">
        <div class="vd-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            stroke-width="1.5"
          >
            <path
              d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
            />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
        <div class="vd-info">
          <h2 class="vd-name">{{ versionDisplayName }}</h2>
          <div class="vd-meta">
            <span class="vd-type-badge" :class="versionInfo.type">
              {{ typeLabel }}
            </span>
            <span class="vd-date">{{
              versionInfo.releaseTime ? formatDate(versionInfo.releaseTime) : ''
            }}</span>
          </div>
          <p class="vd-desc">{{ versionInfo.id }}</p>
        </div>
      </div>

      <!-- ModLoader 选择 -->
      <div class="vd-section">
        <h3 class="section-title">{{ $t('version.addons') }}</h3>
        <p class="section-hint">{{ $t('version.selectLoaderHint') }}</p>

        <div class="loader-grid">
          <button
            v-for="loader in modLoaders"
            :key="loader.type"
            class="loader-card"
            :class="{
              selected: selectedLoader === loader.type,
              disabled: !isLoaderCompatible(loader.type)
            }"
            :disabled="!isLoaderCompatible(loader.type)"
            @click="selectLoader(loader.type)"
          >
            <span class="loader-icon">{{ loader.icon }}</span>
            <span class="loader-name">{{ loader.name }}</span>
            <span class="loader-desc">{{ loader.desc }}</span>
            <div v-if="selectedLoader === loader.type" class="loader-check">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div v-if="!isLoaderCompatible(loader.type)" class="loader-incompatible">
              <span>{{ $t('version.incompatible') }}</span>
            </div>
          </button>

          <!-- Vanilla（无 ModLoader） -->
          <button
            class="loader-card"
            :class="{ selected: selectedLoader === '' }"
            @click="selectLoader('')"
          >
            <span class="loader-icon">V</span>
            <span class="loader-name">{{ $t('game.vanilla') }}</span>
            <span class="loader-desc">{{ $t('version.noModLoader') }}</span>
            <div v-if="selectedLoader === ''" class="loader-check">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      <!-- 加载器附加内容（选择加载器后立即显示） -->
      <div v-if="selectedLoader" class="vd-section addons-section">
        <h3 class="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            {{ currentLoaderName }} {{ $t('version.addonsTitle') }}
          </h3>

          <!-- ====== Forge / NeoForge：OptiFine ====== -->
          <template v-if="selectedLoader === 'forge' || selectedLoader === 'neoforge'">
            <div class="addon-card">
              <div class="addon-header">
                <div class="addon-info">
                  <span class="addon-icon">OF</span>
                  <div>
                    <span class="addon-name">OptiFine ({{ $t('version.highDefinition') }})</span>
                    <span class="addon-desc">{{ $t('version.optifineHint') }}</span>
                  </div>
                </div>
              </div>

              <div class="addon-body">
                <template v-if="availableOptiFineVersions.length > 0">
                  <div class="optifine-chips">
                    <div
                      v-for="ver in availableOptiFineVersions"
                      :key="ver"
                      class="optifine-chip"
                      :class="{ active: selectedOptiFineVersion === ver }"
                      @click="selectedOptiFineVersion = ver"
                    >{{ ver }}</div>
                  </div>
                </template>
                <div class="optifine-custom">
                  <input
                    type="text"
                    class="optifine-input"
                    :value="availableOptiFineVersions.includes(selectedOptiFineVersion) ? '' : selectedOptiFineVersion"
                    :placeholder="$t('version.optifineCustom')"
                    @input="selectedOptiFineVersion = ($event.target as HTMLInputElement).value"
                  />
                </div>
              </div>
            </div>
          </template>

          <!-- ====== Fabric：Fabric API（必须安装）====== -->
          <template v-if="selectedLoader === 'fabric'">
            <div class="addon-card">
              <div class="addon-header">
                <div class="addon-info">
                  <span class="addon-icon fabric-api-icon">FA</span>
                  <div>
                    <span class="addon-name">Fabric API</span>
                    <span class="addon-desc">{{ $t('version.fabricApiHint') }}</span>
                  </div>
                </div>
              </div>

              <div class="addon-body">
                <div v-if="fabricApiLoading" class="fabric-api-loading">
                  <div class="spinner-sm"></div>
                  <span>{{ $t('modloader.loading') }}</span>
                </div>
                <template v-else-if="fabricApiVersions.length > 0">
                  <div class="optifine-chips">
                    <div
                      v-for="ver in fabricApiVersions"
                      :key="ver"
                      class="optifine-chip"
                      :class="{ active: selectedFabricApiVersion === ver }"
                      @click="selectedFabricApiVersion = ver"
                    >{{ ver }}</div>
                  </div>
                  <p class="fabric-api-auto" v-if="selectedFabricApiVersion">
                    {{ $t('version.fabricApiAutoSelected') }}
                  </p>
                </template>
                <p v-else class="no-versions">{{ $t('version.fabricApiLoadFailed') }}</p>
              </div>
            </div>
          </template>

          <!-- ====== Quilt：预留 ====== -->
          <template v-if="selectedLoader === 'quilt'">
            <div class="addon-card addon-card--disabled">
              <div class="addon-header">
                <div class="addon-info">
                  <span class="addon-icon quilt-api-icon">QS</span>
                  <div>
                    <span class="addon-name">QSL / QFAPI</span>
                    <span class="addon-desc">{{ $t('version.quiltApiHint') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

      <!-- 加载器版本选择弹窗 -->
      <div
        v-if="showLoaderVersions"
        class="loader-version-modal"
        @click.self="showLoaderVersions = false"
      >
        <div class="modal-content vox-card">
          <div class="modal-header">
            <h3>{{ $t('version.loaderVersionSelect', { name: currentLoaderName }) }}</h3>
            <button class="modal-close" @click="showLoaderVersions = false">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div v-if="loaderVersionsLoading" class="versions-loading">
              <div class="spinner"></div>
              <span>{{ $t('modloader.loading') }}</span>
            </div>
            <div v-else-if="loaderVersions.length > 0" class="versions-list">
              <div
                v-for="ver in loaderVersions"
                :key="ver.id"
                class="version-item"
                :class="{ selected: selectedLoaderVersion === ver.id }"
                @click="selectLoaderVersion(ver)"
              >
                <div class="version-info">
                  <span class="version-name">{{ ver.id }}</span>
                  <span class="version-date">{{ formatDate(ver.releaseTime) }}</span>
                </div>
                <div v-if="ver.recommended" class="version-badge recommended">{{ $t('version.recommended') }}</div>
                <div v-else-if="ver.latest" class="version-badge latest">{{ $t('version.latest') }}</div>
              </div>
            </div>
            <div v-else class="no-versions">
              <p>{{ $t('modloader.noAvailable') }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showLoaderVersions = false">{{ $t('common.cancel') }}</button>
            <button
              class="btn-confirm"
              :disabled="!selectedLoaderVersion"
              @click="confirmLoaderVersion"
            >
              {{ $t('version.confirmSelection') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 下载按钮 -->
      <div class="vd-footer">
        <div class="target-folder-row">
          <div class="target-folder">
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
            <span>{{ targetFolder || $t('version.selectFolder') }}</span>
          </div>
          <button class="btn-browse" @click="browseFolder">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <div class="selected-info" v-if="selectedLoader && selectedLoaderVersion">
          <span class="selected-label">{{ $t('version.versionNameLabel') }}</span>
          <span class="selected-name">{{ versionDisplayName }}</span>
        </div>

        <button class="btn-download" @click="handleDownload" :disabled="downloading">
          <svg
            v-if="downloading"
            class="spin-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          <svg
            v-else
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>{{ downloading ? $t('version.preparingDownload') : $t('version.startDownload') }}</span>
        </button>
      </div>
    </template>

    <!-- 加载失败 -->
    <div v-else class="vd-error">
      <p>{{ $t('version.loadFailed') }}</p>
      <button class="vox-btn vox-btn--primary" @click="loadVersionInfo">{{ $t('common.retry') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDownloadStore } from '../stores/download.store'

interface VersionDetailInfo {
  id: string
  type: string
  releaseTime: string
  [key: string]: unknown
}

interface LoaderVersionOption {
  id: string
  releaseTime: string
  recommended: boolean
  latest: boolean
}

const { t: i18n } = useI18n()

const router = useRouter()
const route = useRoute()
const downloadStore = useDownloadStore()

const versionId = computed(() => route.params.versionId as string)
const versionInfo = ref<VersionDetailInfo | null>(null)
const loading = ref(true)
const downloading = ref(false)
const selectedLoader = ref('')
const selectedLoaderVersion = ref('')
const selectedOptiFine = ref(false)
const selectedOptiFineVersion = ref('')
const selectedFabricApi = ref(false)
const selectedFabricApiVersion = ref('')
const fabricApiVersions = ref<string[]>([])
const fabricApiLoading = ref(false)
const targetFolder = ref('')
const showLoaderVersions = ref(false)
const loaderVersions = ref<LoaderVersionOption[]>([])
const loaderVersionsLoading = ref(false)

// 加载器互斥组：Forge / NeoForge / Fabric 互不兼容
const incompatibleLoaders = ['forge', 'neoforge', 'fabric']

// OptiFine 已知版本（按 MC 版本映射）
const optiFineVersions: Record<string, string[]> = {
  '1.21.4': ['HD_U_J2'],
  '1.21.3': ['HD_U_J1'],
  '1.21.1': ['HD_U_J1'],
  '1.21':   ['HD_U_J1'],
  '1.20.6': ['HD_U_I6'],
  '1.20.4': ['HD_U_I6'],
  '1.20.2': ['HD_U_I6'],
  '1.20.1': ['HD_U_I5', 'HD_U_I3', 'HD_U_I2'],
  '1.20':   ['HD_U_I5', 'HD_U_I3', 'HD_U_I2'],
  '1.19.4': ['HD_U_I5'],
  '1.19.3': ['HD_U_I4'],
  '1.19.2': ['HD_U_I2'],
  '1.18.2': ['HD_U_H9'],
  '1.17.1': ['HD_U_G9'],
  '1.16.5': ['HD_U_G8'],
  '1.16.4': ['HD_U_G7'],
  '1.15.2': ['HD_U_G6'],
  '1.14.4': ['HD_U_F6'],
  '1.12.2': ['HD_U_G5'],
  '1.8.9':  ['HD_U_L5']
}

const availableOptiFineVersions = computed(() => {
  // 如果找不到对应版本，返回默认版本（最新 OptiFine）
  return optiFineVersions[versionId.value] || ['HD_U_J2']
})

const optiFineDisplayName = computed(() => {
  if (!selectedOptiFine.value || !selectedOptiFineVersion.value) return ''
  return `OptiFine_${selectedOptiFineVersion.value}`
})

// 动态版本显示名称：[游戏版本]-[加载器]_[加载器版本]-[OptiFine]_[版本]
const versionDisplayName = computed(() => {
  const parts: string[] = [versionId.value]

  if (selectedLoader.value && selectedLoaderVersion.value) {
    const loader = modLoaders.find((l) => l.type === selectedLoader.value)
    const loaderName = loader?.name || selectedLoader.value
    parts.push(`${loaderName}_${selectedLoaderVersion.value}`)
  }

  if (selectedOptiFineVersion.value) {
    parts.push(`OptiFine_${selectedOptiFineVersion.value}`)
  }

  return parts.join('-')
})

const modLoaders = [
  { type: 'fabric', icon: 'F', name: 'Fabric', desc: '轻量级 ModLoader', minVersion: '1.14.4' },
  { type: 'forge', icon: 'FG', name: 'Forge', desc: '最流行的 ModLoader', minVersion: '1.0.0' },
  {
    type: 'neoforge',
    icon: 'NF',
    name: 'NeoForge',
    desc: 'Forge 的现代分支',
    minVersion: '1.20.1'
  },
  { type: 'quilt', icon: 'Q', name: 'Quilt', desc: 'Fabric 的继任者', minVersion: '1.18.2' }
]

const currentLoaderName = computed(() => {
  const loader = modLoaders.find((l) => l.type === selectedLoader.value)
  return loader?.name || 'ModLoader'
})

const typeLabel = computed(() => {
  const t = versionInfo.value?.type
  if (t === 'release') return i18n('game.release')
  if (t === 'snapshot') return i18n('game.snapshot')
  if (t === 'old_alpha') return i18n('version.oldAlpha')
  if (t === 'old_beta') return i18n('version.oldBeta')
  return t ?? ''
})

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function goBack() {
  router.back()
}

function compareVersions(v1: string, v2: string): number {
  const parsePart = (p: string) => {
    const match = p.match(/(\d+)([a-zA-Z]*)/)
    const num = match ? parseInt(match[1]) : 0
    const suffix = match ? match[2] : ''
    return { num, suffix }
  }
  const parts1 = v1.split('.').map(parsePart)
  const parts2 = v2.split('.').map(parsePart)
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || { num: 0, suffix: '' }
    const p2 = parts2[i] || { num: 0, suffix: '' }
    if (p1.num !== p2.num) return p1.num - p2.num
    if (p1.suffix !== p2.suffix) return p1.suffix.localeCompare(p2.suffix)
  }
  return 0
}

function isLoaderCompatible(loaderType: string): boolean {
  const loader = modLoaders.find((l) => l.type === loaderType)
  if (!loader || !loader.minVersion) return true
  return compareVersions(versionId.value, loader.minVersion) >= 0
}

async function loadVersionInfo() {
  loading.value = true
  const api = window.electronAPI
  if (api?.versions) {
    versionInfo.value = await api.versions.getInfo(versionId.value) as VersionDetailInfo
  }
  if (api?.folders) {
    const last = await api.folders.getLast()
    targetFolder.value = last ?? ''
  }
  loading.value = false
}

async function browseFolder() {
  const api = window.electronAPI
  if (api?.dialog) {
    const result = await api.dialog.selectFolder()
    if (result) {
      targetFolder.value = result
    }
  }
}

async function selectLoader(loaderType: string) {
  if (selectedLoader.value === loaderType) {
    // 取消选择
    selectedLoader.value = ''
    selectedLoaderVersion.value = ''
    selectedOptiFine.value = false
    selectedOptiFineVersion.value = ''
    selectedFabricApi.value = false
    selectedFabricApiVersion.value = ''
    return
  }

  selectedLoader.value = loaderType

  if (loaderType === '') {
    selectedLoaderVersion.value = ''
    selectedOptiFineVersion.value = ''
    selectedFabricApiVersion.value = ''
    fabricApiVersions.value = []
    return
  }

  // Fabric：自动获取 Fabric API 版本
  if (loaderType === 'fabric') {
    fetchFabricApiVersions()
  }

  // 加载版本列表
  loaderVersionsLoading.value = true
  showLoaderVersions.value = true
  selectedLoaderVersion.value = ''
  try {
    const api = window.electronAPI
    if (api?.modloader) {
      const res = await api.modloader.getVersions(versionId.value, loaderType)
      if (res?.ok && Array.isArray(res.data)) {
        // 服务返回 string[]，映射为 UI 需要的对象格式
        const versions: string[] = res.data
        loaderVersions.value = versions.map((v) => ({
          id: v,
          releaseTime: '',
          recommended: false,
          latest: false
        }))
        // 标记最新版本（数组第一个通常是推荐版本）
        if (loaderVersions.value.length > 0) {
          loaderVersions.value[0].recommended = true
          if (loaderVersions.value.length > 1) {
            loaderVersions.value[loaderVersions.value.length - 1].latest = true
          }
        }
      } else {
        console.warn('modloader:get-versions 返回空或失败:', res)
        loaderVersions.value = []
      }
    }
  } catch (e) {
    console.error('Failed to load loader versions:', e)
    loaderVersions.value = []
  } finally {
    loaderVersionsLoading.value = false
  }
}

function selectLoaderVersion(version: LoaderVersionOption) {
  selectedLoaderVersion.value = version.id
}

function confirmLoaderVersion() {
  showLoaderVersions.value = false
}

// Fabric API 已知版本（按 MC 版本映射，优先使用本地）
const fabricApiVersionsFallback: Record<string, string[]> = {
  '1.21.4': ['0.108.0+1.21.4'],
  '1.21.3': ['0.107.0+1.21.3'],
  '1.21.1': ['0.105.0+1.21.1'],
  '1.21': ['0.104.0+1.21'],
  '1.20.6': ['0.100.0+1.20.6'],
  '1.20.4': ['0.97.2+1.20.4'],
  '1.20.2': ['0.92.2+1.20.2'],
  '1.20.1': ['0.92.2+1.20.1', '0.91.2+1.20.1', '0.90.0+1.20.1'],
  '1.20': ['0.83.0+1.20'],
  '1.19.4': ['0.76.0+1.19.4'],
  '1.19.2': ['0.58.0+1.19.2'],
  '1.18.2': ['0.47.10+1.18.2'],
  '1.16.5': ['0.42.0+1.16.5']
}
// 如果找不到对应版本，默认用最新的一个
const defaultFabricApiVersion = '0.108.0+1.21.4'

async function fetchFabricApiVersions() {
  fabricApiLoading.value = true
  selectedFabricApiVersion.value = ''
  
  // 1. 优先使用本地 fallback 版本
  if (fabricApiVersionsFallback[versionId.value]) {
    fabricApiVersions.value = fabricApiVersionsFallback[versionId.value]
  } else {
    // 找不到对应版本，用默认版本
    fabricApiVersions.value = [defaultFabricApiVersion]
  }
  
  // 自动选择版本
  if (fabricApiVersions.value.length > 0) {
    // 优先找匹配当前 MC 版本的
    const exactMatch = fabricApiVersions.value.find(
      (v) => v.includes(`+${versionId.value}`) || v.startsWith(versionId.value)
    )
    selectedFabricApiVersion.value = exactMatch || fabricApiVersions.value[0]
  }
  
  fabricApiLoading.value = false
}

function toggleOptiFine() {
  selectedOptiFine.value = !selectedOptiFine.value
  if (!selectedOptiFine.value) {
    selectedOptiFineVersion.value = ''
  }
}

function toggleFabricApi() {
  selectedFabricApi.value = !selectedFabricApi.value
  if (selectedFabricApi.value) {
    if (fabricApiVersions.value.length === 0) {
      fetchFabricApiVersions()
    }
  } else {
    selectedFabricApiVersion.value = ''
  }
}

async function handleDownload() {
  if (downloading.value) return
  downloading.value = true

  try {
    await downloadStore.startVersionDownload(
      versionId.value,
      targetFolder.value,
      selectedLoader.value,
      selectedLoaderVersion.value,
      versionDisplayName.value
    )
    // 不自动跳转，通过右上角 DownloadFloat 提示查看进度
  } finally {
    downloading.value = false
  }
}

onMounted(() => {
  loadVersionInfo()
})
</script>

<style scoped>
.version-detail-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.vd-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--voxver-border-color);
}

.back-btn {
  background: var(--voxver-bg-hover);
  border: 1px solid var(--voxver-border-color-light);
  border-radius: var(--voxver-radius-md);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--voxver-text-secondary);
  transition: all 0.2s;
}
.back-btn:hover {
  background: var(--voxver-primary-light);
  color: #fff;
}

.vd-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}

.vd-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--voxver-text-muted);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid color-mix(in oklab, var(--voxver-primary) 20%, transparent);
  border-top-color: var(--voxver-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.vd-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 20px;
  background: color-mix(in oklab, var(--voxver-primary) 8%, transparent);
  border-bottom: 1px solid var(--voxver-border-color);
}

.vd-icon {
  width: 72px;
  height: 72px;
  border-radius: var(--voxver-radius-sm);
  background: var(--voxver-gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vd-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--voxver-text-primary);
  margin-bottom: 8px;
}

.vd-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.vd-type-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--voxver-radius-xs);
  font-weight: 600;
}
.vd-type-badge.release {
  background: color-mix(in oklab, var(--voxver-success) 20%, transparent);
  color: var(--voxver-success);
}
.vd-type-badge.snapshot {
  background: color-mix(in oklab, var(--voxver-warning) 20%, transparent);
  color: var(--voxver-warning);
}
.vd-type-badge.old_alpha,
.vd-type-badge.old_beta {
  background: color-mix(in oklab, var(--voxver-error) 20%, transparent);
  color: var(--voxver-error);
}

.vd-date {
  font-size: 12px;
  color: var(--voxver-text-muted);
}

.vd-desc {
  font-size: 13px;
  color: var(--voxver-text-muted);
}

.vd-section {
  padding: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--voxver-text-primary);
  margin-bottom: 6px;
}

.section-hint {
  font-size: 12px;
  color: var(--voxver-text-muted);
  margin-bottom: 16px;
}

.loader-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.loader-card {
  position: relative;
  background: var(--voxver-bg-hover);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.loader-card:hover:not(.disabled) {
  border-color: color-mix(in oklab, var(--voxver-primary) 40%, transparent);
  background: color-mix(in oklab, var(--voxver-primary) 6%, transparent);
}
.loader-card.selected {
  border-color: var(--voxver-primary);
  background: color-mix(in oklab, var(--voxver-primary) 12%, transparent);
}
.loader-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loader-icon {
  font-size: 18px;
  font-weight: 700;
  color: var(--voxver-primary);
  margin-bottom: 2px;
}
.loader-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}
.loader-desc {
  font-size: 11px;
  color: var(--voxver-text-muted);
}

.loader-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--voxver-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.loader-incompatible {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: var(--voxver-radius-xs);
  background: color-mix(in oklab, var(--voxver-error) 20%, transparent);
  color: var(--voxver-error);
}

/* ========== 加载器附加内容 ========== */
.addons-section {
  /* 去掉 overflow: hidden，避免内容被截断 */
}

.addon-card {
  background: var(--voxver-bg-hover);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  /* 去掉 overflow: hidden，避免内容被截断 */
  transition: border-color 0.2s;
}

.addon-card:has(.optifine-toggle input:checked) {
  border-color: color-mix(in oklab, var(--voxver-primary) 30%, transparent);
}

.addon-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  gap: 12px;
}

.addon-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.addon-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--voxver-radius-sm);
  background: var(--voxver-gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.addon-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}

.addon-desc {
  display: block;
  font-size: 11px;
  color: var(--voxver-text-muted);
  margin-top: 2px;
}

.addon-toggle {
  flex-shrink: 0;
}

.addon-body {
  padding: 0 16px 14px;
}

.optifine-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.optifine-chip {
  padding: 5px 12px;
  border-radius: var(--voxver-radius-sm);
  background: var(--voxver-bg-base);
  border: 1px solid var(--voxver-border-color);
  font-size: 12px;
  color: var(--voxver-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.optifine-chip:hover {
  border-color: color-mix(in oklab, var(--voxver-primary) 40%, transparent);
}

.optifine-chip.active {
  border-color: var(--voxver-primary);
  background: color-mix(in oklab, var(--voxver-primary) 12%, transparent);
  color: var(--voxver-primary);
}

.optifine-custom {
  width: 100%;
}

.optifine-input {
  width: 100%;
  padding: 6px 12px;
  border-radius: var(--voxver-radius-sm);
  border: 1px solid var(--voxver-border-color);
  background: var(--voxver-bg-base);
  color: var(--voxver-text-primary);
  font-size: 12px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.optifine-input:focus {
  border-color: var(--voxver-primary);
}

.optifine-input::placeholder {
  color: var(--voxver-text-muted);
}

.optifine-toggle {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.optifine-toggle input[type='checkbox'] {
  display: none;
}

.toggle-slider {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: var(--voxver-bg-base);
  border: 1px solid var(--voxver-border-color);
  transition: all 0.2s;
  position: relative;
  flex-shrink: 0;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--voxver-text-muted);
  transition: all 0.2s;
}

.optifine-toggle input:checked + .toggle-slider {
  background: var(--voxver-primary);
  border-color: var(--voxver-primary);
}

.optifine-toggle input:checked + .toggle-slider::after {
  left: 20px;
  background: #fff;
}

.addons-more {
  text-align: center;
  font-size: 11px;
  color: var(--voxver-text-muted);
  margin-top: 10px;
  opacity: 0.6;
}

.fabric-api-icon {
  background: linear-gradient(135deg, #d4b28c, #8b6b4a) !important;
}

.quilt-api-icon {
  background: linear-gradient(135deg, #a0c4ff, #5e60ce) !important;
}

.addon-card--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.fabric-api-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--voxver-text-muted);
  font-size: 12px;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid color-mix(in oklab, var(--voxver-primary) 20%, transparent);
  border-top-color: var(--voxver-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.fabric-api-auto {
  font-size: 11px;
  color: var(--voxver-success);
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 加载器版本选择弹窗 */
.loader-version-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgb(0 0 0 / 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 480px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--voxver-border-color);
}
.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}
.modal-close {
  background: none;
  border: none;
  color: var(--voxver-text-muted);
  cursor: pointer;
  padding: 4px;
}
.modal-close:hover {
  color: var(--voxver-text-primary);
}

.modal-body {
  max-height: 320px;
  overflow-y: auto;
  padding: 12px 0;
}

.versions-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--voxver-text-muted);
}

.versions-list {
  padding: 0 12px;
}

.version-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: var(--voxver-radius-md);
  cursor: pointer;
  transition: background 0.2s;
}
.version-item:hover {
  background: var(--voxver-bg-hover);
}
.version-item.selected {
  background: color-mix(in oklab, var(--voxver-primary) 15%, transparent);
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.version-name {
  font-size: 14px;
  font-weight: 400;
  color: var(--voxver-text-primary);
}
.version-date {
  font-size: 12px;
  color: var(--voxver-text-muted);
}

.version-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: var(--voxver-radius-xs);
  font-weight: 600;
}
.version-badge.recommended {
  background: color-mix(in oklab, var(--voxver-success) 20%, transparent);
  color: var(--voxver-success);
}
.version-badge.latest {
  background: color-mix(in oklab, var(--voxver-primary) 20%, transparent);
  color: var(--voxver-primary);
}

.no-versions {
  padding: 40px 20px;
  text-align: center;
  color: var(--voxver-text-muted);
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--voxver-border-color);
}

.btn-cancel {
  flex: 1;
}
.btn-confirm {
  flex: 2;
}

.vd-footer {
  margin-top: auto;
  padding: 16px 20px 24px;
  border-top: 1px solid var(--voxver-border-color);
}

.target-folder-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.target-folder {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--voxver-text-muted);
}

.btn-browse {
  background: var(--voxver-bg-hover);
  border: 1px solid var(--voxver-border-color-light);
  border-radius: var(--voxver-radius-sm);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--voxver-text-muted);
  transition: all 0.2s;
}
.btn-browse:hover {
  background: var(--voxver-primary-light);
  color: #fff;
}

.selected-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--voxver-primary);
  margin-bottom: 12px;
  padding: 10px 14px;
  background: color-mix(in oklab, var(--voxver-primary) 10%, transparent);
  border-radius: var(--voxver-radius-md);
  border: 1px solid color-mix(in oklab, var(--voxver-primary) 20%, transparent);
}

.selected-label {
  font-size: 11px;
  color: var(--voxver-text-muted);
  font-weight: 500;
}

.selected-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--voxver-text-primary);
  word-break: break-all;
}

.btn-download {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--voxver-gradient-primary);
  color: #fff;
  border: none;
  border-radius: var(--voxver-radius-sm);
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  box-shadow: var(--voxver-shadow-glow-primary);
}
.btn-download:hover:not(:disabled) {
  opacity: 0.9;
}
.btn-download:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spin-icon {
  animation: spin 0.8s linear infinite;
}

.vd-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--voxver-text-muted);
}
</style>

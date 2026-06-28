<template>
  <div class="voxver-app">
    <!-- 深蓝标题栏 + 内嵌标签页 -->
    <header class="titlebar">
      <!-- 品牌 -->
      <span class="brand">VoxVer</span>

      <!-- 标签导航（内嵌标题栏） -->
      <nav class="tab-nav">
        <button
          v-for="tab in tabs"
          :key="tab.path"
          class="tab-pill"
          :class="{ active: currentRoute === tab.path }"
          @click="$router.push(tab.path)"
        >
          <span v-html="tab.svg"></span>
          {{ $t(tab.labelKey) }}
        </button>
      </nav>

      <!-- 窗口控制 -->
      <div class="wc" v-if="isElectron">
        <button class="wc-btn" @click="minimizeWindow">
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect width="10" height="1" fill="currentColor" />
          </svg>
        </button>
        <button class="wc-btn wc-close" @click="closeWindow">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.2" />
          </svg>
        </button>
      </div>
    </header>

    <!-- 主体区域 -->
    <div class="app-body">
      <!-- 左侧边栏（根据当前页面动态渲染不同内容） -->
      <aside class="sidebar">
        <!-- ========== 首页侧栏：账户 + 启动（PCL2 风格）========== -->
        <template v-if="currentRoute === '/'">
          <div class="sb-home">
            <!-- 正版/离线切换 -->
            <div class="auth-switch">
              <button
                class="auth-btn"
                :class="{ active: accountMode === 'online' }"
                @click="accountMode = 'online'"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg
                >{{ $t('home.auth.online') }}
              </button>
              <button
                class="auth-btn"
                :class="{ active: accountMode === 'offline' }"
                @click="accountMode = 'offline'"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M9 17H7a5 5 0 010-10h2" />
                  <path d="M15 7h2a5 5 0 010 10h-2" />
                  <line x1="9" y1="12" x2="15" y2="12" />
                  <line x1="3" y1="3" x2="21" y2="21" /></svg
                >{{ $t('home.auth.offline') }}
              </button>
            </div>

            <!-- ===== 正版模式 ===== -->
            <div v-if="accountMode === 'online'" class="auth-online">
              <!-- 头像 -->
              <div class="avatar-default-icon">
                <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" :alt="userName" />
                <span v-else-if="userName" class="avatar-letter">{{
                  userName[0]?.toUpperCase()
                }}</span>
                <svg
                  v-else
                  width="44"
                  height="44"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>

              <!-- 账号选择 -->
              <div class="login-row">
                <select class="account-select" @change="onAccountSelect($event)">
                  <option value="">{{ $t('home.auth.selectAccount') }}</option>
                  <option
                    v-for="acc in filteredAccounts"
                    :key="acc.id"
                    :value="acc.id"
                    :selected="acc.isActive === 1"
                  >
                    {{ acc.name }} ({{ acc.type === 'microsoft' ? $t('home.auth.microsoft') : $t('home.auth.offline') }})
                  </option>
                  <option value="add">{{ $t('home.auth.addAccount') }}</option>
                </select>
              </div>

              <!-- 外链入口 -->
              <div class="auth-external-links">
                <a
                  class="auth-ext-btn"
                  href="https://www.xbox.com/zh-cn/games/store/minecraft-java-bedrock-edition-for-pc/9nxp44l49shj"
                  target="_blank"
                  rel="noopener"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                  {{ $t('home.auth.buyOfficial') }}
                </a>
                <a
                  class="auth-ext-btn"
                  href="https://www.minecraft.net/zh-hans"
                  target="_blank"
                  rel="noopener"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path
                      d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
                    />
                  </svg>
                  {{ $t('home.auth.goOfficial') }}
                </a>
              </div>
            </div>

            <!-- ===== 离线模式 ===== -->
            <div v-else class="auth-offline">
              <!-- 像素风 Steve 头像 -->
              <div class="avatar-steve">
                <!-- CSS 绘制的像素 Steve 脸 -->
                <svg width="48" height="48" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                  <!-- Steve face - pixel art style -->
                  <rect x="0" y="0" width="16" height="16" rx="2" fill="#C69C6D" />
                  <!-- Hair (orange) -->
                  <rect x="2" y="1" width="12" height="5" fill="#E07A28" />
                  <rect x="3" y="0" width="10" height="2" fill="#E07A28" />
                  <!-- Skin tone -->
                  <rect x="2" y="5" width="12" height="9" fill="#D4A574" />
                  <!-- Eyes (green) -->
                  <rect x="4" y="7" width="2" height="2" fill="#3A8B47" />
                  <rect x="10" y="7" width="2" height="2" fill="#3A8B47" />
                  <!-- Nose -->
                  <rect x="7" y="9" width="2" height="2" fill="#C69C6D" />
                  <!-- Mouth -->
                  <rect x="5" y="12" width="6" height="1" fill="#8B5A3C" />
                  <!-- Eyebrows -->
                  <rect x="3" y="6" width="4" height="1" fill="#B86B18" />
                  <rect x="9" y="6" width="4" height="1" fill="#B86B18" />
                </svg>
              </div>

              <!-- 离线账号选择 -->
              <div class="login-row">
                <select class="account-select" @change="onAccountSelect($event)">
                  <option value="">{{ $t('home.auth.selectAccount') }}</option>
                  <option
                    v-for="acc in offlineAccounts"
                    :key="acc.id"
                    :value="acc.id"
                    :selected="acc.isActive === 1"
                  >
                    {{ acc.name }}
                  </option>
                  <option value="add">{{ $t('home.auth.addOfflineAccount') }}</option>
                </select>
              </div>
            </div>

            <!-- 账户管理 -->
            <button class="btn-account-manage" @click="goToAccountSettings">{{ $t('home.auth.manageAccount') }}</button>

            <!-- 启动区域 -->
            <div class="sb-launch-area">
              <!-- 启动按钮（PCL2 描边风格） -->
              <button
                class="btn-launch-pcl2"
                @click="handleLaunch"
                :disabled="isLaunching || !selectedVersionId"
                :class="{ 'no-version': !selectedVersionId }"
              >
                <span class="launch-label">{{
                  isLaunching ? $t('home.launching') : !selectedVersionId ? $t('home.downloadFirst') : $t('home.launchGame')
                }}</span>
                <span class="launch-version">{{ selectedVersion }}</span>
              </button>

              <!-- 版本操作按钮 -->
              <div class="version-actions" style="margin-bottom: 8px">
                <button class="ver-btn" @click="showVersionSelectModal = true">{{ $t('home.selectVersion') }}</button>
                <button class="ver-btn" @click="showVersionSettings = true">{{ $t('home.versionSettings') }}</button>
              </div>
            </div>

            <!-- 版本下拉列表 -->
            <div class="ver-dropdown" v-if="showVersionSelect && versions.length">
              <div
                v-for="ver in versions"
                :key="ver.id"
                class="ver-opt"
                :class="{ selected: ver.id === selectedVersionId }"
                @click="selectVersion(ver)"
              >
                {{ ver.name }} <span class="ver-loader">{{ ver.loader || $t('home.vanilla') }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- ========== 下载页侧栏：分类导航 ========== -->
        <template v-else-if="currentRoute === '/downloads'">
          <nav class="sb-nav">
            <button
              v-for="cat in dlCategories"
              :key="cat.id"
              class="nav-item"
              :class="{ active: dlActiveCat === cat.id }"
              @click="handleDlCategory(cat.id)"
            >
              <span v-html="cat.icon"></span>
              {{ $t(cat.labelKey) }}
            </button>
            <div class="nav-divider">{{ $t('download.sidebar.community') }}</div>
            <button
              v-for="cat in communityCategories"
              :key="cat.id"
              class="nav-item sub"
              :class="{ active: dlActiveCat === cat.id }"
              @click="handleDlCategory(cat.id)"
            >
              <span v-html="cat.icon"></span>
              {{ $t(cat.labelKey) }}
            </button>
          </nav>
        </template>

        <!-- ========== 设置页侧栏：分类导航（分组结构） ========== -->
        <template v-else-if="currentRoute === '/settings'">
          <nav class="sb-nav">
            <template v-for="group in settingsGroups" :key="group.name">
              <div class="nav-group-header">{{ $t(group.name) }}</div>
              <button
                v-for="item in group.items"
                :key="item.id"
                class="nav-item"
                :class="{ active: settingsActive === (item.category || item.id) }"
                @click="handleSettingsCategory(item.category || item.id)"
              >
                <span v-html="item.icon"></span>
                {{ $t(item.labelKey) }}
              </button>
            </template>
          </nav>
        </template>

        <!-- ========== 实例页侧栏 ========== -->
        <template v-else-if="currentRoute === '/instances'">
          <nav class="sb-nav">
            <button class="nav-item active">
              <span
                ><svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg
              ></span>
              全部实例
            </button>
          </nav>
        </template>

        <!-- ========== 账户页侧栏 ========== -->
        <template v-else-if="currentRoute === '/account'">
          <nav class="sb-nav">
            <button class="nav-item" @click="$router.push('/')">
              <span
                ><svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M15 18l-6-6 6-6" /></svg
              ></span>
              返回首页
            </button>
          </nav>
        </template>

        <!-- ========== 版本详情/下载管理侧栏 ========== -->
        <template v-else-if="currentRoute.startsWith('/download')">
          <nav class="sb-nav">
            <button class="nav-item" @click="$router.push('/downloads')">
              <span
                ><svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M15 18l-6-6 6-6" /></svg
              ></span>
              返回下载页
            </button>
          </nav>
        </template>
        <!-- 侧栏底部版本信息 -->
        <div class="sidebar-version">VoxVer v{{ appVersion }}</div>
      </aside>

      <!-- 主内容区 -->
      <main class="main-content">
        <div class="main-content-bg" :style="bgStyle"></div>
        <div v-if="bgOverlayVisible" class="main-content-overlay" :style="overlayStyle"></div>
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- 版本设置弹窗 -->
    <VersionSettings
      v-model:visible="showVersionSettings"
      :version-name="selectedVersion"
      :game-dir="versionGameDir"
      :instance-id="currentInstanceId"
      @version-deleted="onVersionDeleted"
    />

    <!-- 版本选择弹窗 -->
    <VersionSelect v-model:visible="showVersionSelectModal" @select="onVersionSelect" />

    <!-- 账户管理抽屉 -->
    <AccountManager v-model:visible="showAccountManager" />

    <!-- 全局悬浮下载面板 -->
    <DownloadFloat />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, provide, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VersionSettings from './components/VersionSettings.vue'
import VersionSelect from './components/VersionSelect.vue'
import AccountManager from './components/AccountManager.vue'
import DownloadFloat from './components/DownloadFloat.vue'
import { useVersionsStore, useAccountsStore, useInstancesStore, useDownloadStore, useAppStore } from './stores'

const route = useRoute()
const router = useRouter()
const currentRoute = computed(() => route.path)
const isElectron = ref(false)
const appVersion = ref('0.6.0')
const appStore = useAppStore()
const versionsStore = useVersionsStore()
const accountsStore = useAccountsStore()
const instancesStore = useInstancesStore()
const downloadStore = useDownloadStore()
const minecraftPath = ref('')
const versionGameDir = computed(() => {
  // 1. 如果 selectedVersionId 本身就是完整路径
  if (selectedVersionId.value.includes('\\') || selectedVersionId.value.includes('/')) {
    return selectedVersionId.value
  }
  // 2. 匹配实例数据库
  const matchingInstance = instancesStore.instances.find(
    (i) => i.id === selectedVersionId.value || i.path?.includes(selectedVersionId.value)
  )
  if (matchingInstance?.path) {
    return matchingInstance.path
  }
  // 3. 从 minecraftPath 拼接
  return minecraftPath.value ? `${minecraftPath.value}/versions/${selectedVersionId.value}` : ''
})

// 当前选中版本的 instanceId（通过 path 匹配）
const currentInstanceId = computed(
  () => instancesStore.instances.find((i) => i.path === versionGameDir.value)?.id ?? ''
)

// 背景设置
const bgStyle = computed(() => {
  if (appStore.bgImageMode !== 'custom' || !appStore.bgImagePath) return {}
  const blur = appStore.themeBgBlur > 0 ? `blur(${appStore.themeBgBlur}px)` : ''
  return {
    backgroundImage: `url("${appStore.bgImagePath}")`,
    filter: blur
  }
})
const bgOverlayVisible = computed(() => appStore.bgColorOverlay && appStore.bgImageMode === 'custom' && !!appStore.bgImagePath)
const overlayStyle = computed(() => ({
  backgroundColor: appStore.bgOverlayColor,
  opacity: appStore.bgDimAmount > 0 ? appStore.bgDimAmount / 100 : 0.35
}))

// 版本被删除后刷新
async function onVersionDeleted() {
  await loadLocalInstalledVersions()
  selectedVersionId.value = ''
  selectedVersion.value = '选择版本'
}

// 账户状态 - 从 store 获取
const userName = computed(() => accountsStore.activeAccount?.name || '')
const avatarUrl = ref('')

// 加载玩家皮肤
async function loadSkin() {
  const account = accountsStore.activeAccount
  if (!account?.uuid) {
    avatarUrl.value = ''
    return
  }

  try {
    const result = await window.electronAPI?.account.getSkinDataUrl(account.uuid)
    if (result?.ok && result.data) {
      // 裁剪出头部
      avatarUrl.value = await cropSkinHead(result.data)
    } else {
      avatarUrl.value = ''
    }
  } catch (e) {
    avatarUrl.value = ''
  }
}

/** 从完整皮肤图中裁剪头像区域（8x8 头部像素） */
async function cropSkinHead(skinDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const SIZE = 8
      const canvasSize = 48
      canvas.width = canvasSize
      canvas.height = canvasSize
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      // Minecraft 皮肤脸部在 (8, 8) 位置，8x8 像素
      ctx.drawImage(img, 8, 8, SIZE, SIZE, 0, 0, canvasSize, canvasSize)
      const result = canvas.toDataURL('image/png')
      resolve(result)
    }
    img.onerror = (e) => {
      resolve(skinDataUrl)
    }
    img.src = skinDataUrl
  })
}

// 正版/离线模式切换（初始值，空字符串，后续由 watch 更新）
const accountMode = ref<'online' | 'offline'>('offline')

// 初始化模式
function syncAccountMode() {
  accountMode.value = accountsStore.activeAccount?.type === 'microsoft' ? 'online' : 'offline'
}

// 监听活跃账号变化，自动切换模式 + 加载皮肤
watch(
  () => accountsStore.activeAccount,
  async () => {
    syncAccountMode()
    await loadSkin()
  },
  { immediate: true }
)

// 根据当前模式过滤账号列表
const filteredAccounts = computed(() => {
  if (accountMode.value === 'online') {
    return accountsStore.accounts.filter((a) => a.type === 'microsoft')
  } else {
    return accountsStore.accounts.filter((a) => a.type === 'offline')
  }
})

// 离线账号列表（始终显示）
const offlineAccounts = computed(() => accountsStore.accounts.filter((a) => a.type === 'offline'))

// 离线名称（localStorage 持久化）
const OFFLINE_NAME_KEY = 'voxver_offline_name'
const offlineName = ref(localStorage.getItem(OFFLINE_NAME_KEY) || 'Steve')
const offlineNameInput = ref<HTMLInputElement | null>(null)

// 版本设置弹窗
const showVersionSettings = ref(false)

// 账户管理抽屉
const showAccountManager = ref(false)

// 版本选择弹窗（PCL2 风格）
const showVersionSelectModal = ref(false)

// 标记用户是否已手动选择过版本（用于区分首次加载 vs store版本更新）
const userHasSelectedVersion = ref(false)

// 启动数据
const isLaunching = ref(false)
const showVersionSelect = ref(false)
const selectedVersionId = ref('')
const selectedVersion = ref('选择版本')

interface VersionItem {
  id: string
  name: string
  loader?: string
}

// 本地版本列表（从 Store 获取真实数据）
const versions = ref<VersionItem[]>([])

// 扫描本地 .minecraft/versions 目录获取已安装版本
async function loadLocalInstalledVersions() {
  const instancesStore = useInstancesStore()
  await instancesStore.fetchInstances()

  // 优先：使用实例数据库中的实例（更准确的路径信息）
  if (instancesStore.instances.length) {
    versions.value = instancesStore.instances.map((inst) => {
      const displayName = inst.name || inst.mcVersion || '未知版本'
      return {
        id: inst.path,
        name: displayName,
        loader:
          inst.loaderType !== 'vanilla' && inst.loaderVersion
            ? `${inst.loaderType} ${inst.loaderVersion}`
            : ''
      }
    })
    return
  }

  // 兜底：从文件系统扫描（使用已设置的 minecraftPath）
  if (window.electronAPI?.path && minecraftPath.value) {
    try {
      const result = await window.electronAPI.versions.scanFolder(minecraftPath.value)
      if (result?.ok && result.data?.length) {
        versions.value = result.data.map((v: any) => ({
          id: v.id,
          name: v.baseVersion || v.id,
          loader: v.loaderInfo || ''
        }))
      }
    } catch (e) {}
  }
}

// Store 版本变化时同步到 versions（仅执行一次，避免热重载重复触发）
watch(
  () => versionsStore.versions,
  (storeVersions) => {
    if (storeVersions.length) {
      // 优先用本地已安装版本（已有数据则跳过）
      if (versions.value.length) return

      versions.value = storeVersions.slice(0, 20).map((v) => ({
        id: v.id,
        name: v.name,
        loader: ''
      }))

      // 优先用精确保存的版本名恢复（处理带 loader 的版本）
      const savedDisplayName = localStorage.getItem('voxver_last_version_name')
      const lastId = localStorage.getItem('voxver_last_version')
      if (savedDisplayName && lastId) {
        // 尝试在版本列表中匹配
        const match = versions.value.find((v) => v.id === lastId)
        if (match) {
          selectedVersionId.value = lastId
          selectedVersion.value = `${match.name}${match.loader ? '-' + match.loader : ''}`
          userHasSelectedVersion.value = true
          versionsStore.setCurrentVersion(lastId)
        } else {
          // 保存的版本不在列表中，保持当前选择（不要 fallback）
          userHasSelectedVersion.value = true
        }
      } else if (!userHasSelectedVersion.value && versions.value.length) {
        // 从未选择过版本 + 有版本列表 → 选第一个
        selectVersion(versions.value[0])
      }
    }
  },
  { immediate: true, once: true }
)

// 下载页分类
const dlActiveCat = ref('vanilla')

// 设置页分类
const settingsActive = ref('launch')

provide('settingsActive', settingsActive)
provide('dlActiveCat', dlActiveCat)

onMounted(async () => {
  isElectron.value = !!window.electronAPI

  // 获取应用版本号
  if (window.electronAPI?.app?.getVersion) {
    window.electronAPI.app.getVersion().then((v: string) => {
      if (v) appVersion.value = v
    }).catch(() => {})
  }

  // 初始化主题
  appStore.init()

  // 获取 .minecraft 路径（优先 last_selected_folder，其次自定义路径，最后默认）
  if (window.electronAPI?.path) {
    try {
      const lastFolder = await window.electronAPI.folders?.getLast()
      if (lastFolder) {
        minecraftPath.value = lastFolder
      } else {
        const customPath = await window.electronAPI.path.getCustom()
        if (customPath) {
          minecraftPath.value = customPath
        } else {
          minecraftPath.value = await window.electronAPI.path.getMinecraft()
        }
      }
    } catch (e) {}
  }

  // 加载本地已安装版本（优先于远程版本）
  await loadLocalInstalledVersions()

  // 从 localStorage 恢复已保存的版本（无论数据来源，统一恢复）
  {
    const savedDisplayName = localStorage.getItem('voxver_last_version_name')
    const lastId = localStorage.getItem('voxver_last_version')
    if (savedDisplayName && lastId) {
      // 优先用精确保存的版本名恢复
      const match = versions.value.find((v) => v.id === lastId)
      if (match) {
        selectedVersionId.value = lastId
        selectedVersion.value = `${match.name}${match.loader ? '-' + match.loader : ''}`
        userHasSelectedVersion.value = true
        versionsStore.setCurrentVersion(lastId)
      } else {
        // 保存的版本不在当前列表中，保持 lastId，清空显示名
        selectedVersionId.value = lastId
        selectedVersion.value = savedDisplayName
        userHasSelectedVersion.value = true
      }
    } else if (!userHasSelectedVersion.value && versions.value.length) {
      // 从未选择过版本 → 选第一个
      const target = versions.value[0]
      selectedVersionId.value = target.id
      selectedVersion.value = `${target.name}${target.loader ? '-' + target.loader : ''}`
      localStorage.setItem('voxver_last_version', target.id)
      localStorage.setItem('voxver_last_version_name', selectedVersion.value)
    }
  }

  // 如果没有本地版本，fallback 到远程版本列表
  if (!versions.value.length) {
    versionsStore.fetchVersions()
  }

  // 加载账号列表
  accountsStore.fetchAccounts()

  // 没有找到任何版本时，清除之前的选择并提示用户下载
  if (!versions.value.length) {
    selectedVersionId.value = ''
    selectedVersion.value = '请先下载版本'
    userHasSelectedVersion.value = false
    localStorage.removeItem('voxver_last_version')
    localStorage.removeItem('voxver_last_version_name')
  }

  // 监听版本下载进度事件（始终注册）
  const api = window.electronAPI
  if (api?.versions) {
    api.versions.onDownloadProgress((data) => {
      downloadStore.updateVersionProgress(data)
    })
    api.versions.onDownloadComplete(async (data) => {
      downloadStore.onVersionComplete(data)
      // 下载完成后自动创建实例
      if (api.instance) {
        await api.instance.create({
          name: data.versionId,
          mcVersion: data.versionId,
          loaderType: 'vanilla',
          loaderVersion: ''
        })
      }
    })
    api.versions.onDownloadError((data) => {
      downloadStore.onVersionError(data)
    })
  }
})

const displayName = computed(() => {
  if (accountMode.value === 'online') {
    return userName.value || '未登录'
  }
  return offlineName.value || 'Steve'
})

const avatarLetter = computed(() => {
  const name = accountMode.value === 'offline' ? offlineName.value : displayName.value
  return name ? name[0].toUpperCase() : '?'
})

function selectVersion(ver: VersionItem) {
  selectedVersionId.value = ver.id
  selectedVersion.value = `${ver.name}${ver.loader ? '-' + ver.loader : ''}`
  localStorage.setItem('voxver_last_version', ver.id)
  localStorage.setItem('voxver_last_version_name', selectedVersion.value)
  userHasSelectedVersion.value = true
  versionsStore.setCurrentVersion(ver.id)
  showVersionSelect.value = false
}

// 账号选择处理
async function onAccountSelect(event: Event) {
  const select = event.target as HTMLSelectElement
  const value = select.value

  if (value === 'add') {
    showAccountManager.value = true
    select.value = '' // 重置选择
    return
  }

  if (value && accountsStore.accounts.find((a) => a.id === value)) {
    await accountsStore.setActive(value)
  }
  select.value = accountsStore.activeAccount?.id || ''
}

async function onVersionSelect(version: { id: string; name: string; loader?: string }) {
  // 同步更新 minecraftPath（用户可能切换了 .minecraft 文件夹）
  if (window.electronAPI?.folders) {
    try {
      const lastFolder = await window.electronAPI.folders.getLast()
      if (lastFolder) {
        minecraftPath.value = lastFolder
      }
    } catch (e) {}
  }

  selectedVersionId.value = version.id
  const displayName = `${version.name}${version.loader ? '-' + version.loader : ''}`
  selectedVersion.value = displayName
  localStorage.setItem('voxver_last_version', version.id)
  localStorage.setItem('voxver_last_version_name', displayName)
  userHasSelectedVersion.value = true
  versionsStore.setCurrentVersion(version.id)
}

async function handleLaunch() {
  // 前置检查
  if (!selectedVersionId.value) {
    if (confirm('当前没有可用的游戏版本，是否前往下载页面？')) {
      router.push('/downloads')
    }
    return
  }
  if (!accountsStore.activeAccount) {
    window.electronAPI?.notification?.send({
      title: '提示',
      body: '请先添加并选择一个账号',
      type: 'warning'
    })
    return
  }

  isLaunching.value = true
  const accountId = accountsStore.activeAccount.id
  const versionId =
    selectedVersionId.value.includes('\\') || selectedVersionId.value.includes('/')
      ? selectedVersionId.value.split(/[\\/]/).pop() || selectedVersionId.value // 如果是完整路径，提取文件夹名作为版本ID
      : selectedVersionId.value

  // 监听启动进度
  if (window.electronAPI?.game.onProgress) {
    window.electronAPI.game.onProgress((progress) => {})
  }

  try {
    const result = await window.electronAPI?.game.launch('', accountId, versionId)
    if (!result?.success) {
      window.electronAPI?.notification?.send({
        title: '错误',
        body: '启动失败: ' + (result?.error || '未知错误'),
        type: 'error'
      })
    }
  } catch (e: any) {
    window.electronAPI?.notification?.send({
      title: '错误',
      body: '启动异常: ' + e.message,
      type: 'error'
    })
  } finally {
    isLaunching.value = false
  }
}

function saveOfflineName() {
  const name = offlineName.value.trim()
  if (name) {
    offlineName.value = name
    localStorage.setItem(OFFLINE_NAME_KEY, name)
  } else {
    // 空名称恢复默认
    offlineName.value = 'Steve'
    localStorage.setItem(OFFLINE_NAME_KEY, 'Steve')
  }
}

function handleMicrosoftLogin() {
  router.push('/account')
}

// ====== 标签定义 ======
const tabs = [
  {
    path: '/',
    labelKey: 'tabs.home',
    svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
  },
  {
    path: '/instances',
    labelKey: 'tabs.instances',
    svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>'
  },
  {
    path: '/downloads',
    labelKey: 'tabs.downloads',
    svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>'
  },
  {
    path: '/settings',
    labelKey: 'tabs.settings',
    svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>'
  },
]

// 下载分类
const dlCategories = [
  {
    id: 'vanilla',
    labelKey: 'download.sidebar.vanilla',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>'
  }
]
const communityCategories = [
  {
    id: 'mod',
    labelKey: 'download.sidebar.mod',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>'
  },
  {
    id: 'modpack',
    labelKey: 'download.sidebar.modpack',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/></svg>'
  },
  {
    id: 'datapack',
    labelKey: 'download.sidebar.datapack',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'
  },
  {
    id: 'resourcepack',
    labelKey: 'download.sidebar.resourcepack',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
  },
  {
    id: 'shader',
    labelKey: 'download.sidebar.shader',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
  }
]

// 设置分类（Koring 分组结构）
const settingsGroups = [
  {
    name: 'settings.group.general',
    items: [
      {
        id: 'home',
        labelKey: 'settings.sidebar.home',
        category: 'home',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
      },
      {
        id: 'account',
        labelKey: 'settings.sidebar.account',
        category: 'account',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>'
      },
      {
        id: 'about',
        labelKey: 'settings.sidebar.about',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
      },
      {
        id: 'copyright',
        labelKey: 'settings.sidebar.copyright',
        category: 'copyright',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9a4 4 0 100 6"/></svg>'
      }
    ]
  },
  {
    name: 'settings.group.game',
    items: [
      {
        id: 'game-profile',
        labelKey: 'settings.sidebar.gameProfile',
        category: 'profile',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>'
      },
      {
        id: 'java-memory',
        labelKey: 'settings.sidebar.javaMemory',
        category: 'java-memory',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>'
      },
      {
        id: 'game-dir',
        labelKey: 'settings.sidebar.gameDir',
        category: 'game-dir',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>'
      },
      {
        id: 'advanced',
        labelKey: 'settings.sidebar.advanced',
        category: 'advanced',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>'
      }
    ]
  },
  {
    name: 'settings.group.personalize',
    items: [
      {
        id: 'theme',
        labelKey: 'settings.sidebar.theme',
        category: 'personalize',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
      },
      {
        id: 'interface',
        labelKey: 'settings.sidebar.interface',
        category: 'interface',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>'
      },
      {
        id: 'lang',
        labelKey: 'settings.sidebar.lang',
        category: 'language',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>'
      },
      {
        id: 'accessibility',
        labelKey: 'settings.sidebar.accessibility',
        category: 'accessibility',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>'
      }
    ]
  },
  {
    name: 'settings.group.network',
    items: [
      {
        id: 'download-net',
        labelKey: 'settings.sidebar.downloadNet',
        category: 'download-net',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
      },
      {
        id: 'online',
        labelKey: 'settings.sidebar.online',
        category: 'online',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1"/><polygon points="12 15 17 21 7 21 12 15"/></svg>'
      },
      {
        id: 'auth-service',
        labelKey: 'settings.sidebar.authService',
        category: 'auth-service',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'
      }
    ]
  },
  {
    name: 'settings.group.other',
    items: [
      {
        id: 'service',
        labelKey: 'settings.sidebar.service',
        category: 'service',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>'
      },
      {
        id: 'sponsor',
        labelKey: 'settings.sidebar.sponsor',
        category: 'sponsor',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>'
      },
      {
        id: 'developer',
        labelKey: 'settings.sidebar.developer',
        category: 'developer',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
      }
    ]
  }
]

function minimizeWindow() {
  window.electronAPI?.window?.minimize?.()
}
function closeWindow() {
  window.electronAPI?.window?.close?.()
}

function handleDlCategory(catId: string) {
  dlActiveCat.value = catId
}

function goToAccountSettings() {
  settingsActive.value = 'profile'
  router.push('/settings')
}

function handleSettingsCategory(itemId: string) {
  settingsActive.value = itemId
}
</script>

<style scoped lang="scss">
/* ============================================================
   VoxVer App Layout — Pixel-UI 渐变色设计体系
   基于 pixel-ui.css 的 --voxver-* 变量系统
   用户可通过修改 :root 变量或设置页全局换肤
   ============================================================ */

.voxver-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  font-family: var(--voxver-font-sans);
  background: var(--voxver-bg-secondary);
  color: var(--voxver-text-primary);
}

/* ====== 渐变标题栏 + 内嵌标签页 ====== */
.titlebar {
  height: 44px;
  background: var(--voxver-gradient-primary);
  display: flex;
  align-items: center;
  padding: 0 14px;
  flex-shrink: 0;
  -webkit-user-select: none;
  user-select: none;
  position: relative;
  overflow: hidden;

  /* 标题栏微光装饰 */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 60%);
    pointer-events: none;
  }
}

&.electron .titlebar,
.titlebar {
  -webkit-app-region: drag;
}

.brand {
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 1.5px;
  -webkit-app-region: no-drag;
  pointer-events: auto;
  padding-left: 4px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 1;
}

.tab-nav {
  display: flex;
  align-items: center;
  gap: 3px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  overflow-x: auto;
  -webkit-app-region: no-drag !important;
  pointer-events: auto !important;
  z-index: 100;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tab-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.88);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--voxver-transition-fast);
  white-space: nowrap;
  flex-shrink: 0;
  backdrop-filter: blur(4px);
  line-height: 1;
  -webkit-app-region: no-drag !important;
  pointer-events: auto !important;

  svg,
  span {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    line-height: 1;
  }

  &.active {
    background: #fff;
    color: var(--voxver-primary);
    border-color: #fff;
    font-weight: 650;
    box-shadow:
      0 2px 10px rgba(0, 0, 0, 0.15),
      0 0 18px rgba(99, 102, 234, 0.25);
    text-shadow: none;
  }

  &:hover:not(.active) {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.45);
    color: #fff;
  }
}

/* 窗口控制 */
.wc {
  display: flex;
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  -webkit-app-region: no-drag;
  z-index: 1;

  .wc-btn {
    width: 44px;
    height: 44px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.82);
    transition: all 0.12s;
    &:hover {
      background: rgba(255, 255, 255, 0.12);
    }
    &.wc-close:hover {
      background: var(--voxver-error);
      color: #fff;
    }
  }
}

/* ====== 主体布局 ====== */
.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ====== 左侧边栏 ====== */
.sidebar {
  width: 220px;
  min-width: 200px;
  background: var(--voxver-bg-elevated);
  border-right: 1px solid var(--voxver-border-color);
  flex-shrink: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.09);
    border-radius: 2px;
  }
}

/* ---------- 首页侧栏（渐变风格）---------- */
.sb-home {
  padding: 16px 16px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  overflow: hidden;
}

/* 账户管理按钮 */
.btn-account-manage {
  width: 100%;
  padding: 8px 12px;
  border: 1.5px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  background: var(--voxver-bg-elevated);
  color: var(--voxver-text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--voxver-transition-fast);
  margin: 8px 0;
  text-align: center;

  &:hover {
    border-color: var(--voxver-primary-400);
    color: var(--voxver-primary-400);
  }
}

/* 启动区域：始终贴底 */
.sb-launch-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding: 12px 0 16px;
}

.auth-switch {
  display: flex;
  gap: 6px;
  width: 100%;
  flex-shrink: 0;

  .auth-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 7px 0;
    border: 1.5px solid var(--voxver-border-color);
    background: var(--voxver-bg-elevated);
    border-radius: var(--voxver-radius-md);
    font-size: 12.5px;
    font-weight: 600;
    color: var(--voxver-text-secondary);
    cursor: pointer;
    transition: all var(--voxver-transition-fast);
    white-space: nowrap;
    svg {
      flex-shrink: 0;
    }

    &:hover {
      border-color: var(--voxver-primary);
      color: var(--voxver-primary);
    }
    &.active {
      background: var(--voxver-primary-light);
      border-color: var(--voxver-primary-300);
      color: var(--voxver-primary-700);
      svg {
        color: var(--voxver-primary-600);
      }
    }
  }
}

/* ---- 正版模式 ---- */
.auth-online {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  width: 100%;
  flex: 1;
  text-align: center;
}

.avatar-default-icon {
  width: 72px;
  height: 72px;
  border-radius: 4px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  overflow: hidden;

  svg {
    color: var(--voxver-primary);
    opacity: 0.85;
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 4px;
    image-rendering: pixelated;
  }

  .avatar-letter {
    width: 100%;
    height: 100%;
    border-radius: 4px;
    background: linear-gradient(135deg, #00a4ef, #0078d4);
    color: #fff;
    font-size: 28px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }
}

.login-row {
  display: flex;
  gap: 8px;
  width: 100%;

  .account-select {
    flex: 1;
    padding: 8px 10px;
    border: 1.5px solid var(--voxver-border-color);
    border-radius: var(--voxver-radius-md);
    font-size: 12.5px;
    color: var(--voxver-text-secondary);
    background: var(--voxver-bg-elevated)
      url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23555880' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")
      no-repeat right 8px center;
    outline: none;
    cursor: pointer;
    appearance: none;
    transition: all var(--voxver-transition-fast);

    &:focus {
      border-color: var(--voxver-primary-400);
      box-shadow: var(--voxver-input-focus-shadow);
    }
  }

  .btn-login {
    padding: 8px 18px;
    border: 1.5px solid var(--voxver-primary);
    border-radius: var(--voxver-radius-md);
    background: var(--voxver-gradient-primary);
    color: #fff;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--voxver-transition-fast);
    box-shadow: 0 2px 8px rgba(99, 102, 234, 0.25);

    &:hover {
      filter: brightness(1.08);
      box-shadow: 0 4px 14px rgba(99, 102, 234, 0.35);
      transform: translateY(-1px);
    }
    &:active {
      transform: translateY(0);
    }
  }
}

.auth-external-links {
  display: flex;
  gap: 8px;
  padding: 0 4px;
  margin-top: 8px;
}

.auth-ext-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 10px;
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  font-size: 11px;
  font-weight: 500;
  color: var(--voxver-text-muted);
  text-decoration: none;
  background: var(--voxver-bg-elevated);
  transition: all 0.15s;

  svg {
    flex-shrink: 0;
    opacity: 0.6;
  }

  &:hover {
    border-color: var(--voxver-primary-400);
    color: var(--voxver-primary);
    background: var(--voxver-primary-bg);
    svg {
      opacity: 1;
    }
  }
}

.auth-links {
  display: flex;
  gap: 14px;

  .auth-link {
    font-size: 11.5px;
    color: var(--voxver-text-muted);
    text-decoration: none;
    transition: color 0.12s;

    &:hover {
      color: var(--voxver-primary-500);
    }
  }
}

/* ---- 离线模式 ---- */
.auth-offline {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  width: 100%;
  flex: 1;
  text-align: center;
}

.avatar-steve {
  width: 64px;
  height: 64px;
  border-radius: var(--voxver-radius-lg);
  overflow: hidden;
  box-shadow: var(--voxver-shadow-md);
  margin: 0 auto;
  svg {
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }
}

.offline-input-wrap {
  width: 100%;

  .offline-label {
    display: block;
    font-size: 11.5px;
    font-weight: 500;
    color: var(--voxver-text-muted);
    margin-bottom: 4px;
  }

  .offline-input {
    width: 100%;
    padding: 10px 12px;
    border: 1.5px solid var(--voxver-border-color);
    border-radius: var(--voxver-radius-md);
    font-size: 14px;
    font-weight: 600;
    text-align: left;
    color: var(--voxver-text-primary);
    background: var(--voxver-bg-elevated);
    outline: none;
    transition: all var(--voxver-transition-fast);

    &::placeholder {
      color: var(--voxver-text-muted);
      font-weight: 400;
    }
    &:focus {
      border-color: var(--voxver-primary-400);
      box-shadow: var(--voxver-input-focus-shadow);
    }
  }
}

/* ---- 渐变风格启动按钮 ---- */
.btn-launch-pcl2 {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 0;
  background: var(--voxver-gradient-primary);
  border: none;
  border-radius: var(--voxver-radius-lg);
  cursor: pointer;
  transition: all var(--voxver-transition-normal);
  box-shadow: var(--voxver-shadow-glow-primary);
  position: relative;
  overflow: hidden;

  /* 按钮光泽效果 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
    pointer-events: none;
  }

  &:hover:not(:disabled) {
    filter: brightness(1.06);
    box-shadow: 0 6px 26px rgba(99, 102, 234, 0.45);
    transform: translateY(-1px);

    .launch-label {
      filter: brightness(1.1);
    }
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
    box-shadow: 0 2px 10px rgba(99, 102, 234, 0.3);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  &.no-version {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
    opacity: 0.9;
  }

  .launch-label {
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.5px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }

  .launch-version {
    font-size: 11.5px;
    color: rgba(255, 255, 255, 0.78);
  }
}

.version-actions {
  display: flex;
  gap: 8px;
  width: 100%;

  .ver-btn {
    flex: 1;
    padding: 7px 0;
    background: var(--voxver-bg-elevated);
    border: 1.5px solid var(--voxver-border-color);
    border-radius: var(--voxver-radius-md);
    font-size: 12px;
    color: var(--voxver-text-secondary);
    cursor: pointer;
    transition: all var(--voxver-transition-fast);

    &:hover {
      border-color: var(--voxver-primary-400);
      color: var(--voxver-primary-600);
      background: var(--voxver-primary-light);
    }
  }
}

.ver-dropdown {
  width: 100%;
  background: var(--voxver-bg-elevated);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-lg);
  box-shadow: var(--voxver-shadow-lg);
  overflow: hidden;
  animation: dropIn 0.14s ease-out;
}

@keyframes dropIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ver-opt {
  padding: 9px 14px;
  font-size: 13px;
  color: var(--voxver-text-primary);
  cursor: pointer;
  transition: all 0.1s;

  &:hover {
    background: var(--voxver-primary-light);
  }
  &.selected {
    background: var(--voxver-primary-light);
    color: var(--voxver-primary-700);
    font-weight: 600;
  }
  .ver-loader {
    float: right;
    font-size: 11px;
    color: var(--voxver-text-muted);
  }
}

/* ---------- 通用侧栏导航（下载/设置用）---------- */
.sb-nav {
  padding: 12px 0;
  display: flex;
  flex-direction: column;

  .nav-divider {
    padding: 8px 16px 6px;
    font-size: 11px;
    font-weight: 700;
    color: var(--voxver-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .nav-group-header {
    padding: 10px 18px 4px;
    font-size: 10.5px;
    font-weight: 700;
    color: var(--voxver-text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.7;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 18px;
    border: none;
    background: transparent;
    font-size: 14px;
    font-weight: 500;
    color: var(--voxver-text-secondary);
    cursor: pointer;
    position: relative;
    transition: all var(--voxver-transition-fast);
    text-align: left;

    &.sub {
      padding-left: 22px;
      font-size: 13px;
    }

    > span {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      color: var(--voxver-text-muted);
    }

    &:hover {
      color: var(--voxver-primary-600);
      background: var(--voxver-primary-light);
      > span {
        color: var(--voxver-primary-500);
      }
    }

    &.active {
      color: var(--voxver-primary-700);
      font-weight: 650;
      background: linear-gradient(to right, var(--voxver-primary-50), transparent);

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 4px;
        bottom: 4px;
        width: 3px;
        background: var(--voxver-gradient-primary);
        border-radius: 0 2px 2px 0;
        box-shadow: 0 0 6px rgba(99, 102, 234, 0.35);
      }

      > span {
        color: var(--voxver-primary-600);
      }
    }
  }
}

/* ====== 背景层 ====== */
.main-content {
  position: relative;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--voxver-bg-secondary);
  height: 100%;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.22);
  }
}

.main-content-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 0;
}

.main-content-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.main-content > :not(.main-content-bg):not(.main-content-overlay) {
  position: relative;
  z-index: 2;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--voxver-transition-fast);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ====== 侧栏底部版本信息 ====== */
.sidebar-version {
  margin-top: auto;
  padding: 8px 16px;
  font-size: 11px;
  color: var(--voxver-text-muted);
  text-align: center;
  border-top: 1px solid var(--voxver-border-color);
  background: var(--voxver-bg-elevated);
  user-select: none;
}
</style>

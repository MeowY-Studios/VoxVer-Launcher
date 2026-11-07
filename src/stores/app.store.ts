/**
 * App Store - 全局应用状态
 * 管理主题、语言、侧边栏等全局 UI 状态
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ThemeMode = 'dark' | 'light' | 'auto'
export type ThemeSkin = 'voxver' | 'koring'
export type Language = 'zh-CN' | 'en-US'

export const useAppStore = defineStore('app', () => {
  // * ====== 状态 ======
  const theme = ref<ThemeMode>('dark')
  const skin = ref<ThemeSkin>('voxver')
  const language = ref<Language>('zh-CN')
  const sidebarCollapsed = ref(false)
  const sidebarWidth = ref(220)
  const isElectron = ref(false)

  // * 背景设置
  const bgImageMode = ref<'none' | 'custom'>('none')
  const bgImagePath = ref('')
  const bgColorOverlay = ref(false)
  const bgOverlayColor = ref('#1a1b2e')
  const bgDimAmount = ref(0)
  const themeBgBlur = ref(0)
  const bgParallax = ref(false)

  // * ====== 计算属性 ======
  /** 是否处于 Koring 皮肤（独立排版主题，切换需重启生效） */
  const isKoring = computed(() => skin.value === 'koring')

  const isDark = computed(() => {
    const t = resolveTheme()
    return t === 'dark'
  })

  // * ====== 操作 ======

  /** 解析 auto 主题为实际深浅色 */
  function resolveTheme(): 'dark' | 'light' {
    if (theme.value === 'auto') {
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme.value
  }

  /** 切换主题 */
  function toggleTheme() {
    const resolved = resolveTheme()
    theme.value = resolved === 'dark' ? 'light' : 'dark'
    applyTheme()
  }

  function setTheme(t: ThemeMode) {
    theme.value = t
    applyTheme()
  }

  /** 切换界面排版预设（VoxVer 原版 / Koring），切换后需重启生效 */
  function setSkin(next: ThemeSkin) {
    skin.value = next
    localStorage.setItem('voxver_skin', next)
    applyTheme()
  }

  /** 设置背景模式 */
  function setBgImageMode(mode: 'none' | 'custom') {
    bgImageMode.value = mode
    localStorage.setItem('voxver_bgImageMode', mode)
  }

  function setBgImagePath(path: string) {
    bgImagePath.value = path
    localStorage.setItem('voxver_bgImagePath', path)
  }

  function setBgColorOverlay(v: boolean) {
    bgColorOverlay.value = v
    localStorage.setItem('voxver_bgColorOverlay', String(v))
  }

  function setBgOverlayColor(c: string) {
    bgOverlayColor.value = c
    localStorage.setItem('voxver_bgOverlayColor', c)
  }

  function setBgDimAmount(v: number) {
    bgDimAmount.value = v
    localStorage.setItem('voxver_bgDimAmount', String(v))
  }

  function setThemeBgBlur(v: number) {
    themeBgBlur.value = v
    localStorage.setItem('voxver_themeBgBlur', String(v))
  }

  function setBgParallax(v: boolean) {
    bgParallax.value = v
    localStorage.setItem('voxver_bgParallax', String(v))
  }

  /** 重置所有背景设置为初始状态 */
  function resetBackgroundSettings() {
    bgImageMode.value = 'none'
    bgImagePath.value = ''
    bgColorOverlay.value = false
    bgOverlayColor.value = '#1a1b2e'
    bgDimAmount.value = 0
    themeBgBlur.value = 0
    bgParallax.value = false
    localStorage.removeItem('voxver_bgImageMode')
    localStorage.removeItem('voxver_bgImagePath')
    localStorage.removeItem('voxver_bgColorOverlay')
    localStorage.removeItem('voxver_bgOverlayColor')
    localStorage.removeItem('voxver_bgDimAmount')
    localStorage.removeItem('voxver_themeBgBlur')
    localStorage.removeItem('voxver_bgParallax')
  }

  /** 应用主题到 DOM */
  function applyTheme() {
    const resolved = resolveTheme()
    document.documentElement.setAttribute('data-theme', resolved)
    // * 排版预设：Koring 皮肤时打上 data-skin，用于切换整套排版样式
    if (skin.value === 'koring') {
      document.documentElement.setAttribute('data-skin', 'koring')
    } else {
      document.documentElement.removeAttribute('data-skin')
    }
    // * 持久化（保存用户选择，包括 auto）
    localStorage.setItem('voxver_theme', theme.value)
  }

  /** 初始化（从 localStorage 恢复） */
  function init() {
    isElectron.value = !!window.electronAPI
    const saved = localStorage.getItem('voxver_theme') as ThemeMode | null
    if (saved === 'dark' || saved === 'light' || saved === 'auto') {
      theme.value = saved
    }
    // * 兼容旧版本：历史上 'koring' 曾存在主题模式里，这里迁移成排版预设
    if (localStorage.getItem('voxver_theme') === 'koring') {
      localStorage.setItem('voxver_theme', 'dark')
      localStorage.setItem('voxver_skin', 'koring')
      theme.value = 'dark'
      skin.value = 'koring'
    }
    const savedSkin = localStorage.getItem('voxver_skin') as ThemeSkin | null
    if (savedSkin === 'voxver' || savedSkin === 'koring') {
      skin.value = savedSkin
    }
    applyTheme()

    // * 恢复背景设置
    const savedBgMode = localStorage.getItem('voxver_bgImageMode')
    if (savedBgMode === 'none' || savedBgMode === 'custom') bgImageMode.value = savedBgMode
    const savedBgPath = localStorage.getItem('voxver_bgImagePath')
    if (savedBgPath) bgImagePath.value = savedBgPath
    const savedOverlay = localStorage.getItem('voxver_bgColorOverlay')
    if (savedOverlay !== null) bgColorOverlay.value = savedOverlay === 'true'
    const savedOverlayColor = localStorage.getItem('voxver_bgOverlayColor')
    if (savedOverlayColor) bgOverlayColor.value = savedOverlayColor
    const savedDim = localStorage.getItem('voxver_bgDimAmount')
    if (savedDim !== null) bgDimAmount.value = Number(savedDim)
    const savedBlur = localStorage.getItem('voxver_themeBgBlur')
    if (savedBlur !== null) themeBgBlur.value = Number(savedBlur)
    const savedParallax = localStorage.getItem('voxver_bgParallax')
    if (savedParallax !== null) bgParallax.value = savedParallax === 'true'

    // * 监听系统主题变化（auto 模式下自动跟随）
    if (window.matchMedia) {
      const mql = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => {
        if (theme.value === 'auto') applyTheme()
      }
      mql.addEventListener?.('change', handler)
    }
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    theme,
    skin,
    isKoring,
    language,
    sidebarCollapsed,
    sidebarWidth,
    isElectron,
    bgImageMode,
    bgImagePath,
    bgColorOverlay,
    bgOverlayColor,
    bgDimAmount,
    themeBgBlur,
    bgParallax,
    isDark,
    resolveTheme,
    toggleTheme,
    setTheme,
    setSkin,
    setBgImageMode,
    setBgImagePath,
    setBgColorOverlay,
    setBgOverlayColor,
    setBgDimAmount,
    setThemeBgBlur,
    setBgParallax,
    resetBackgroundSettings,
    init,
    toggleSidebar
  }
})

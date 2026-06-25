/**
 * App Store - 全局应用状态
 * 管理主题、语言、侧边栏等全局 UI 状态
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ThemeMode = 'dark' | 'light'
export type Language = 'zh-CN' | 'en-US'

export const useAppStore = defineStore('app', () => {
  // ====== 状态 ======
  const theme = ref<ThemeMode>('dark')
  const language = ref<Language>('zh-CN')
  const sidebarCollapsed = ref(false)
  const sidebarWidth = ref(220)
  const isElectron = ref(false)

  // 背景设置
  const bgImageMode = ref<'none' | 'custom'>('none')
  const bgImagePath = ref('')
  const bgColorOverlay = ref(false)
  const bgOverlayColor = ref('#1a1b2e')
  const bgDimAmount = ref(0)
  const themeBgBlur = ref(0)

  // ====== 计算属性 ======
  const isDark = computed(() => theme.value === 'dark')

  // ====== 操作 ======

  /** 切换主题 */
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    applyTheme()
  }

  function setTheme(t: ThemeMode) {
    theme.value = t
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

  /** 应用主题到 DOM */
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', theme.value)
    // 持久化
    localStorage.setItem('voxver_theme', theme.value)
  }

  /** 初始化（从 localStorage 恢复） */
  function init() {
    isElectron.value = !!window.electronAPI
    const saved = localStorage.getItem('voxver_theme') as ThemeMode | null
    if (saved) {
      theme.value = saved
      applyTheme()
    }
    applyTheme()

    // 恢复背景设置
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
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    theme,
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
    isDark,
    toggleTheme,
    setTheme,
    setBgImageMode,
    setBgImagePath,
    setBgColorOverlay,
    setBgOverlayColor,
    setBgDimAmount,
    setThemeBgBlur,
    init,
    toggleSidebar
  }
})

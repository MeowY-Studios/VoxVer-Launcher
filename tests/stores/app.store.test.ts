/**
 * App Store 测试 - 全局应用状态
 * 覆盖：主题管理、侧边栏、背景设置、初始化、auto 模式
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '../../src/stores/app.store'

function freshStore() {
  localStorage.clear()
  setActivePinia(createPinia())
  return useAppStore()
}

describe('app store - 默认值', () => {
  it('应使用默认主题 dark', () => {
    const store = freshStore()
    expect(store.theme).toBe('dark')
  })

  it('应使用默认语言 zh-CN', () => {
    const store = freshStore()
    expect(store.language).toBe('zh-CN')
  })

  it('侧边栏默认展开', () => {
    const store = freshStore()
    expect(store.sidebarCollapsed).toBe(false)
    expect(store.sidebarWidth).toBe(220)
  })

  it('初始不为 Electron 环境', () => {
    const store = freshStore()
    expect(store.isElectron).toBe(false)
  })

  it('背景设置应有默认值', () => {
    const store = freshStore()
    expect(store.bgImageMode).toBe('none')
    expect(store.bgImagePath).toBe('')
    expect(store.bgColorOverlay).toBe(false)
    expect(store.bgOverlayColor).toBe('#1a1b2e')
    expect(store.bgDimAmount).toBe(0)
    expect(store.themeBgBlur).toBe(0)
    expect(store.bgParallax).toBe(false)
  })
})

describe('app store - 主题操作', () => {
  it('toggleTheme 应切换 dark/light', () => {
    const store = freshStore()
    expect(store.theme).toBe('dark')
    store.toggleTheme()
    expect(store.theme).toBe('light')
    store.toggleTheme()
    expect(store.theme).toBe('dark')
  })

  it('toggleTheme 从 light 切换为 dark', () => {
    const store = freshStore()
    store.setTheme('light')
    store.toggleTheme()
    expect(store.theme).toBe('dark')
  })

  it('setTheme 应正确设置并持久化', () => {
    const store = freshStore()
    store.setTheme('light')
    expect(store.theme).toBe('light')
    expect(localStorage.getItem('voxver_theme')).toBe('light')
  })

  it('setTheme 应更新 document data-theme', () => {
    const store = freshStore()
    store.setTheme('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('isDark 计算属性应在 dark 时为 true', () => {
    const store = freshStore()
    expect(store.isDark).toBe(true)
    store.setTheme('light')
    expect(store.isDark).toBe(false)
  })

  it('resolveTheme 应正确解析 auto 模式', () => {
    const store = freshStore()
    store.theme = 'auto'
    const result = store.resolveTheme()
    expect(['dark', 'light']).toContain(result)
  })

  it('toggleTheme 从 auto 解析后应切换到对立主题', () => {
    const store = freshStore()
    store.theme = 'auto'
    const resolved = store.resolveTheme()
    store.toggleTheme()
    expect(store.theme).toBe(resolved === 'dark' ? 'light' : 'dark')
  })
})

describe('app store - 侧边栏', () => {
  it('toggleSidebar 应切换折叠状态', () => {
    const store = freshStore()
    expect(store.sidebarCollapsed).toBe(false)
    store.toggleSidebar()
    expect(store.sidebarCollapsed).toBe(true)
    store.toggleSidebar()
    expect(store.sidebarCollapsed).toBe(false)
  })
})

describe('app store - 背景设置', () => {
  it('setBgImageMode 应更新并持久化', () => {
    const store = freshStore()
    store.setBgImageMode('custom')
    expect(store.bgImageMode).toBe('custom')
    expect(localStorage.getItem('voxver_bgImageMode')).toBe('custom')
  })

  it('setBgImagePath 应更新并持久化', () => {
    const store = freshStore()
    store.setBgImagePath('/path/to/bg.png')
    expect(store.bgImagePath).toBe('/path/to/bg.png')
    expect(localStorage.getItem('voxver_bgImagePath')).toBe('/path/to/bg.png')
  })

  it('setBgColorOverlay 应更新并持久化布尔值', () => {
    const store = freshStore()
    store.setBgColorOverlay(true)
    expect(store.bgColorOverlay).toBe(true)
    expect(localStorage.getItem('voxver_bgColorOverlay')).toBe('true')
  })

  it('setBgOverlayColor 应更新并持久化颜色', () => {
    const store = freshStore()
    store.setBgOverlayColor('#ff0000')
    expect(store.bgOverlayColor).toBe('#ff0000')
    expect(localStorage.getItem('voxver_bgOverlayColor')).toBe('#ff0000')
  })

  it('setBgDimAmount 应更新并持久化', () => {
    const store = freshStore()
    store.setBgDimAmount(50)
    expect(store.bgDimAmount).toBe(50)
    expect(localStorage.getItem('voxver_bgDimAmount')).toBe('50')
  })

  it('setThemeBgBlur 应更新并持久化', () => {
    const store = freshStore()
    store.setThemeBgBlur(10)
    expect(store.themeBgBlur).toBe(10)
    expect(localStorage.getItem('voxver_themeBgBlur')).toBe('10')
  })

  it('setBgParallax 应更新并持久化', () => {
    const store = freshStore()
    store.setBgParallax(true)
    expect(store.bgParallax).toBe(true)
    expect(localStorage.getItem('voxver_bgParallax')).toBe('true')
  })

  it('resetBackgroundSettings 应重置所有背景设置为默认', () => {
    const store = freshStore()
    store.setBgImageMode('custom')
    store.setBgImagePath('/test.png')
    store.setBgColorOverlay(true)
    store.setBgOverlayColor('#ff0000')
    store.setBgDimAmount(50)
    store.setThemeBgBlur(10)
    store.setBgParallax(true)

    store.resetBackgroundSettings()

    expect(store.bgImageMode).toBe('none')
    expect(store.bgImagePath).toBe('')
    expect(store.bgColorOverlay).toBe(false)
    expect(store.bgOverlayColor).toBe('#1a1b2e')
    expect(store.bgDimAmount).toBe(0)
    expect(store.themeBgBlur).toBe(0)
    expect(store.bgParallax).toBe(false)
  })
})

describe('app store - 初始化', () => {
  it('init 应在 Electron 环境中设置 isElectron 为 true', () => {
    const store = freshStore()
    store.init()
    expect(store.isElectron).toBe(true)
  })

  it('init 应从 localStorage 恢复主题', () => {
    const store = freshStore()
    // 在 freshStore 后设置（因 freshStore 会 clear）
    localStorage.setItem('voxver_theme', 'light')
    store.init()
    expect(store.theme).toBe('light')
  })

  it('init 应迁移废弃的 koring 主题为 dark', () => {
    const store = freshStore()
    localStorage.setItem('voxver_theme', 'koring')
    store.init()
    expect(store.theme).toBe('dark')
    expect(localStorage.getItem('voxver_theme')).toBe('dark')
  })

  it('init 应从 localStorage 恢复所有背景设置', () => {
    const store = freshStore()
    localStorage.setItem('voxver_bgImageMode', 'custom')
    localStorage.setItem('voxver_bgImagePath', '/bg.png')
    localStorage.setItem('voxver_bgColorOverlay', 'true')
    localStorage.setItem('voxver_bgOverlayColor', '#abcdef')
    localStorage.setItem('voxver_bgDimAmount', '30')
    localStorage.setItem('voxver_themeBgBlur', '5')
    localStorage.setItem('voxver_bgParallax', 'true')

    store.init()

    expect(store.bgImageMode).toBe('custom')
    expect(store.bgImagePath).toBe('/bg.png')
    expect(store.bgColorOverlay).toBe(true)
    expect(store.bgOverlayColor).toBe('#abcdef')
    expect(store.bgDimAmount).toBe(30)
    expect(store.themeBgBlur).toBe(5)
    expect(store.bgParallax).toBe(true)
  })

  it('init 无保存值时使用默认值', () => {
    const store = freshStore()
    store.init()
    expect(store.bgImageMode).toBe('none')
  })
})

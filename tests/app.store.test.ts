import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '../src/stores/app.store'

describe('app store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should initialize with default values', () => {
    const store = useAppStore()

    expect(store.theme).toBe('dark')
    expect(store.language).toBe('zh-CN')
    expect(store.sidebarCollapsed).toBe(false)
    expect(store.sidebarWidth).toBe(220)
    expect(store.isElectron).toBe(false)
  })

  it('should have isDark computed property', () => {
    const store = useAppStore()
    expect(store.isDark).toBe(true)

    store.setTheme('light')
    expect(store.isDark).toBe(false)
  })

  it('should toggle theme correctly', () => {
    const store = useAppStore()

    expect(store.theme).toBe('dark')
    store.toggleTheme()
    expect(store.theme).toBe('light')
    store.toggleTheme()
    expect(store.theme).toBe('dark')
  })

  it('should set theme correctly', () => {
    const store = useAppStore()

    store.setTheme('light')
    expect(store.theme).toBe('light')

    store.setTheme('dark')
    expect(store.theme).toBe('dark')
  })

  it('should apply theme to document', () => {
    const store = useAppStore()

    store.setTheme('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    store.setTheme('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('should save theme to localStorage', () => {
    const store = useAppStore()

    store.setTheme('light')
    expect(localStorage.getItem('voxver_theme')).toBe('light')

    store.setTheme('dark')
    expect(localStorage.getItem('voxver_theme')).toBe('dark')
  })

  it('should toggle sidebar correctly', () => {
    const store = useAppStore()

    expect(store.sidebarCollapsed).toBe(false)
    store.toggleSidebar()
    expect(store.sidebarCollapsed).toBe(true)
    store.toggleSidebar()
    expect(store.sidebarCollapsed).toBe(false)
  })

  it('should init from localStorage', () => {
    localStorage.setItem('voxver_theme', 'light')
    const store = useAppStore()

    store.init()
    expect(store.theme).toBe('light')
  })

  it('should detect electron environment', () => {
    const store = useAppStore()
    expect(store.isElectron).toBe(false)

    store.init()
    expect(store.isElectron).toBe(true) // window.electronAPI is mocked in setup.ts
  })
})

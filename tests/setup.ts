/**
 * 测试环境全局配置
 * Mock electronAPI / localStorage / matchMedia
 */
import { vi } from 'vitest'

// ====== Mock electronAPI ======
Object.defineProperty(window, 'electronAPI', {
  value: {
    config: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(true),
      getSecure: vi.fn().mockResolvedValue(null),
      setSecure: vi.fn().mockResolvedValue(true)
    },
    notification: {
      send: vi.fn().mockResolvedValue(true),
      getHistory: vi.fn().mockResolvedValue([]),
      getUnreadCount: vi.fn().mockResolvedValue(0)
    },
    account: {
      list: vi.fn().mockResolvedValue([]),
      setActive: vi.fn().mockResolvedValue(true),
      loginMicrosoft: vi.fn().mockResolvedValue({ ok: true }),
      loginOffline: vi.fn().mockResolvedValue({ ok: true }),
      delete: vi.fn().mockResolvedValue(true)
    },
    versions: {
      list: vi.fn().mockResolvedValue([]),
      scanFolder: vi.fn().mockResolvedValue({ ok: true, data: [] }),
      downloadStart: vi.fn().mockResolvedValue({ ok: true }),
      downloadServer: vi.fn().mockResolvedValue(true)
    },
    instance: {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue(true),
      delete: vi.fn().mockResolvedValue(true)
    },
    path: {
      getMinecraft: vi
        .fn()
        .mockResolvedValue('C:\\Users\\Test\\AppData\\Roaming\\.minecraft'),
      getCustom: vi.fn().mockResolvedValue(null)
    },
    folders: {
      getLast: vi.fn().mockResolvedValue(null),
      list: vi.fn().mockResolvedValue([])
    },
    game: {
      launch: vi.fn().mockResolvedValue({ success: true }),
      isRunning: vi.fn().mockResolvedValue(false),
      confirmDownloadAndLaunch: vi.fn().mockResolvedValue({ success: true })
    },
    window: {
      minimize: vi.fn().mockResolvedValue(true),
      close: vi.fn().mockResolvedValue(true),
      isMaximized: vi.fn().mockResolvedValue(false)
    },
    download: {
      getActive: vi.fn().mockResolvedValue({ data: [] }),
      getQueue: vi.fn().mockResolvedValue({ data: [] }),
      cancelDownload: vi.fn().mockResolvedValue(true),
      searchMods: vi.fn().mockResolvedValue({ data: [] })
    },
    mod: {
      list: vi.fn().mockResolvedValue({ ok: true, data: [] }),
      enable: vi.fn().mockResolvedValue(true),
      disable: vi.fn().mockResolvedValue(true),
      uninstall: vi.fn().mockResolvedValue(true)
    },
    modloader: {
      getLoaders: vi.fn().mockResolvedValue({ fabric: [], forge: [] })
    }
  },
  writable: true
})

// ====== Mock localStorage ======
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null)
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// ====== Mock matchMedia ======
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })),
  writable: true
})

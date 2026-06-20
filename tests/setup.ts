import { vi } from 'vitest'

// Mock window.electronAPI for tests
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
      setActive: vi.fn().mockResolvedValue(true)
    },
    versions: {
      list: vi.fn().mockResolvedValue([]),
      scanFolder: vi.fn().mockResolvedValue({ ok: true, data: [] })
    },
    instance: {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ ok: true })
    },
    path: {
      getMinecraft: vi.fn().mockResolvedValue('C:\\Users\\Test\\AppData\\Roaming\\.minecraft'),
      getCustom: vi.fn().mockResolvedValue(null)
    },
    folders: {
      getLast: vi.fn().mockResolvedValue(null),
      list: vi.fn().mockResolvedValue([])
    },
    game: {
      launch: vi.fn().mockResolvedValue({ success: true }),
      isRunning: vi.fn().mockResolvedValue(false)
    },
    window: {
      minimize: vi.fn().mockResolvedValue(true),
      close: vi.fn().mockResolvedValue(true),
      isMaximized: vi.fn().mockResolvedValue(false)
    }
  },
  writable: true
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

/**
 * Versions Store 测试 - Minecraft 版本管理
 * 覆盖：默认值、计算属性、双层缓存、fetch、ModLoader 版本
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useVersionsStore } from '../../src/stores/versions.store'

function freshStore() {
  localStorage.clear()
  setActivePinia(createPinia())
  return useVersionsStore()
}

function mockRawVersion(overrides: Record<string, any> = {}) {
  return {
    id: '1.20.1',
    type: 'release',
    releaseTime: '2023-06-07T10:00:00Z',
    url: 'https://example.com/1.20.1.json',
    ...overrides
  }
}

describe('versions store - 默认值', () => {
  it('应初始化为空版本列表', () => {
    const store = freshStore()
    expect(store.versions).toEqual([])
    expect(store.currentVersionId).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('应初始化 ModLoader 版本为空', () => {
    const store = freshStore()
    expect(store.fabricVersions).toEqual([])
    expect(store.forgeVersions).toEqual([])
  })
})

describe('versions store - 计算属性', () => {
  it('latestRelease 应返回第一个正式版', () => {
    const store = freshStore()
    store.versions = [
      { id: '1.20.1', name: '1.20.1', type: 'release', releaseTime: '2023-06-07T00:00:00Z' },
      { id: '24w01a', name: '24w01a', type: 'snapshot', releaseTime: '2024-01-01T00:00:00Z' }
    ]
    expect(store.latestRelease?.id).toBe('1.20.1')
  })

  it('latestRelease 无正式版时返回 undefined', () => {
    const store = freshStore()
    store.versions = [
      { id: '24w01a', name: '24w01a', type: 'snapshot', releaseTime: '2024-01-01T00:00:00Z' }
    ]
    expect(store.latestRelease).toBeUndefined()
  })

  it('versionOptions 应映射为选择列表', () => {
    const store = freshStore()
    store.versions = [
      { id: '1.20.1', name: '1.20.1', type: 'release', releaseTime: '2023-06-07T00:00:00Z' },
      { id: '1.20', name: '1.20', type: 'release', releaseTime: '2023-06-01T00:00:00Z' }
    ]
    expect(store.versionOptions).toHaveLength(2)
    expect(store.versionOptions[0]).toEqual({ value: '1.20.1', label: '1.20.1', type: 'release' })
  })

  it('releaseVersions 应仅返回正式版', () => {
    const store = freshStore()
    store.versions = [
      { id: '1.20.1', name: '1.20.1', type: 'release', releaseTime: '' },
      { id: 'snap1', name: 'snap1', type: 'snapshot', releaseTime: '' },
      { id: 'old1', name: 'old1', type: 'old_alpha', releaseTime: '' }
    ]
    expect(store.releaseVersions).toHaveLength(1)
    expect(store.releaseVersions[0].id).toBe('1.20.1')
  })
})

describe('versions store - fetchVersions', () => {
  it('应从 IPC 获取并映射版本列表', async () => {
    vi.mocked(window.electronAPI.versions.list).mockResolvedValueOnce([
      mockRawVersion({ id: '1.20.1', type: 'release' }),
      mockRawVersion({ id: '1.19.4', type: 'release' })
    ])

    const store = freshStore()
    const result = await store.fetchVersions()

    expect(result).toHaveLength(2)
    expect(store.versions).toHaveLength(2)
    expect(store.versions[0].id).toBe('1.20.1')
    expect(store.versions[0].type).toBe('release')
    expect(store.loading).toBe(false)
  })

  it('应写入 localStorage 缓存', async () => {
    vi.mocked(window.electronAPI.versions.list).mockResolvedValueOnce([
      mockRawVersion({ id: '1.20.1' })
    ])

    const store = freshStore()
    await store.fetchVersions()

    const cached = JSON.parse(localStorage.getItem('voxver_versions_cache')!)
    expect(cached.data).toHaveLength(1)
    expect(cached.data[0].id).toBe('1.20.1')
    expect(cached.timestamp).toBeGreaterThan(0)
  })

  it('应从 localStorage 缓存恢复（未过期时）', async () => {
    vi.clearAllMocks()
    const store = freshStore()
    const cached = {
      data: [
        { id: '1.20.1', name: '1.20.1', type: 'release', releaseTime: '' }
      ],
      timestamp: Date.now()
    }
    localStorage.setItem('voxver_versions_cache', JSON.stringify(cached))

    const result = await store.fetchVersions()

    expect(result).toHaveLength(1)
    expect(store.versions[0].id).toBe('1.20.1')
    expect(store.loading).toBe(false)
    expect(window.electronAPI.versions.list).not.toHaveBeenCalled()
  })

  it('缓存过期时应重新请求 IPC', async () => {
    const store = freshStore()
    const cached = {
      data: [{ id: '1.20.1', name: '1.20.1', type: 'release', releaseTime: '' }],
      timestamp: Date.now() - 20 * 60 * 1000 // 20 分钟前
    }
    localStorage.setItem('voxver_versions_cache', JSON.stringify(cached))
    vi.mocked(window.electronAPI.versions.list).mockResolvedValueOnce([
      mockRawVersion({ id: '1.21' })
    ])

    await store.fetchVersions()

    expect(store.versions[0].id).toBe('1.21')
  })

  it('forceRefresh 应跳过缓存直接请求 IPC', async () => {
    const store = freshStore()
    const cached = {
      data: [{ id: '1.20.1', name: '1.20.1', type: 'release', releaseTime: '' }],
      timestamp: Date.now()
    }
    localStorage.setItem('voxver_versions_cache', JSON.stringify(cached))
    vi.mocked(window.electronAPI.versions.list).mockResolvedValueOnce([
      mockRawVersion({ id: '1.21' })
    ])

    await store.fetchVersions(true)

    expect(store.versions[0].id).toBe('1.21')
  })

  it('IPC 失败时应设置 error', async () => {
    vi.mocked(window.electronAPI.versions.list).mockRejectedValueOnce(new Error('Network'))
    const store = freshStore()
    const result = await store.fetchVersions()
    expect(result).toEqual([])
    expect(store.error).toBe('Network')
    expect(store.loading).toBe(false)
  })
})

describe('versions store - fetchModLoaderVersions', () => {
  it('应获取并映射 Fabric 和 Forge 版本', async () => {
    vi.mocked(window.electronAPI.modloader.getLoaders).mockResolvedValueOnce({
      fabric: [
        { id: 'f-1', version: '0.15.0', stable: true },
        { id: 'f-2', version: '0.14.0', stable: false }
      ],
      forge: [{ id: 'fg-1', version: '47.1.0', stable: true }]
    } as any)

    const store = freshStore()
    await store.fetchModLoaderVersions('1.20.1')

    expect(store.fabricVersions).toHaveLength(2)
    expect(store.fabricVersions[0].version).toBe('0.15.0')
    expect(store.fabricVersions[0].stable).toBe(true)
    expect(store.fabricVersions[1].stable).toBe(false)

    expect(store.forgeVersions).toHaveLength(1)
    expect(store.forgeVersions[0].version).toBe('47.1.0')
  })

  it('无 getLoaders 方法时应静默处理', async () => {
    // 如果 modloader.getLoaders 不存在，不会崩溃
    const store = freshStore()
    await store.fetchModLoaderVersions('1.20.1')
    expect(store.loading).toBe(false)
  })
})

describe('versions store - getVersionById', () => {
  it('应返回匹配的版本', () => {
    const store = freshStore()
    store.versions = [
      { id: '1.20.1', name: '1.20.1', type: 'release', releaseTime: '' },
      { id: '1.19.4', name: '1.19.4', type: 'release', releaseTime: '' }
    ]
    expect(store.getVersionById('1.19.4')?.id).toBe('1.19.4')
  })

  it('不存在时返回 undefined', () => {
    const store = freshStore()
    expect(store.getVersionById('nonexistent')).toBeUndefined()
  })
})

describe('versions store - clearCache', () => {
  it('应清除版本列表和 localStorage 缓存', () => {
    const store = freshStore()
    store.versions = [
      { id: '1.20.1', name: '1.20.1', type: 'release', releaseTime: '' }
    ]
    localStorage.setItem('voxver_versions_cache', JSON.stringify({ data: [], timestamp: 1 }))

    store.clearCache()

    expect(store.versions).toEqual([])
    expect(localStorage.getItem('voxver_versions_cache')).toBeNull()
  })
})

describe('versions store - setCurrentVersion', () => {
  it('应设置当前版本 ID', () => {
    const store = freshStore()
    store.setCurrentVersion('1.20.1')
    expect(store.currentVersionId).toBe('1.20.1')
  })

  it('应清除当前版本', () => {
    const store = freshStore()
    store.setCurrentVersion('1.20.1')
    store.setCurrentVersion(null)
    expect(store.currentVersionId).toBeNull()
  })
})

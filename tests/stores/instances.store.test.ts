/**
 * Instances Store 测试 - 游戏实例管理
 * 覆盖：默认值、计算属性、CRUD、收藏、选择、映射
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useInstancesStore } from '../../src/stores/instances.store'
import type { GameInstance } from '../../src/types/instance'

function freshStore() {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  return useInstancesStore()
}

function mockRawInstance(overrides: Record<string, any> = {}) {
  return {
    id: '1',
    name: 'Test Instance',
    path: '/test/path',
    mc_version: '1.20.1',
    loader_type: 'fabric',
    loader_version: '0.15.0',
    icon: '',
    java_path: '',
    jvm_args: '',
    min_memory: 1024,
    max_memory: 4096,
    width: 854,
    height: 480,
    fullscreen: 0,
    is_favorited: 0,
    last_played: null,
    play_time: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  }
}

function mockInstance(overrides: Partial<GameInstance> = {}): GameInstance {
  return {
    id: '1',
    name: 'Test',
    path: '/test',
    mcVersion: '1.20.1',
    loaderType: 'fabric',
    loaderVersion: '',
    icon: '',
    javaPath: '',
    jvmArgs: '',
    minMemory: 1024,
    maxMemory: 4096,
    width: 854,
    height: 480,
    fullscreen: 0,
    isFavorited: 0,
    lastPlayed: null,
    playTime: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides
  }
}

describe('instances store - 默认值', () => {
  it('应初始化为空实例列表', () => {
    const store = freshStore()
    expect(store.instances).toEqual([])
    expect(store.currentInstanceId).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })
})

describe('instances store - 计算属性', () => {
  it('currentInstance 应返回选中实例', () => {
    const store = freshStore()
    store.instances = [mockInstance({ id: 'a' }), mockInstance({ id: 'b' })]
    store.selectInstance('b')
    expect(store.currentInstance?.id).toBe('b')
  })

  it('currentInstance 不存在时返回 null', () => {
    const store = freshStore()
    expect(store.currentInstance).toBeNull()
  })

  it('recentInstances 应按 lastPlayed 倒序最多 5 个', () => {
    const store = freshStore()
    const now = new Date()
    store.instances = Array.from({ length: 10 }, (_, i) =>
      mockInstance({
        id: String(i),
        lastPlayed: new Date(now.getTime() - 86400000 * i).toISOString()
      })
    )
    const recents = store.recentInstances
    expect(recents).toHaveLength(5)
    expect(recents[0].id).toBe('0')
  })

  it('recentInstances 应排除无 lastPlayed 的实例', () => {
    const store = freshStore()
    store.instances = [
      mockInstance({ id: '1', lastPlayed: '2024-01-01T00:00:00Z' }),
      mockInstance({ id: '2', lastPlayed: null })
    ]
    expect(store.recentInstances).toHaveLength(1)
    expect(store.recentInstances[0].id).toBe('1')
  })

  it('favoritedInstances 应仅返回收藏实例', () => {
    const store = freshStore()
    store.instances = [
      mockInstance({ id: '1', isFavorited: 1 }),
      mockInstance({ id: '2', isFavorited: 0 })
    ]
    expect(store.favoritedInstances).toHaveLength(1)
    expect(store.favoritedInstances[0].id).toBe('1')
  })
})

describe('instances store - fetchInstances', () => {
  it('应正确映射 snake_case 数据为 camelCase', async () => {
    vi.mocked(window.electronAPI.instance.list).mockResolvedValueOnce([
      mockRawInstance({ id: '1', name: 'Mapped', mc_version: '1.21', loader_type: 'neoforge' })
    ])

    const store = freshStore()
    await store.fetchInstances()

    expect(store.instances).toHaveLength(1)
    expect(store.instances[0].mcVersion).toBe('1.21')
    expect(store.instances[0].loaderType).toBe('neoforge')
  })

  it('应使用默认值填充缺失字段', async () => {
    vi.mocked(window.electronAPI.instance.list).mockResolvedValueOnce([
      mockRawInstance({ id: '1', loader_type: undefined })
    ])

    const store = freshStore()
    await store.fetchInstances()

    expect(store.instances[0].loaderType).toBe('vanilla')
    expect(store.instances[0].minMemory).toBe(1024)
    expect(store.instances[0].maxMemory).toBe(4096)
  })

  it('失败时应设置 error', async () => {
    vi.mocked(window.electronAPI.instance.list).mockRejectedValueOnce(new Error('DB error'))
    const store = freshStore()
    await store.fetchInstances()
    expect(store.error).toBe('DB error')
    expect(store.loading).toBe(false)
  })
})

describe('instances store - createInstance', () => {
  it('应创建并插入实例到列表头部', async () => {
    vi.mocked(window.electronAPI.instance.create).mockResolvedValueOnce(
      mockRawInstance({ id: 'new', name: 'New' }) as any
    )

    const store = freshStore()
    store.instances = [mockInstance({ id: 'old' })]

    const result = await store.createInstance({ name: 'New', path: '/new', mcVersion: '1.20.1' })

    expect(store.instances[0].id).toBe('new')
    expect(store.instances[0].name).toBe('New')
  })

  it('返回 null 时不修改列表', async () => {
    vi.mocked(window.electronAPI.instance.create).mockResolvedValueOnce(null)
    const store = freshStore()
    const result = await store.createInstance({ name: 'X', path: '/x', mcVersion: '1.20.1' })
    expect(result).toBeNull()
  })
})

describe('instances store - updateInstance', () => {
  it('应调用主进程更新并刷新列表', async () => {
    vi.mocked(window.electronAPI.instance.update).mockResolvedValueOnce(true)
    vi.mocked(window.electronAPI.instance.list).mockResolvedValueOnce([
      mockRawInstance({ id: '1', name: 'Updated' })
    ])

    const store = freshStore()
    await store.updateInstance('1', { name: 'Updated' })

    expect(window.electronAPI.instance.update).toHaveBeenCalledWith('1', { name: 'Updated' })
    expect(store.instances[0].name).toBe('Updated')
  })
})

describe('instances store - deleteInstance', () => {
  it('应从列表删除实例', async () => {
    vi.mocked(window.electronAPI.instance.delete).mockResolvedValueOnce(true)
    const store = freshStore()
    store.instances = [mockInstance({ id: '1' }), mockInstance({ id: '2' })]

    await store.deleteInstance('1')

    expect(store.instances).toHaveLength(1)
    expect(store.instances[0].id).toBe('2')
  })

  it('删除当前选中实例时应重置 currentInstanceId', async () => {
    vi.mocked(window.electronAPI.instance.delete).mockResolvedValueOnce(true)
    const store = freshStore()
    store.instances = [mockInstance({ id: 'current' })]
    store.selectInstance('current')

    await store.deleteInstance('current')

    expect(store.currentInstanceId).toBeNull()
  })

  it('删除非当前实例时不影响 currentInstanceId', async () => {
    vi.mocked(window.electronAPI.instance.delete).mockResolvedValueOnce(true)
    const store = freshStore()
    store.instances = [mockInstance({ id: 'a' }), mockInstance({ id: 'b' })]
    store.selectInstance('a')

    await store.deleteInstance('b')

    expect(store.currentInstanceId).toBe('a')
  })
})

describe('instances store - 选择', () => {
  it('selectInstance 应设置当前实例', () => {
    const store = freshStore()
    store.selectInstance('test-id')
    expect(store.currentInstanceId).toBe('test-id')
  })

  it('selectInstance(null) 应清除选择', () => {
    const store = freshStore()
    store.selectInstance('test-id')
    store.selectInstance(null)
    expect(store.currentInstanceId).toBeNull()
  })
})

describe('instances store - toggleFavorite', () => {
  it('应切换收藏状态', async () => {
    vi.mocked(window.electronAPI.instance.update).mockResolvedValueOnce(true)
    vi.mocked(window.electronAPI.instance.list).mockResolvedValueOnce([
      mockRawInstance({ id: '1', is_favorited: 1 })
    ])

    const store = freshStore()
    store.instances = [mockInstance({ id: '1', isFavorited: 0 })]

    await store.toggleFavorite('1')

    expect(window.electronAPI.instance.update).toHaveBeenCalledWith('1', { isFavorited: 1 })
  })

  it('应取消收藏', async () => {
    vi.mocked(window.electronAPI.instance.update).mockResolvedValueOnce(true)
    vi.mocked(window.electronAPI.instance.list).mockResolvedValueOnce([
      mockRawInstance({ id: '1', is_favorited: 0 })
    ])

    const store = freshStore()
    store.instances = [mockInstance({ id: '1', isFavorited: 1 })]

    await store.toggleFavorite('1')

    expect(window.electronAPI.instance.update).toHaveBeenCalledWith('1', { isFavorited: 0 })
  })
})

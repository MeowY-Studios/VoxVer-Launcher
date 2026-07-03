/**
 * Mods Store 测试 - Mod 列表管理
 * 覆盖：默认值、过滤、搜索、统计、fetch、toggle、remove
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useModsStore } from '../../src/stores/mods.store'
import type { LocalMod } from '../../src/types/mod'

function freshStore() {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  return useModsStore()
}

function mockMod(overrides: Partial<LocalMod> = {}): LocalMod {
  return {
    id: 'mod-1',
    fileName: 'test-mod.jar',
    displayName: 'Test Mod',
    version: '1.0.0',
    description: 'A test mod',
    author: 'TestAuthor',
    instanceId: 'inst-1',
    status: 'active',
    filePath: '/mods/test-mod.jar',
    fileSize: 1024,
    dependencies: [],
    dependsOn: [],
    installedAt: '2024-01-01T00:00:00Z',
    ...overrides
  }
}

function mockRawMod(overrides: Record<string, any> = {}) {
  return {
    filePath: '/mods/mod.jar',
    fileName: 'mod.jar',
    displayName: 'Display Name',
    version: '1.0.0',
    description: 'Desc',
    author: 'Author',
    status: 'active',
    fileSize: 2048,
    dependencies: [],
    dependsOn: [],
    installedAt: '2024-01-01T00:00:00Z',
    ...overrides
  }
}

describe('mods store - 默认值', () => {
  it('应初始化为空 Mod 列表', () => {
    const store = freshStore()
    expect(store.mods).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('应初始化搜索和筛选为默认值', () => {
    const store = freshStore()
    expect(store.searchQuery).toBe('')
    expect(store.filterStatus).toBe('all')
    expect(store.currentInstanceId).toBeNull()
  })
})

describe('mods store - filteredMods', () => {
  it('应返回所有 Mod（all 筛选）', () => {
    const store = freshStore()
    store.mods = [mockMod({ id: '1', status: 'active' }), mockMod({ id: '2', status: 'disabled' })]
    expect(store.filteredMods).toHaveLength(2)
  })

  it('应按状态筛选', () => {
    const store = freshStore()
    store.mods = [
      mockMod({ id: '1', status: 'active' }),
      mockMod({ id: '2', status: 'disabled' }),
      mockMod({ id: '3', status: 'active' })
    ]
    store.filterStatus = 'disabled'
    expect(store.filteredMods).toHaveLength(1)
    expect(store.filteredMods[0].id).toBe('2')
  })

  it('应按关键词搜索 displayName', () => {
    const store = freshStore()
    store.mods = [mockMod({ id: '1', displayName: 'OptiFine' }), mockMod({ id: '2', displayName: 'JEI' })]
    store.searchQuery = 'optifine'
    expect(store.filteredMods).toHaveLength(1)
    expect(store.filteredMods[0].displayName).toBe('OptiFine')
  })

  it('应按文件名搜索', () => {
    const store = freshStore()
    store.mods = [
      mockMod({ id: '1', fileName: 'sodium.jar' }),
      mockMod({ id: '2', fileName: 'jei.jar' })
    ]
    store.searchQuery = 'sodium'
    expect(store.filteredMods).toHaveLength(1)
  })

  it('应按作者搜索', () => {
    const store = freshStore()
    store.mods = [
      mockMod({ id: '1', author: 'CaffeineMC' }),
      mockMod({ id: '2', author: 'Mezz' })
    ]
    store.searchQuery = 'caffeine'
    expect(store.filteredMods).toHaveLength(1)
  })

  it('应大小写不敏感搜索', () => {
    const store = freshStore()
    store.mods = [mockMod({ id: '1', displayName: 'OptiFine' })]
    store.searchQuery = 'OPTIFINE'
    expect(store.filteredMods).toHaveLength(1)
  })

  it('应同时过滤状态和搜索', () => {
    const store = freshStore()
    store.mods = [
      mockMod({ id: '1', displayName: 'Sodium', status: 'active' }),
      mockMod({ id: '2', displayName: 'Sodium Extra', status: 'disabled' })
    ]
    store.filterStatus = 'active'
    store.searchQuery = 'sodium'
    expect(store.filteredMods).toHaveLength(1)
    expect(store.filteredMods[0].id).toBe('1')
  })
})

describe('mods store - stats', () => {
  it('应统计各状态 Mod 数量', () => {
    const store = freshStore()
    store.mods = [
      mockMod({ id: '1', status: 'active' }),
      mockMod({ id: '2', status: 'active' }),
      mockMod({ id: '3', status: 'disabled' }),
      mockMod({ id: '4', status: 'incompatible' })
    ]
    expect(store.stats).toEqual({
      total: 4,
      active: 2,
      disabled: 1,
      incompatible: 1
    })
  })
})

describe('mods store - fetchMods', () => {
  it('应获取并映射 Mod 列表', async () => {
    vi.mocked(window.electronAPI.mod.list).mockResolvedValueOnce({
      ok: true,
      data: [mockRawMod({ filePath: '/mods/test.jar', displayName: 'Test Mod' })]
    } as any)

    const store = freshStore()
    await store.fetchMods('/game/dir')

    expect(store.mods).toHaveLength(1)
    expect(store.mods[0].displayName).toBe('Test Mod')
    expect(store.mods[0].filePath).toBe('/mods/test.jar')
    expect(store.loading).toBe(false)
  })

  it('API 返回非 ok 时应重置为空', async () => {
    vi.mocked(window.electronAPI.mod.list).mockResolvedValueOnce({ ok: false } as any)
    const store = freshStore()
    store.mods = [mockMod()]

    await store.fetchMods('/game/dir')

    expect(store.mods).toEqual([])
  })

  it('失败时应设置 error 并停止 loading', async () => {
    vi.mocked(window.electronAPI.mod.list).mockRejectedValueOnce(new Error('EACCES'))
    const store = freshStore()
    await store.fetchMods('/game/dir')
    expect(store.error).toBe('EACCES')
    expect(store.loading).toBe(false)
  })
})

describe('mods store - toggleMod', () => {
  it('应启用已禁用的 Mod', async () => {
    vi.mocked(window.electronAPI.mod.enable).mockResolvedValueOnce(true)
    const store = freshStore()
    store.mods = [mockMod({ id: '1', status: 'disabled', filePath: '/mods/m.jar' })]

    await store.toggleMod('1')

    expect(window.electronAPI.mod.enable).toHaveBeenCalledWith('/mods/m.jar')
    expect(store.mods[0].status).toBe('active')
  })

  it('应禁用已启用的 Mod', async () => {
    vi.mocked(window.electronAPI.mod.disable).mockResolvedValueOnce(true)
    const store = freshStore()
    store.mods = [mockMod({ id: '1', status: 'active', filePath: '/mods/m.jar' })]

    await store.toggleMod('1')

    expect(window.electronAPI.mod.disable).toHaveBeenCalledWith('/mods/m.jar')
    expect(store.mods[0].status).toBe('disabled')
  })

  it('Mod 不存在时应无操作', async () => {
    const store = freshStore()
    await store.toggleMod('nonexistent')
    expect(window.electronAPI.mod.enable).not.toHaveBeenCalled()
    expect(window.electronAPI.mod.disable).not.toHaveBeenCalled()
  })

  it('操作失败时应设置 error', async () => {
    vi.mocked(window.electronAPI.mod.disable).mockRejectedValueOnce(new Error('Permission denied'))
    const store = freshStore()
    store.mods = [mockMod({ id: '1', status: 'active', filePath: '/mods/m.jar' })]

    await store.toggleMod('1')

    expect(store.error).toBe('Permission denied')
  })
})

describe('mods store - removeMod', () => {
  it('应卸载并从列表移除', async () => {
    vi.mocked(window.electronAPI.mod.uninstall).mockResolvedValueOnce(true)
    const store = freshStore()
    store.mods = [mockMod({ id: '1', filePath: '/mods/a.jar' }), mockMod({ id: '2', filePath: '/mods/b.jar' })]

    await store.removeMod('1')

    expect(window.electronAPI.mod.uninstall).toHaveBeenCalledWith('/mods/a.jar')
    expect(store.mods).toHaveLength(1)
    expect(store.mods[0].id).toBe('2')
  })

  it('Mod 不存在时应无操作', async () => {
    const store = freshStore()
    await store.removeMod('nonexistent')
    expect(window.electronAPI.mod.uninstall).not.toHaveBeenCalled()
  })
})

describe('mods store - setFilter / setSearch', () => {
  it('setFilter 应更新筛选状态', () => {
    const store = freshStore()
    store.setFilter('disabled')
    expect(store.filterStatus).toBe('disabled')

    store.setFilter('all')
    expect(store.filterStatus).toBe('all')
  })

  it('setSearch 应更新搜索关键词', () => {
    const store = freshStore()
    store.setSearch('sodium')
    expect(store.searchQuery).toBe('sodium')
  })
})

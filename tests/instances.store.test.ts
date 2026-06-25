import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useInstancesStore } from '../src/stores/instances.store'
import type { GameInstance } from '../types/instance'

describe('instances store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const store = useInstancesStore()

    expect(store.instances).toEqual([])
    expect(store.currentInstanceId).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('should have currentInstance computed property', () => {
    const store = useInstancesStore()
    expect(store.currentInstance).toBeNull()
  })

  it('should find current instance by id', () => {
    const store = useInstancesStore()
    const mockInstances: GameInstance[] = [
      { id: '1', name: 'Instance 1', path: '/path/1', mcVersion: '1.20.1', loaderType: 'fabric' as const, lastPlayed: null, isFavorited: 0, createdAt: new Date().toISOString() },
      { id: '2', name: 'Instance 2', path: '/path/2', mcVersion: '1.19.4', loaderType: 'forge' as const, lastPlayed: null, isFavorited: 0, createdAt: new Date().toISOString() }
    ]

    store.instances = mockInstances
    store.selectInstance('1')

    expect(store.currentInstance?.id).toBe('1')
    expect(store.currentInstance?.name).toBe('Instance 1')
  })

  it('should have recentInstances computed property', () => {
    const store = useInstancesStore()
    expect(store.recentInstances).toEqual([])
  })

  it('should return recent instances sorted by lastPlayed', () => {
    const store = useInstancesStore()
    const now = new Date()
    const mockInstances: GameInstance[] = [
      { id: '1', name: 'Old', path: '/path/1', mcVersion: '1.20.1', loaderType: 'fabric' as const, lastPlayed: new Date(now.getTime() - 86400000 * 5).toISOString(), isFavorited: 0, createdAt: now.toISOString() },
      { id: '2', name: 'Recent', path: '/path/2', mcVersion: '1.19.4', loaderType: 'forge' as const, lastPlayed: new Date(now.getTime() - 86400000).toISOString(), isFavorited: 0, createdAt: now.toISOString() },
      { id: '3', name: 'NoPlay', path: '/path/3', mcVersion: '1.18.2', loaderType: 'vanilla' as const, lastPlayed: null, isFavorited: 0, createdAt: now.toISOString() }
    ]

    store.instances = mockInstances
    const recent = store.recentInstances

    expect(recent.length).toBe(2)
    expect(recent[0].name).toBe('Recent')
    expect(recent[1].name).toBe('Old')
  })

  it('should limit recent instances to 5', () => {
    const store = useInstancesStore()
    const now = new Date()
    const mockInstances: GameInstance[] = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      name: `Instance ${i}`,
      path: `/path/${i}`,
      mcVersion: '1.20.1',
      loaderType: 'fabric' as const,
      lastPlayed: new Date(now.getTime() - 86400000 * i).toISOString(),
      isFavorited: 0,
      createdAt: now.toISOString()
    }))

    store.instances = mockInstances
    expect(store.recentInstances.length).toBe(5)
  })

  it('should have favoritedInstances computed property', () => {
    const store = useInstancesStore()
    expect(store.favoritedInstances).toEqual([])
  })

  it('should return favorited instances only', () => {
    const store = useInstancesStore()
    const mockInstances: GameInstance[] = [
      { id: '1', name: 'Favorited', path: '/path/1', mcVersion: '1.20.1', loaderType: 'fabric' as const, lastPlayed: null, isFavorited: 1, createdAt: new Date().toISOString() },
      { id: '2', name: 'Not Favorited', path: '/path/2', mcVersion: '1.19.4', loaderType: 'forge' as const, lastPlayed: null, isFavorited: 0, createdAt: new Date().toISOString() }
    ]

    store.instances = mockInstances
    expect(store.favoritedInstances.length).toBe(1)
    expect(store.favoritedInstances[0].name).toBe('Favorited')
  })

  it('should select instance correctly', () => {
    const store = useInstancesStore()

    store.selectInstance('test-id')
    expect(store.currentInstanceId).toBe('test-id')

    store.selectInstance(null)
    expect(store.currentInstanceId).toBeNull()
  })

  it('should fetch instances from electron API', async () => {
    const mockInstances = [
      { id: '1', name: 'Test', path: '/test', mc_version: '1.20.1', loader_type: 'fabric', last_played: null, is_favorited: 0, created_at: new Date().toISOString() }
    ]

    vi.mocked(window.electronAPI.instance.list).mockResolvedValueOnce(mockInstances as any)

    const store = useInstancesStore()
    await store.fetchInstances()

    expect(store.instances.length).toBe(1)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })
})

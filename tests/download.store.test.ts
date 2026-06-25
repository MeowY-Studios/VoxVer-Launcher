import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDownloadStore } from '../src/stores/download.store'

describe('download store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with default values', () => {
    const store = useDownloadStore()

    expect(store.searchQuery).toBe('')
    expect(store.searchSource).toBe('modrinth')
    expect(store.searchResults).toEqual([])
    expect(store.searching).toBe(false)
    expect(store.hasMore).toBe(true)
    expect(store.activeCategory).toBe('vanilla')
    expect(store.activeDownloads).toEqual([])
    expect(store.queuedDownloads).toEqual([])
    expect(store.completedDownloads).toEqual([])
    expect(store.showFloatPanel).toBe(false)
    expect(store.showDownloadManager).toBe(false)
  })

  it('should have isDownloading computed property', () => {
    const store = useDownloadStore()
    expect(store.isDownloading).toBe(false)
  })

  it('should have totalSpeed computed property', () => {
    const store = useDownloadStore()
    expect(store.totalSpeed).toBe(0)
  })

  it('should have overallProgress computed property', () => {
    const store = useDownloadStore()
    expect(store.overallProgress).toBe(100)
  })

  it('should have hasActiveVersionDownload computed property', () => {
    const store = useDownloadStore()
    expect(store.hasActiveVersionDownload).toBe(false)
  })

  it('should set search source correctly', () => {
    const store = useDownloadStore()
    store.setSource('curseforge')
    expect(store.searchSource).toBe('curseforge')
    expect(store.searchResults).toEqual([])
  })

  it('should set search query correctly', () => {
    const store = useDownloadStore()
    store.setSearchQuery('test query')
    expect(store.searchQuery).toBe('test query')
  })

  it('should update version progress correctly', () => {
    const store = useDownloadStore()

    store.versionTasks.set('1.20.1', {
      id: '1.20.1',
      name: '1.20.1',
      phase: 'resolving',
      progress: 5,
      phaseLabel: '解析中...',
      speed: 0,
      downloadedSize: 0,
      totalSize: 0,
      targetFolder: '/test'
    })

    store.updateVersionProgress({
      taskId: 'task-1',
      versionId: '1.20.1',
      phase: 'downloading',
      phaseLabel: '下载中...',
      progress: 50,
      downloaded: 50000,
      total: 100000,
      speed: 1000,
      gameDir: '/test'
    })

    const task = store.versionTasks.get('1.20.1')
    expect(task).toBeDefined()
    expect(task?.progress).toBe(50)
    expect(task?.downloadedSize).toBe(50000)
    expect(task?.totalSize).toBe(100000)
    expect(task?.speed).toBe(1000)
    expect(task?.phaseLabel).toBe('下载中...')
  })

  it('should mark version download as complete', () => {
    const store = useDownloadStore()

    store.versionTasks.set('1.20.1', {
      id: '1.20.1',
      name: '1.20.1',
      phase: 'downloading',
      progress: 50,
      phaseLabel: '下载中...',
      speed: 1000,
      downloadedSize: 50000,
      totalSize: 100000,
      targetFolder: '/test'
    })

    store.onVersionComplete({
      taskId: 'task-1',
      versionId: '1.20.1',
      gameDir: '/test'
    })

    const task = store.versionTasks.get('1.20.1')
    expect(task?.phase).toBe('completed')
    expect(task?.progress).toBe(100)
    expect(task?.phaseLabel).toBe('下载完成')
  })

  it('should mark version download as failed', () => {
    const store = useDownloadStore()

    store.versionTasks.set('1.20.1', {
      id: '1.20.1',
      name: '1.20.1',
      phase: 'downloading',
      progress: 50,
      phaseLabel: '下载中...',
      speed: 1000,
      downloadedSize: 50000,
      totalSize: 100000,
      targetFolder: '/test'
    })

    store.onVersionError({
      taskId: 'task-1',
      versionId: '1.20.1',
      error: 'Network error'
    })

    const task = store.versionTasks.get('1.20.1')
    expect(task?.phase).toBe('failed')
    expect(task?.error).toBe('Network error')
    expect(task?.phaseLabel).toBe('失败: Network error')
  })

  it('should remove version task', () => {
    const store = useDownloadStore()

    store.versionTasks.set('1.20.1', {
      id: '1.20.1',
      name: '1.20.1',
      phase: 'completed',
      progress: 100,
      phaseLabel: '下载完成',
      speed: 0,
      downloadedSize: 100000,
      totalSize: 100000,
      targetFolder: '/test'
    })

    expect(store.versionTasks.size).toBe(1)
    store.removeVersionTask('1.20.1')
    expect(store.versionTasks.size).toBe(0)
  })

  it('should not update progress for non-existent task', () => {
    const store = useDownloadStore()

    store.updateVersionProgress({
      taskId: 'task-1',
      versionId: 'nonexistent',
      phase: 'downloading',
      phaseLabel: '下载中...',
      progress: 50,
      downloaded: 50000,
      total: 100000,
      speed: 1000,
      gameDir: '/test'
    })

    expect(store.versionTasks.size).toBe(0)
  })
})

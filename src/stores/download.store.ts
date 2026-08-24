/**
 * Download Store - 下载管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ModSearchParams,
  ModSearchResult,
  DownloadTask,
  DownloadStatus,
  ContentPlatform,
  VersionDownloadTask
} from '../types/download'
import { $t } from '../utils/i18n'

export const useDownloadStore = defineStore('download', () => {
  // * ====== 搜索状态 ======
  const searchQuery = ref('')
  const searchSource = ref<ContentPlatform>('modrinth')
  const searchResults = ref<ModSearchResult[]>([])
  const searching = ref(false)
  const searchOffset = ref(0)
  const hasMore = ref(true)
  /** 搜索错误信息（供 UI 展示） */
  const searchError = ref('')
  /** 双源搜索时分别记录各源偏移量 */
  const searchOffsetMr = ref(0)
  const searchOffsetCf = ref(0)
  const hasMoreMr = ref(true)
  const hasMoreCf = ref(true)
  /** 保存上次搜索参数，供 loadMore 使用 */
  const lastSearchParams = ref<{
    query?: string
    gameVersion?: string
    loaderType?: string
    projectType?: string
  }>({})

  // * ====== 搜索软缓存 ======
  /** 缓存结构: key -> { results, offset, hasMore, timestamp } */
  const searchCache = ref<
    Map<string, { results: ModSearchResult[]; offset: number; hasMore: boolean; timestamp: number }>
  >(new Map())
  const CACHE_TTL = 5 * 60 * 1000 // * 5分钟过期

  // * ====== 下载队列状态 ======
  const activeDownloads = ref<DownloadTask[]>([])
  const queuedDownloads = ref<DownloadTask[]>([])
  const completedDownloads = ref<DownloadTask[]>([])

  // * ====== 分类筛选 ======
  const activeCategory = ref<string>('vanilla')

  // * ====== MC 版本下载任务 ======
  const versionTasks = ref<Map<string, VersionDownloadTask>>(new Map())
  /** 是否显示后台悬浮窗 */
  const showFloatPanel = ref(false)
  /** 下载管理器页面是否打开 */
  const showDownloadManager = ref(false)

  // * ====== 计算属性 ======

  /** 是否有正在进行的下载 */
  const isDownloading = computed(() =>
    activeDownloads.value.some((d) => d.status === 'downloading')
  )

  /** 总下载速度 */
  const totalSpeed = computed(() =>
    activeDownloads.value
      .filter((d) => d.status === 'downloading')
      .reduce((sum, d) => sum + d.speed, 0)
  )

  /** 总进度 */
  const overallProgress = computed(() => {
    if (activeDownloads.value.length === 0) return 100
    const totalSize = activeDownloads.value.reduce((s, d) => s + d.totalSize, 0)
    const doneSize = activeDownloads.value.reduce((s, d) => s + d.downloadedSize, 0)
    return totalSize > 0 ? Math.round((doneSize / totalSize) * 100) : 0
  })

  /** 是否有任何活跃版本下载 */
  const hasActiveVersionDownload = computed(() =>
    Array.from(versionTasks.value.values()).some(
      (t) => t.phase !== 'completed' && t.phase !== 'failed' && t.phase !== 'idle'
    )
  )

  // * ====== 操作 ======

  /** 开始下载 MC 版本（后台流式） */
  async function startVersionDownload(
    versionId: string,
    targetFolder: string,
    loader?: string,
    loaderVersion?: string,
    displayName?: string
  ) {
    const api = window.electronAPI
    if (!api?.versions) return

    const task: VersionDownloadTask = {
      id: versionId,
      name: displayName || versionId,
      phase: 'resolving',
      progress: 5,
      phaseLabel: $t('download.resolvingManifest'),
      speed: 0,
      downloadedSize: 0,
      totalSize: 0,
      targetFolder
    }
    versionTasks.value.set(versionId, task)
    showFloatPanel.value = true

    const res = await api.versions.downloadStart(versionId, targetFolder)
    if (!res?.ok) {
      task.phase = 'failed'
      task.error = res?.error || $t('download.downloadUnknownError')
      task.phaseLabel = $t('download.downloadFailedWithError', { error: task.error })
    }
  }

  /** 更新版本下载进度（由事件监听器调用） */
  function updateVersionProgress(data: {
    taskId: string
    versionId: string
    phase: string
    phaseLabel: string
    progress: number
    downloaded: number
    total: number
    speed: number
    gameDir: string
  }) {
    const task = versionTasks.value.get(data.versionId)
    if (!task) return
    ;(task as unknown as DownloadTask).phase = data.phase
    task.phaseLabel = data.phaseLabel
    task.progress = data.progress
    task.downloadedSize = data.downloaded
    task.totalSize = data.total
    task.speed = data.speed
  }

  /** 版本下载完成 */
  function onVersionComplete(data: { taskId: string; versionId: string; gameDir: string }) {
    const task = versionTasks.value.get(data.versionId)
    if (task) {
      task.phase = 'completed'
      task.progress = 100
      task.phaseLabel = $t('download.downloadCompleted')
    }
  }

  /** 版本下载失败 */
  function onVersionError(data: { taskId: string; versionId: string; error: string }) {
    const task = versionTasks.value.get(data.versionId)
    if (task) {
      task.phase = 'failed'
      task.error = data.error
      task.phaseLabel = $t('download.downloadFailedWithError', { error: data.error })
    }
  }

  /** 移除版本下载任务 */
  function removeVersionTask(versionId: string) {
    versionTasks.value.delete(versionId)
    if (versionTasks.value.size === 0) showFloatPanel.value = false
  }

  /** 下载服务端 Jar */
  async function downloadServerJar(versionId: string, savePath: string) {
    const api = window.electronAPI
    if (!api?.versions) return

    const task: VersionDownloadTask = {
      id: versionId + '-server',
      name: $t('download.serverVersion', { id: versionId }),
      phase: 'idle',
      progress: 0,
      phaseLabel: $t('download.downloadingServer'),
      speed: 0,
      downloadedSize: 0,
      totalSize: 0,
      targetFolder: savePath
    }
    versionTasks.value.set(task.id, task)
    showFloatPanel.value = true

    try {
      await api.versions.downloadServer(versionId, savePath)
      task.phase = 'completed'
      task.progress = 100
      task.phaseLabel = $t('download.downloadCompleted')
    } catch (error: unknown) {
      task.phase = 'failed'
      task.error = (error as Error).message || $t('download.downloadFailed')
      task.phaseLabel = $t('download.downloadFailedWithError', { error: task.error })
    }
  }

  /** 搜索 Mod */
  async function searchMods(params?: Partial<ModSearchParams>) {
    searching.value = true
    try {
      const srcVal = params?.source ?? searchSource.value
      const offset = params?.offset ?? 0
      const limit = params?.limit ?? 100

      // * 缓存：仅对首页查询缓存
      if (offset === 0) {
        const cacheKey = JSON.stringify({
          q: params?.query ?? searchQuery.value,
          gv: params?.gameVersion,
          ld: params?.loaderType,
          pt: params?.projectType,
          src: srcVal
        })
        const cached = searchCache.value.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          searchResults.value = cached.results
          searchOffset.value = cached.offset
          hasMore.value = cached.hasMore
          searching.value = false
          return
        }
      }
      const queryParams = {
        query: params?.query ?? searchQuery.value,
        platform:
          srcVal === 'curseforge' ? 'curseforge' : srcVal === 'modrinth' ? 'modrinth' : undefined,
        offset,
        limit,
        gameVersion: params?.gameVersion,
        loader: params?.loaderType,
        category: params?.category,
        projectType: params?.projectType
      }
      const response = await window.electronAPI?.download.searchMods(queryParams)
      if (response && (response as { data?: unknown[]; success?: boolean; error?: string }).success === false) {
        searchError.value = (response as { data?: unknown[]; success?: boolean; error?: string }).error || $t('download.searchFailed')
        console.error('[searchMods] IPC 返回错误:', searchError.value)
      } else {
        searchError.value = ''
      }
      const data = (response as { data?: unknown[]; success?: boolean; error?: string })?.data || []
      const mapped = data.map((raw) =>
        mapRawToModResult(raw as unknown as Record<string, unknown>)
      )

      if (offset === 0) {
        searchResults.value = mapped
      } else {
        // * 追加，跳过已存在的（双源可能有重复 id+source）
        const existingKeys = new Set(searchResults.value.map((m) => m.id + '|' + m.source))
        for (const item of mapped) {
          const key = item.id + '|' + item.source
          if (!existingKeys.has(key)) {
            searchResults.value.push(item)
            existingKeys.add(key)
          }
        }
      }

      // * 判断是否还有更多：本次有返回数据就假设还有，返回为空才确定耗尽
      const sourceHasMore = data.length > 0
      if (srcVal === 'modrinth') {
        hasMoreMr.value = sourceHasMore
        searchOffsetMr.value = offset + data.length
      } else if (srcVal === 'curseforge') {
        hasMoreCf.value = sourceHasMore
        searchOffsetCf.value = offset + data.length
      }
      hasMore.value = sourceHasMore

      // * 保存搜索参数供 loadMore 使用
      if (offset === 0) {
        lastSearchParams.value = {
          query: params?.query,
          gameVersion: params?.gameVersion,
          loaderType: params?.loaderType,
          projectType: params?.projectType
        }
      }

      // * 重新按下载量排序
      searchResults.value.sort((a, b) => (b.downloads || 0) - (a.downloads || 0))

      searchOffset.value = offset + data.length

      // * 写入缓存
      if (offset === 0) {
        const cacheKey = JSON.stringify({
          q: params?.query ?? searchQuery.value,
          gv: params?.gameVersion,
          ld: params?.loaderType,
          pt: params?.projectType,
          src: srcVal
        })
        searchCache.value.set(cacheKey, {
          results: searchResults.value,
          offset: searchOffset.value,
          hasMore: hasMore.value,
          timestamp: Date.now()
        })
        // * 限制缓存大小（最多 20 条）
        if (searchCache.value.size > 20) {
          const firstKey = searchCache.value.keys().next().value
          if (firstKey) searchCache.value.delete(firstKey)
        }
      }
    } catch (e: unknown) {
      console.error('[searchMods] 搜索失败:', e)
    } finally {
      searching.value = false
    }
  }

  /** 加载更多（支持双源） */
  async function loadMore(params?: {
    query?: string
    gameVersion?: string
    loaderType?: string
    source?: ContentPlatform | 'all'
    projectType?: string
  }) {
    const p = params ?? lastSearchParams.value
    const srcVal = (params?.source ?? searchSource.value) as ContentPlatform | 'all'
    if (srcVal === 'all') {
      // CF 暂未授权，仅加载 Modrinth
      if (hasMoreMr.value) {
        await searchMods({
          ...p,
          source: 'modrinth',
          offset: searchOffsetMr.value
        })
      }
      hasMore.value = hasMoreMr.value
    } else {
      await searchMods({
        ...p,
        source: srcVal,
        offset: searchOffset.value
      })
    }
  }

  /** 刷新下载队列 */
  async function refreshQueue() {
    try {
      const activeRes = await window.electronAPI?.download.getActive()
      const queueRes = await window.electronAPI?.download.getQueue()
      activeDownloads.value = (
        (activeRes as { data?: unknown[]; success?: boolean; error?: string })?.data || []
      ).map((raw) => mapRawToTask(raw as unknown as Record<string, unknown>))
      queuedDownloads.value = (
        (queueRes as { data?: unknown[]; success?: boolean; error?: string })?.data || []
      ).map((raw) => mapRawToTask(raw as unknown as Record<string, unknown>))
    } catch (e) {
      console.error('刷新下载队列失败:', e)
    }
  }

  /** 取消下载 */
  async function cancelDownload(taskId: string) {
    await window.electronAPI?.download.cancelDownload(taskId)
    await refreshQueue()
  }

  /** 设置搜索源 */
  function setSource(source: ContentPlatform) {
    searchSource.value = source
    searchResults.value = []
    searchOffset.value = 0
  }

  function setSearchQuery(q: string) {
    searchQuery.value = q
  }

  // * ====== 实时下载事件订阅 ======
  let removeProgress: (() => void) | undefined
  let removeCompleted: (() => void) | undefined
  let removeError: (() => void) | undefined

  /** 启动下载事件监听（由组件在合适时机调用） */
  function attachDownloadListeners() {
    const api = window.electronAPI?.download
    if (!api) return

    removeProgress = api.onProgress((data) => {
      const d = data as Record<string, unknown>
      const id = d.id as string
      const task = activeDownloads.value.find((t) => t.id === id)
      if (task) {
        task.speed = (d.speed as number) || task.speed
        task.phase = (d.status as DownloadStatus) || task.phase
        task.downloadedSize = (d.downloadedSize as number) || task.downloadedSize
      }
    })

    removeCompleted = api.onCompleted((data) => {
      const d = data as Record<string, unknown>
      console.log('[download store] 下载完成:', d.fileName || d.id)
      refreshQueue()
      // 发送通知
      window.electronAPI?.notification?.send({
        title: $t('download.downloadCompleted'),
        body: (d.fileName as string) || $t('download.taskCompleted'),
        type: 'success'
      })
    })

    removeError = api.onError((data) => {
      const d = data as Record<string, unknown>
      console.error('[download store] 下载失败:', d.fileName || d.id, d.error)
      refreshQueue()
      window.electronAPI?.notification?.send({
        title: $t('download.downloadFailed'),
        body: (d.fileName as string) || (d.error as string) || $t('download.taskFailed'),
        type: 'error'
      })
    })

    // * 初始加载队列
    refreshQueue()
  }

  /** 清理事件监听 */
  function detachDownloadListeners() {
    removeProgress?.()
    removeCompleted?.()
    removeError?.()
  }

  return {
    // * 状态
    searchQuery,
    searchSource,
    searchResults,
    searching,
    hasMore,
    hasMoreMr,
    hasMoreCf,
    searchError,
    activeCategory,
    activeDownloads,
    queuedDownloads,
    completedDownloads,
    versionTasks,
    showFloatPanel,
    showDownloadManager,

    // * 计算属性
    isDownloading,
    totalSpeed,
    overallProgress,
    hasActiveVersionDownload,

    // * 操作
    startVersionDownload,
    updateVersionProgress,
    onVersionComplete,
    onVersionError,
    removeVersionTask,
    downloadServerJar,
    searchMods,
    loadMore,
    refreshQueue,
    cancelDownload,
    setSource,
    setSearchQuery,
    attachDownloadListeners,
    detachDownloadListeners
  }
})

// * ====== 映射函数 ======

function mapRawToModResult(raw: Record<string, unknown>): ModSearchResult {
  const d = raw as unknown as Record<string, unknown>
  return {
    id: String(d.id),
    name: (d.name as string) || (d.title as string) || '',
    author: (d.author as string) || '',
    description: (d.description as string) || '',
    iconUrl:
      (d.iconUrl as string) || (d.icon_url as string) || ((d.logo as Record<string, unknown>)?.url as string) || '',
    downloads: (d.downloads as number) ?? 0,
    follows: (d.follows as number) ?? (d.likes as number) ?? 0,
    source: (d.platform as string) === 'curseforge' ? 'curseforge' : 'modrinth',
    categories: (d.categories as string[]) || [],
    gameVersions: (d.gameVersions as string[]) || (d.game_versions as string[]) || [],
    loaders: (d.loaders as string[]) || []
  }
}

function mapRawToTask(raw: Record<string, unknown>): DownloadTask {
  const d = raw as unknown as Record<string, unknown>
  return {
    id: (d.id as string) || '',
    fileName: (d.file_name as string) || (d.fileName as string) || '',
    url: (d.url as string) || '',
    destination: (d.destination as string) || '',
    status: (d.status as DownloadStatus) || 'pending',
    progress: (d.progress as number) ?? 0,
    speed: (d.speed as number) ?? 0,
    downloadedSize: (d.downloaded_size as number) ?? (d.downloadedSize as number) ?? 0,
    totalSize: (d.total_size as number) ?? (d.totalSize as number) ?? 0,
    phase: d.phase as string | undefined,
    error: d.error as string | undefined,
    type: (d.type as DownloadTask['type']) || undefined,
    instanceId: (d.instanceId as string) || undefined,
    createdAt: (d.created_at as string) || (d.createdAt as string) || new Date().toISOString(),
    updatedAt: (d.updated_at as string) || (d.updatedAt as string) || undefined
  }
}

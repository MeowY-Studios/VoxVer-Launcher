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

/** 统一下载任务（供 UI 展示，合并版本下载和 Mod 下载） */
export interface UnifiedTask {
  id: string
  name: string
  phase: string
  progress: number
  phaseLabel: string
  speed: number
  downloadedSize: number
  totalSize: number
  targetFolder: string
  error?: string
  _lastTime?: number
  _type: 'version' | 'mod'
  /** 加载器/扩展信息（保存以便重试恢复完整参数） */
  loader?: string
  loaderVersion?: string
  optifine?: string
  optifineVersion?: string
}

/** VersionDownloadTask → UnifiedTask */
function versionToUnified(vt: VersionDownloadTask): UnifiedTask {
  return {
    id: vt.id,
    name: vt.name,
    phase: vt.phase,
    progress: vt.progress,
    phaseLabel: vt.phaseLabel,
    speed: vt.speed,
    downloadedSize: vt.downloadedSize,
    totalSize: vt.totalSize,
    targetFolder: vt.targetFolder,
    error: vt.error,
    _lastTime: vt._lastTime,
    _type: 'version',
    loader: vt.loader,
    loaderVersion: vt.loaderVersion,
    optifine: vt.optifine,
    optifineVersion: vt.optifineVersion
  }
}

/** DownloadTask → UnifiedTask */
function modToUnified(dt: DownloadTask): UnifiedTask {
  const phaseMap: Record<string, string> = {
    downloading: 'downloading',
    completed: 'completed',
    failed: 'failed',
    error: 'failed',
    cancelled: 'failed',
    pending: 'idle',
    queued: 'idle',
    paused: 'idle'
  }
  const phase = phaseMap[dt.status] || dt.phase || 'idle'
  const labelMap: Record<string, string> = {
    downloading: $t('download.downloading'),
    completed: $t('download.completed'),
    failed: $t('download.failed'),
    error: $t('download.failed'),
    cancelled: $t('download.cancelled'),
    pending: $t('download.waiting'),
    queued: $t('download.waiting'),
    paused: $t('download.paused')
  }
  return {
    id: dt.id,
    name: dt.fileName || dt.url.split('/').pop() || dt.id,
    phase,
    progress: dt.progress,
    phaseLabel: dt.phase || labelMap[dt.status] || dt.status,
    speed: dt.speed,
    downloadedSize: dt.downloadedSize,
    totalSize: dt.totalSize,
    targetFolder: dt.destination,
    error: dt.error,
    _lastTime: dt.updatedAt ? new Date(dt.updatedAt).getTime() : undefined,
    _type: 'mod'
  }
}

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
  /** 历史下载记录（已完成/失败/取消，跨会话持久化，供下载管理页查看） */
  const historyTasks = ref<DownloadTask[]>([])

  // * ====== 分类筛选 ======
  const activeCategory = ref<string>('vanilla')

  // * ====== MC 版本下载任务 ======
  const versionTasks = ref<Map<string, VersionDownloadTask>>(new Map())
  /** 是否显示后台悬浮窗 */
  const showFloatPanel = ref(false)
  /** 是否抑制浮窗自动弹出（进入下载管理页时启用，避免进度事件再次拉起浮窗） */
  const suppressFloat = ref(false)
  /**
   * 用户是否手动关闭过悬浮窗（点了 X）。
   * 关闭后本次下载期间不再自动弹出，切换任何页面都不会弹出；
   * 只有用户再次触发下载时才重置。
   */
  const floatDismissed = ref(false)
  /** 下载管理器页面是否打开 */
  const showDownloadManager = ref(false)

  /** 用户点了悬浮窗的 X：本次下载期间不再自动弹出 */
  function dismissFloat(): void {
    showFloatPanel.value = false
    floatDismissed.value = true
  }

  /** 触发新的下载：重置「已关闭」规则并弹出悬浮窗 */
  function openFloatForNewDownload(): void {
    floatDismissed.value = false
    if (!suppressFloat.value) showFloatPanel.value = true
  }

  /** 版本下载历史持久化键（仅存已结束的任务，供跨会话展示） */
  const VERSION_HISTORY_KEY = 'voxver_version_download_history'

  /** 把已结束的版本下载任务写入本地存储 */
  function persistVersionTasks() {
    try {
      const finished = Array.from(versionTasks.value.values())
        .filter((t) => t.phase === 'completed' || t.phase === 'failed')
        .map((t) => ({ ...t, speed: 0 }))
      localStorage.setItem(VERSION_HISTORY_KEY, JSON.stringify(finished))
    } catch {
      // 持久化失败不影响下载流程
    }
  }

  /** 恢复上次运行的版本下载历史 */
  function restoreVersionTasks() {
    try {
      const raw = localStorage.getItem(VERSION_HISTORY_KEY)
      if (!raw) return
      const list: unknown = JSON.parse(raw)
      if (!Array.isArray(list)) return
      for (const item of list) {
        if (!item || typeof item !== 'object') continue
        const task = item as VersionDownloadTask
        if (typeof task.id !== 'string' || versionTasks.value.has(task.id)) continue
        if (task.phase !== 'completed' && task.phase !== 'failed') continue
        versionTasks.value.set(task.id, { ...task, speed: 0 })
      }
    } catch {
      // 数据损坏时直接忽略
    }
  }

  /** 清除版本下载历史：只移除列表记录，不删除磁盘文件 */
  function clearVersionHistory() {
    for (const [id, t] of versionTasks.value) {
      if (t.phase === 'completed' || t.phase === 'failed') {
        versionTasks.value.delete(id)
      }
    }
    persistVersionTasks()
  }

  restoreVersionTasks()


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

  /** 统一任务列表：合并版本下载 + Mod 下载 + 历史记录，供 UI 展示 */
  const unifiedTasks = computed<UnifiedTask[]>(() => {
    const versionOnes = Array.from(versionTasks.value.values()).map(versionToUnified)
    const modOnes = activeDownloads.value.map(modToUnified)
    // 历史记录：仅取已终结状态（避免与进行中任务重复），并按 id 去重
    const aliveIds = new Set<string>([
      ...versionTasks.value.keys(),
      ...activeDownloads.value.map((t) => t.id)
    ])
    const historyOnes = historyTasks.value
      .filter(
        (t) =>
          t.status === 'completed' ||
          t.status === 'failed' ||
          t.status === 'cancelled' ||
          t.status === 'error'
      )
      .filter((t) => !aliveIds.has(t.id))
      .map(modToUnified)
    return [...versionOnes, ...modOnes, ...historyOnes]
  })

  /** 是否有任何统一任务 */
  const hasAnyTask = computed(() => unifiedTasks.value.length > 0)

  /** 下载通知节流记录（key -> 上次推送时间），避免进度刷新过快 */
  const notifyThrottle = new Map<string, number>()

  /**
   * 推送/更新下载通知
   * 同一个 key 在通知中心里原地刷新：进行中显示进度，结束后变成成功/失败
   */
  function sendDownloadNotification(
    key: string,
    payload: {
      title: string
      body: string
      type?: 'info' | 'success' | 'error'
      progress?: number
      status: 'running' | 'success' | 'error'
    }
  ) {
    if (payload.status === 'running') {
      const last = notifyThrottle.get(key) ?? 0
      if (Date.now() - last < 1200) return
    }
    notifyThrottle.set(key, Date.now())
    window.electronAPI?.notification?.send({
      ...payload,
      source: 'download',
      key,
      route: '/download/manage'
    })
  }

  // * ====== 操作 ======

  /** 开始下载 MC 版本（后台流式） */
  async function startVersionDownload(
    versionId: string,
    targetFolder: string,
    loader?: string,
    loaderVersion?: string,
    displayName?: string,
    optifine?: string,
    optifineVersion?: string
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
      targetFolder,
      loader,
      loaderVersion,
      optifine,
      optifineVersion
    }
    versionTasks.value.set(versionId, task)
    // * 用户主动触发的下载：重置「已关闭浮窗」规则
    openFloatForNewDownload()
    // * 下载开始：在通知中心创建一条带进度的下载通知
    sendDownloadNotification(`dl:version:${versionId}`, {
      title: task.name,
      body: task.phaseLabel,
      type: 'info',
      progress: task.progress,
      status: 'running'
    })

    const res = await api.versions.downloadStart(versionId, targetFolder, {
      loader,
      loaderVersion,
      optifine,
      optifineVersion,
      displayName
    })
    if (!res?.ok) {
      task.phase = 'failed'
      task.error = res?.error || $t('download.downloadUnknownError')
      task.phaseLabel = $t('download.downloadFailedWithError', { error: task.error })
      sendDownloadNotification(`dl:version:${versionId}`, {
        title: task.name,
        body: task.phaseLabel,
        type: 'error',
        status: 'error'
      })
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
    // * 进度写入通知中心（内部节流）
    sendDownloadNotification(`dl:version:${data.versionId}`, {
      title: task.name,
      body: task.phaseLabel,
      type: 'info',
      progress: data.progress,
      status: 'running'
    })
  }

  /** 版本下载完成 */
  function onVersionComplete(data: { taskId: string; versionId: string; gameDir: string }) {
    const task = versionTasks.value.get(data.versionId)
    // * 加载器安装失败的提示不要被"下载完成"覆盖，否则用户看不到失败原因
    const installFailed = task?.phase === 'installing_failed'
    if (task) {
      task.phase = 'completed'
      task.progress = 100
      if (!installFailed) task.phaseLabel = $t('download.downloadCompleted')
    }
    sendDownloadNotification(`dl:version:${data.versionId}`, {
      title: task?.name || data.versionId,
      body: installFailed && task ? task.phaseLabel : $t('download.downloadCompleted'),
      type: installFailed ? 'error' : 'success',
      progress: 100,
      status: installFailed ? 'error' : 'success'
    })
    persistVersionTasks()
  }

  /** 版本下载失败 */
  function onVersionError(data: { taskId: string; versionId: string; error: string }) {
    const task = versionTasks.value.get(data.versionId)
    if (task) {
      task.phase = 'failed'
      task.error = data.error
      task.phaseLabel = $t('download.downloadFailedWithError', { error: data.error })
    }
    sendDownloadNotification(`dl:version:${data.versionId}`, {
      title: task?.name || data.versionId,
      body: data.error || $t('download.taskFailed'),
      type: 'error',
      status: 'error'
    })
    persistVersionTasks()
  }

  /** 移除版本下载任务 */
  function removeVersionTask(versionId: string) {
    versionTasks.value.delete(versionId)
    persistVersionTasks()
    // * 只有版本任务和 Mod 任务都为空时才隐藏面板
    if (versionTasks.value.size === 0 && activeDownloads.value.length === 0) {
      showFloatPanel.value = false
    }
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
    // * 用户主动触发的下载：重置「已关闭浮窗」规则
    openFloatForNewDownload()

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
      if (
        response &&
        (response as { data?: unknown[]; success?: boolean; error?: string }).success === false
      ) {
        searchError.value =
          (response as { data?: unknown[]; success?: boolean; error?: string }).error ||
          $t('download.searchFailed')
        console.error('[searchMods] IPC 返回错误:', searchError.value)
      } else {
        searchError.value = ''
      }
      const data = (response as { data?: unknown[]; success?: boolean; error?: string })?.data || []
      const mapped = data.map((raw) => mapRawToModResult(raw as unknown as Record<string, unknown>))

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
      // 加载跨会话的历史下载记录
      const historyRes = await window.electronAPI?.download.getHistory()
      historyTasks.value = (
        (historyRes as { data?: unknown[]; success?: boolean; error?: string })?.data || []
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

  /** 清空历史下载记录（含持久化落库） */
  async function clearHistory() {
    await window.electronAPI?.download.clearHistory()
    historyTasks.value = []
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
        // * Mod / 资源下载进度写入通知中心（内部节流）
        sendDownloadNotification(`dl:mod:${id}`, {
          title: task.fileName || id,
          body: $t('download.downloading'),
          type: 'info',
          progress: typeof d.progress === 'number' ? (d.progress as number) : task.progress,
          status: 'running'
        })
      }
      // * 有活跃 mod 下载时显示浮动面板（下载管理页打开期间、用户手动关闭过之后都不自动弹出）
      if (
        !suppressFloat.value &&
        !floatDismissed.value &&
        !showFloatPanel.value &&
        activeDownloads.value.length > 0
      ) {
        showFloatPanel.value = true
      }
    })

    removeCompleted = api.onCompleted(async (data) => {
      const d = data as Record<string, unknown>
      console.log('[download store] 下载完成:', d.fileName || d.id)
      await refreshQueue()
      // * 没有任务了就隐藏面板
      if (versionTasks.value.size === 0 && activeDownloads.value.length === 0) {
        showFloatPanel.value = false
      }
      // 更新通知中心里同一条下载通知
      sendDownloadNotification(`dl:mod:${d.id as string}`, {
        title: (d.fileName as string) || $t('download.taskCompleted'),
        body: $t('download.downloadCompleted'),
        type: 'success',
        progress: 100,
        status: 'success'
      })
    })

    removeError = api.onError(async (data) => {
      const d = data as Record<string, unknown>
      console.error('[download store] 下载失败:', d.fileName || d.id, d.error)
      await refreshQueue()
      // * 没有任务了就隐藏面板
      if (versionTasks.value.size === 0 && activeDownloads.value.length === 0) {
        showFloatPanel.value = false
      }
      sendDownloadNotification(`dl:mod:${d.id as string}`, {
        title: (d.fileName as string) || $t('download.taskFailed'),
        body: (d.error as string) || $t('download.taskFailed'),
        type: 'error',
        status: 'error'
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
    historyTasks,
    versionTasks,
    showFloatPanel,
    suppressFloat,
    floatDismissed,
    showDownloadManager,

    // * 计算属性
    isDownloading,
    totalSpeed,
    overallProgress,
    hasActiveVersionDownload,
    unifiedTasks,
    hasAnyTask,

    // * 操作
    dismissFloat,
    openFloatForNewDownload,
    startVersionDownload,
    updateVersionProgress,
    onVersionComplete,
    onVersionError,
    removeVersionTask,
    clearVersionHistory,
    downloadServerJar,
    searchMods,
    loadMore,
    refreshQueue,
    cancelDownload,
    clearHistory,
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
      (d.iconUrl as string) ||
      (d.icon_url as string) ||
      ((d.logo as Record<string, unknown>)?.url as string) ||
      '',
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

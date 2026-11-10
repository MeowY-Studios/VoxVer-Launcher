/**
 * 应用内通知服务
 * 通知由渲染进程以应用内弹窗展示，不使用 Windows/macOS 原生系统弹窗
 * 通知历史持久化到用户数据目录，重启后仍可在通知中心查看
 */
import { app } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'
/** 通知来源：系统（各功能页）/ 下载任务 / 官方（预留，后续接入 VoxVer 官方通知） */
export type NotificationSource = 'system' | 'download' | 'official'
/** 任务型通知的状态，用于下载进度等可变通知 */
export type NotificationStatus = 'info' | 'running' | 'success' | 'warning' | 'error'

export interface NotificationOptions {
  title: string
  body: string
  type?: NotificationType
  source?: NotificationSource
  /** 合并键：相同 key 的通知原地更新而不是新增（下载进度使用） */
  key?: string
  /** 进度 0-100（下载类通知） */
  progress?: number
  status?: NotificationStatus
  route?: string
  /** 置顶：清除通知时保留（官方置顶通知使用） */
  pinned?: boolean
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  type: NotificationType
  source: NotificationSource
  status?: NotificationStatus
  progress?: number
  timestamp: number
  updatedAt: number
  read: boolean
  route?: string
  key?: string
  /** 置顶：清除通知时保留（官方置顶通知使用） */
  pinned?: boolean
}

const MAX_HISTORY = 100

let history: NotificationItem[] = []
let loaded = false
let saveTimer: ReturnType<typeof setTimeout> | null = null

let onNotifyCallback: ((item: NotificationItem) => void) | null = null
let onUpdatedCallback: ((item: NotificationItem) => void) | null = null

function getHistoryFilePath(): string | null {
  try {
    return join(app.getPath('userData'), 'notifications.json')
  } catch {
    return null
  }
}

function isNotificationItem(value: unknown): value is NotificationItem {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.timestamp === 'number' &&
    typeof v.read === 'boolean'
  )
}

/** 首次访问时从磁盘加载历史 */
function ensureLoaded(): void {
  if (loaded) return
  loaded = true
  const file = getHistoryFilePath()
  if (!file) return
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf-8'))
    if (Array.isArray(parsed)) {
      history = parsed.filter(isNotificationItem).map((item) => ({
        ...item,
        source: item.source ?? 'system',
        updatedAt: item.updatedAt ?? item.timestamp
      }))
    }
  } catch {
    // 首次运行没有文件，或文件损坏，忽略
  }
}

function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    const file = getHistoryFilePath()
    if (!file) return
    try {
      writeFileSync(file, JSON.stringify(history.slice(0, MAX_HISTORY)), 'utf-8')
    } catch (error: unknown) {
      console.error('[notification] 保存通知历史失败:', (error as Error).message)
    }
  }, 300)
}

/**
 * 发送应用内通知；带 key 时原地更新同 key 的通知（下载进度场景）
 */
export function notify(options: NotificationOptions): NotificationItem {
  ensureLoaded()
  const {
    title,
    body,
    type = 'info',
    source = 'system',
    key,
    progress,
    status,
    route,
    pinned
  } = options
  const now = Date.now()

  if (key) {
    const existing = history.find((n) => n.key === key)
    if (existing) {
      existing.title = title
      existing.body = body
      existing.type = type
      existing.source = source
      if (status !== undefined) existing.status = status
      if (progress !== undefined) existing.progress = progress
      if (route !== undefined) existing.route = route
      if (pinned !== undefined) existing.pinned = pinned
      existing.updatedAt = now
      // 任务结束时重新标为未读，便于用户注意到下载结果
      if (status === 'success' || status === 'error') existing.read = false
      scheduleSave()
      if (onUpdatedCallback) onUpdatedCallback(existing)
      return existing
    }
  }

  const item: NotificationItem = {
    id: `notif_${now}_${Math.random().toString(36).slice(2, 7)}`,
    title,
    body,
    type,
    source,
    status,
    progress,
    timestamp: now,
    updatedAt: now,
    read: false,
    route,
    key,
    pinned
  }

  history.unshift(item)
  // 超出上限时优先淘汰最旧的普通通知，置顶通知始终保留
  while (history.length > MAX_HISTORY) {
    const index = history.map((n) => n.pinned).lastIndexOf(false)
    if (index < 0) break
    history.splice(index, 1)
  }
  scheduleSave()

  if (onNotifyCallback) {
    onNotifyCallback(item)
  }

  return item
}

/**
 * 注册新通知回调（供前端订阅）
 */
export function onNotify(callback: (item: NotificationItem) => void): () => void {
  onNotifyCallback = callback
  return () => {
    onNotifyCallback = null
  }
}

/**
 * 注册通知更新回调（同 key 的进度类通知）
 */
export function onUpdated(callback: (item: NotificationItem) => void): () => void {
  onUpdatedCallback = callback
  return () => {
    onUpdatedCallback = null
  }
}

/**
 * 获取通知历史
 */
export function getHistory(limit = 20): NotificationItem[] {
  ensureLoaded()
  return history.slice(0, limit)
}

/**
 * 标记通知为已读
 */
export function markAsRead(id: string): void {
  ensureLoaded()
  const item = history.find((n) => n.id === id)
  if (item) {
    item.read = true
    scheduleSave()
  }
}

/**
 * 标记全部已读
 */
export function markAllAsRead(): void {
  ensureLoaded()
  history.forEach((n) => {
    n.read = true
  })
  scheduleSave()
}

/**
 * 清除历史：保留置顶通知（官方置顶通知不可被清除）
 */
export function clearHistory(): void {
  ensureLoaded()
  history = history.filter((n) => n.pinned)
  scheduleSave()
}

/**
 * 获取未读数
 */
export function getUnreadCount(): number {
  ensureLoaded()
  return history.filter((n) => !n.read).length
}

// ====== 快捷通知方法 ======

export function notifyInfo(title: string, body: string, route?: string) {
  return notify({ title, body, type: 'info', route })
}

export function notifySuccess(title: string, body: string, route?: string) {
  return notify({ title, body, type: 'success', route })
}

export function notifyWarning(title: string, body: string, route?: string) {
  return notify({ title, body, type: 'warning', route })
}

export function notifyError(title: string, body: string, route?: string) {
  return notify({ title, body, type: 'error', route })
}

/**
 * 版本下载完成通知
 */
export function notifyVersionDownloaded(versionName: string) {
  return notifySuccess('下载完成', `${versionName} 已下载完成，可以开始游戏了`, '/')
}

/**
 * Mod 下载完成通知
 */
export function notifyModDownloaded(modName: string) {
  return notifySuccess('Mod 下载完成', `${modName} 已下载完成`)
}

/**
 * 新版本可用通知
 */
export function notifyNewVersion(available: string, current: string) {
  return notifyInfo(
    'VoxVer Launcher 更新可用',
    `新版本 ${available} 可用（当前 ${current}）`,
    '/downloads'
  )
}

/**
 * 游戏启动失败通知
 */
export function notifyLaunchFailed(instanceName: string, reason?: string) {
  return notifyError('启动失败', reason ? `${instanceName}: ${reason}` : `${instanceName} 启动失败`)
}

/**
 * Mod 加载器安装完成通知
 */
export function notifyModLoaderInstalled(loaderType: string, version: string) {
  return notifySuccess('安装完成', `${loaderType} ${version} 安装成功`)
}

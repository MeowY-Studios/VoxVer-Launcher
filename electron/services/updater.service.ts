import { autoUpdater, UpdateInfo } from 'electron-updater'
import { CancellationToken } from 'builder-util-runtime'
import { app, net, BrowserWindow, ipcMain } from 'electron'
import { logger } from '../utils/logger'
const log = logger.child('Updater')

const GITHUB_LATEST_RELEASE_API = 'https://api.github.com/repos/MeowY-Studios/VoxVer-Launcher/releases/latest'

/** 版本比对结果（"检查更新"入口返回给渲染端） */
export interface LatestVersionCheckResult {
  currentVersion: string
  latestVersion: string | null
  hasUpdate: boolean
  /** 最新 Release 的发布说明（GitHub Release body，markdown） */
  notes: string | null
  error: string | null
}

/** 从 tag（如 VoxVer-v0.7.1 / v0.7.1 / 0.7.1）中提取语义化版本号 */
function parseVersionFromTag(tag: string): string | null {
  const m = /\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?/.exec(tag)
  return m ? m[0] : null
}

/**
 * 比较 a 与 b：a 更新返回 1，相同返回 0，b 更新返回 -1。
 * 支持 "0.7.1" / "0.10.2-beta.1" 形式；数值相同时带预发布后缀的视为更低。
 */
function compareVersions(a: string, b: string): number {
  const sa = a.split('.')
  const sb = b.split('.')
  const len = Math.max(sa.length, sb.length)
  for (let i = 0; i < len; i++) {
    const segA = sa[i] ?? '0'
    const segB = sb[i] ?? '0'
    const numA = parseInt(/^\d+/.exec(segA)?.[0] ?? '0', 10)
    const numB = parseInt(/^\d+/.exec(segB)?.[0] ?? '0', 10)
    if (numA !== numB) return numA > numB ? 1 : -1
    const suffixA = segA.slice((/^\d+/.exec(segA)?.[0] ?? '').length)
    const suffixB = segB.slice((/^\d+/.exec(segB)?.[0] ?? '').length)
    if (!suffixA !== !suffixB) return suffixA ? -1 : 1
    if (suffixA && suffixB && suffixA !== suffixB) return suffixA > suffixB ? 1 : -1
  }
  return 0
}

/**
 * 通过 GitHub API 直接对比本地版本与最新 Release 版本。
 * 不依赖 latest.yml，作为"检查更新"按钮的可靠入口；
 * 发现有新版本时同步触发 electron-updater 检查，为下载/安装做准备。
 */
export async function checkLatestVersionFromGitHub(): Promise<LatestVersionCheckResult> {
  const currentVersion = app.getVersion()
  try {
    const res = await net.fetch(GITHUB_LATEST_RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'VoxVer-Launcher' }
    })
    if (!res.ok) throw new Error(`GitHub API HTTP ${res.status}`)
    const data = (await res.json()) as { tag_name?: unknown; body?: unknown }
    const tag = typeof data.tag_name === 'string' ? data.tag_name : ''
    const latestVersion = parseVersionFromTag(tag)
    if (!latestVersion) throw new Error(`无法解析版本号: ${tag}`)
    const notes = typeof data.body === 'string' && data.body.trim() ? data.body : null
    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0
    log.info(
      `[updater.checkVersion] current=${currentVersion} latest=${latestVersion} hasUpdate=${hasUpdate}`
    )
    if (hasUpdate) {
      // 双链路：API 对比结论写入共享状态并广播（供渲染端各页面感知），
      // 同时触发 electron-updater 检查，为下载/安装链路准备元数据
      apiUpdateDetectedVersion = latestVersion
      currentStatus.checking = false
      currentStatus.available = true
      currentStatus.error = null
      currentStatus.version = latestVersion
      if (notes) currentStatus.releaseNotes = notes
      broadcastStatus()
      checkForUpdates()
    }
    return { currentVersion, latestVersion, hasUpdate, notes, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error('[updater.checkVersion] Failed:', message)
    return { currentVersion, latestVersion: null, hasUpdate: false, notes: null, error: message }
  }
}

export interface UpdateStatus {
  checking: boolean
  available: boolean
  downloading: boolean
  downloadProgress: number
  /** 已下载字节数 */
  transferred: number
  /** 总字节数 */
  total: number
  /** 下载速度（字节/秒） */
  bytesPerSecond: number
  downloaded: boolean
  error: string | null
  version: string | null
  releaseNotes: string | null
}

let mainWindow: BrowserWindow | null = null
let cachedUpdateCheckResult: Awaited<ReturnType<typeof autoUpdater.checkForUpdates>> | null = null
let updateChannel: 'stable' | 'beta' = 'stable'
let autoCheckUpdate = true
/** GitHub API 链路检测到的更新版本（优先级高于 electron-updater 的 latest.yml 结论） */
let apiUpdateDetectedVersion: string | null = null
/** 下载取消令牌（取消下载用） */
let downloadToken: CancellationToken | null = null
const currentStatus: UpdateStatus = {
  checking: false,
  available: false,
  downloading: false,
  downloadProgress: 0,
  transferred: 0,
  total: 0,
  bytesPerSecond: 0,
  downloaded: false,
  error: null,
  version: null,
  releaseNotes: null
}

export function initAutoUpdater(window: BrowserWindow): void {
  mainWindow = window

  if (process.env.NODE_ENV === 'development') {
    autoUpdater.allowPrerelease = false
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false
    log.info('[updater.init] Development mode - auto-updater disabled')
    return
  }

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.allowDowngrade = false
  autoUpdater.allowPrerelease = updateChannel === 'beta'
  // 不设置 channel，使用默认 latest.yml / beta.yml

  autoUpdater.on('checking-for-update', () => {
    currentStatus.checking = true
    currentStatus.error = null
    broadcastStatus()
    log.info('[updater] Checking for update...')
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    currentStatus.checking = false
    currentStatus.error = null
    currentStatus.available = true
    currentStatus.version = info.version
    currentStatus.releaseNotes =
      info.releaseNotes != null
        ? typeof info.releaseNotes === 'string'
          ? info.releaseNotes
          : JSON.stringify(info.releaseNotes)
        : null
    broadcastStatus()
    log.info('[updater] Update available:', info.version)
    const files = info.files
    log.info(
      '[updater] Update files:',
      files ? files.map((f) => f.url).join(', ') : 'N/A'
    )
  })

  autoUpdater.on('update-not-available', () => {
    // API 链路已确认有更新时，以 API 结论为准（latest.yml 可能滞后）
    if (apiUpdateDetectedVersion) {
      currentStatus.checking = false
      currentStatus.available = true
      currentStatus.version = apiUpdateDetectedVersion
      broadcastStatus()
      log.info('[updater] latest.yml stale, keep API-detected version:', apiUpdateDetectedVersion)
      return
    }
    currentStatus.checking = false
    currentStatus.available = false
    broadcastStatus()
    log.info('[updater] Update not available')
  })

  autoUpdater.on('download-progress', (progressObj) => {
    currentStatus.downloading = true
    currentStatus.downloadProgress = progressObj.percent
    currentStatus.transferred = progressObj.transferred
    currentStatus.total = progressObj.total
    currentStatus.bytesPerSecond = progressObj.bytesPerSecond
    broadcastStatus()
    log.info(`[updater] Download progress: ${progressObj.percent.toFixed(1)}%`)
  })

  autoUpdater.on('update-downloaded', () => {
    currentStatus.downloading = false
    currentStatus.error = null
    currentStatus.downloaded = true
    currentStatus.downloadProgress = 100
    broadcastStatus()
    log.info('[updater] Update downloaded')
  })

  autoUpdater.on('error', (err) => {
    currentStatus.checking = false
    currentStatus.downloading = false
    currentStatus.error = err.message
    broadcastStatus()
    log.error('[updater] Error:', err.message)
  })

  log.info('[updater.init] Auto-updater initialized')
}

function broadcastStatus(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', currentStatus)
  }
}

export function checkForUpdates(): void {
  if (process.env.NODE_ENV === 'development') {
    log.info('[updater.check] Development mode - skip check')
    return
  }
  log.info('[updater.check] Starting update check...')
  autoUpdater
    .checkForUpdates()
    .then((result) => {
      cachedUpdateCheckResult = result
      log.info(
        '[updater.check] Check completed, result:',
        result ? 'got update info' : 'no update info'
      )
      if (result && result.updateInfo) {
        log.info('[updater.check] Update version:', result.updateInfo.version)
      }
    })
    .catch((err) => {
      log.error('[updater.check] Failed:', err.message)
    })
}

export function startDownload(): void {
  if (!currentStatus.available) {
    log.warn('[updater.download] Cannot download - no update available, available flag is false')
    return
  }
  currentStatus.downloading = true
  currentStatus.downloadProgress = 0
  currentStatus.transferred = 0
  currentStatus.total = 0
  currentStatus.bytesPerSecond = 0
  currentStatus.error = null
  broadcastStatus()
  log.info('[updater.download] Initiating download, version:', currentStatus.version)
  log.info('[updater.download] Has cached result:', cachedUpdateCheckResult ? 'yes' : 'no')

  downloadToken = new CancellationToken()
  // 双链路衔接：元数据未就绪时先补一次检查，再启动下载
  const ready = cachedUpdateCheckResult
    ? Promise.resolve(cachedUpdateCheckResult)
    : autoUpdater
        .checkForUpdates()
        .then((result) => {
          cachedUpdateCheckResult = result
          return result
        })

  ready
    .then(() => autoUpdater.downloadUpdate(downloadToken ?? undefined))
    .then((result) => {
      log.info('[updater.download] Download started, result type:', typeof result)
    })
    .catch((err: unknown) => {
      currentStatus.downloading = false
      if (downloadToken?.cancelled) {
        // 用户取消：不作为错误呈现
        currentStatus.downloadProgress = 0
        currentStatus.transferred = 0
        currentStatus.total = 0
        currentStatus.bytesPerSecond = 0
        downloadToken = null
        broadcastStatus()
        log.info('[updater.download] Download cancelled by user')
        return
      }
      currentStatus.error = err instanceof Error ? err.message : String(err)
      downloadToken = null
      broadcastStatus()
      log.error(
        '[updater.download] Failed to start download:',
        err instanceof Error ? err.message : err
      )
    })
}

/** 取消当前下载（electron-updater 通过 CancellationToken 取消） */
export function cancelDownload(): void {
  if (!downloadToken) {
    log.warn('[updater.cancel] No download in progress')
    return
  }
  log.info('[updater.cancel] Cancelling download...')
  downloadToken.cancel()
}

export function installUpdate(): void {
  if (!currentStatus.downloaded) {
    log.warn('[updater.install] No update downloaded')
    return
  }
  log.info('[updater.install] Installing update...')
  autoUpdater.quitAndInstall()
}

export function getUpdateStatus(): UpdateStatus {
  return { ...currentStatus }
}

export function setUpdateChannel(channel: string): void {
  updateChannel = channel as 'stable' | 'beta'
  autoUpdater.allowPrerelease = channel === 'beta'
  try {
    const db = require('./database').getDatabase()
    db.prepare("INSERT OR REPLACE INTO configs (key, value) VALUES ('update_channel', ?)").run(channel)
  } catch { /* ignore - may not have DB access yet */ }
  log.info('[updater] Channel set to:', channel)
}

export function setAutoCheckUpdate(enabled: boolean): void {
  autoCheckUpdate = enabled
  try {
    const db = require('./database').getDatabase()
    db.prepare("INSERT OR REPLACE INTO configs (key, value) VALUES ('auto_check_update', ?)").run(String(enabled))
  } catch { /* ignore */ }
  log.info('[updater] Auto check update:', enabled)
}

export function getUpdateConfig(): { channel: string; autoCheck: boolean } {
  return { channel: updateChannel, autoCheck: autoCheckUpdate }
}

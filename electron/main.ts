/**
 * VoxVer Launcher 主进程入口
 */

// ========== Squirrel.Windows 安装器事件处理（R-1 修复）==========
// 在 Electron 应用启动前处理 Windows Squirrel 安装/更新/卸载事件
// 确保快捷方式创建、注册表清理、卸载流程正常工作
if (process.platform === 'win32') {
  try {
    const squirrelStartup = require('electron-squirrel-startup')
    if (squirrelStartup) {
      // Squirrel 事件已处理，退出应用避免重复执行
      process.exit(0)
    }
  } catch {
    // electron-squirrel-startup 未安装或不需要处理，继续正常启动
  }
}

import { app, BrowserWindow, shell, nativeImage, type NativeImage, ipcMain } from 'electron'
import { execSync } from 'child_process'

if (process.platform === 'win32') {
  try {
    process.env.LANG = 'zh_CN.UTF-8'
    process.env.LC_ALL = 'zh_CN.UTF-8'
    process.env.NODE_ENV === 'development' && execSync('chcp 65001 > nul', { stdio: 'ignore' })
  } catch {}
}
import { join } from 'path'
import { existsSync, mkdirSync, appendFileSync } from 'fs'
import { initDatabase } from './services/database'
import { getConfig, getSecureConfig } from './services/config'
import { VersionsService } from './services/versions'
import { ModLoaderService } from './services/modloader.service'
import { DownloadService } from './services/download.service'
import { initializeContentServiceAsync } from './services/content.ipc'
import {
  registerAllIpcHandlers,
  updateMainWindowRefs,
  type IpcRegistrationResult
} from './ipc'
import { CrashService } from './services/crash.service'
import { ModService } from './services/mod.service'
import { initAutoUpdater, checkForUpdates } from './services/updater.service'
import { cleanupShareOnExit } from './ipc/share.ipc'
import {
  setHotkeyActionCallback,
  registerAllEnabledHotkeys,
  cleanupHotkeys
} from './services/hotkey.service'
import { logger } from './utils/logger'

const log = logger.child('Main')

/** 判断是否为开发环境 */
function isDev(): boolean {
  return process.env.NODE_ENV === 'development' || !app.isPackaged
}

// 加载 .env（开发/未打包时均需；打包后 .env 不存在则静默跳过）
try { require('dotenv').config() } catch { /* 无 .env 文件或 dotenv 未安装 */ }

// ── 服务实例（模块级，供 IPC 使用）──────────────────────────
let versionsService: VersionsService
let modLoaderService: ModLoaderService
let crashService: CrashService
let modService: ModService

// 文件日志用于调试（追加模式）
let logFile: string
function writeLog(...args: unknown[]) {
  if (!logFile) {
    log.error('[MAIN NO_LOG]', ...args)
    return
  }
  const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
  const line = `[${new Date().toISOString()}] ${msg}\n`
  try {
    appendFileSync(logFile, line)
  } catch {}
  log.error('[MAIN]', msg)
}

writeLog('>>> main.ts TOP OF FILE')

// 自定义协议处理（分享功能）
const PROTOCOL_NAME = 'voxver'
let pendingShareCode: string | null = null

function parseShareUrl(url: string): string | null {
  try {
    const match = url.match(/^voxver:\/\/share:([0-9a-zA-Z]{6,})/i)
    if (match) {
      return match[1]
    }
    return null
  } catch {
    return null
  }
}

// Windows：处理协议唤起（单实例模式）
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    // 第二个实例启动时，解析命令行中的协议 URL
    for (const arg of commandLine) {
      const code = parseShareUrl(arg)
      if (code) {
        pendingShareCode = code
        const windows = BrowserWindow.getAllWindows()
        if (windows.length > 0) {
          const win = windows[0]
          win.show()
          win.focus()
          // 通知渲染进程打开分享导入弹窗
          win.webContents.once('did-finish-load', () => {
            win.webContents.send('share:protocol-invoke', { shareCode: code })
          })
          if (win.webContents.isLoading()) {
            // 等待加载完成后再发送
          } else {
            win.webContents.send('share:protocol-invoke', { shareCode: code })
          }
        }
        break
      }
    }
  })
}

// 全局错误处理
process.on('uncaughtException', (error) => {
  writeLog('[FATAL] Uncaught exception:', error.message, error.stack)
  app.exit(1)
})

process.on('unhandledRejection', (reason) => {
  writeLog('[FATAL] Unhandled rejection:', reason)
})

function createWindow(): BrowserWindow {
  // dev 模式使用 out/ 目录，生产用 resourcesPath
  const resPath =
    process.env.NODE_ENV === 'development'
      ? join(__dirname, '..', 'renderer')
      : process.resourcesPath
  writeLog('createWindow resourcesPath:', resPath)

  // 加载图标 - 根据环境使用不同路径
  let appIcon: NativeImage | undefined
  const iconPathDev = join(__dirname, '..', '..', 'resources', 'icons', 'icon.ico')
  const iconPathProd = join(resPath, 'icons', 'icon.ico')
  if (existsSync(iconPathDev)) {
    appIcon = nativeImage.createFromPath(iconPathDev)
    writeLog('Using dev icon path:', iconPathDev)
  } else if (existsSync(iconPathProd)) {
    appIcon = nativeImage.createFromPath(iconPathProd)
    writeLog('Using prod icon path:', iconPathProd)
  } else {
    writeLog('Icon file not found')
  }

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 960,
    minHeight: 640,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    title: 'VoxVer Launcher',
    backgroundColor: '#0D0D1A',
    icon: appIcon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // DevTools 默认不自动打开，用户可通过 F12 快捷键手动打开

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 在窗口中打开外部链接
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 压制开发模式下 Electron 的 CSP 安全警告（打包后不会出现）
  mainWindow.webContents.on('console-message', (_event, _level, message) => {
    if (message.includes('Electron Security Warning')) {
      _event.preventDefault()
    }
  })

  // 渲染进程崩溃时记录错误
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    writeLog(`[FATAL] Render process gone: reason=${details.reason}`)
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (process.env.NODE_ENV === 'development' && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    // dev: resPath = out/renderer/ (直接是渲染文件根目录)
    // prod: resPath = resources/，渲染文件在 resources/renderer/
    const htmlPath =
      process.env.NODE_ENV === 'development'
        ? join(resPath, 'index.html')
        : join(resPath, 'renderer', 'index.html')
    mainWindow.loadFile(htmlPath)
  }

  return mainWindow
}

// ========== IPC Handler 注册（拆分到 electron/ipc/ 模块）==========
function registerIpcHandlers(mainWindow: BrowserWindow): IpcRegistrationResult {
  return registerAllIpcHandlers(mainWindow, {
    versionsService,
    modLoaderService,
    crashService,
    modService
  })
}

app.whenReady().then(() => {
  logFile = join(app.getPath('userData'), 'voxver-main.log')
  writeLog('>>> INSIDE whenReady callback')

  // 注册自定义协议
  if (process.platform === 'win32') {
    app.setAppUserModelId(isDev() ? process.execPath : 'com.voxver.launcher')
    app.setAsDefaultProtocolClient(PROTOCOL_NAME)
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL_NAME)
  }
  writeLog('Custom protocol registered:', PROTOCOL_NAME)

  // 处理启动时的协议参数
  for (const arg of process.argv) {
    const code = parseShareUrl(arg)
    if (code) {
      pendingShareCode = code
      writeLog('Found share code in startup args:', code)
      break
    }
  }

  app.on('browser-window-created', (_, window) => {
    window.webContents.on('before-input-event', (_e, input) => {
      if (input.type === 'keyDown' && input.key === 'F12') {
        if (window.webContents.isDevToolsOpened()) {
          window.webContents.closeDevTools()
        } else {
          window.webContents.openDevTools({ mode: 'undocked' })
        }
      }
    })
  })

  // ========== 快速路径：立即创建窗口，减少白屏时间 ==========
  const win = createWindow()
  writeLog('Window created, renderer loading started')

  // ========== 异步并行初始化服务 ==========
  const initStartTime = Date.now()

  // 阶段1：关键服务（数据库 + 核心服务）
  const db = initDatabase()
  versionsService = new VersionsService(db)
  modLoaderService = new ModLoaderService()
  crashService = new CrashService()
  modService = new ModService()

  // 阶段2：非关键服务并行初始化（不阻塞窗口显示）
  Promise.all([
    (async () => {
      const downloadService = new DownloadService(db)
      const cfApiKey = getSecureConfig('curseforge_api_key') || process.env.CURSEFORGE_API_KEY || ''
      if (!cfApiKey) {
        log.warn('[Content Service] CurseForge API Key not configured, some features may be limited')
      }
      await initializeContentServiceAsync(cfApiKey, 'VoxVer-Launcher/1.0', downloadService)
      log.info('[Init] Content service initialized')
    })(),
    (async () => {
      try {
        setHotkeyActionCallback((action) => {
          if (action === 'launch-game') {
            log.info('[Hotkey] 触发全局快捷键：启动游戏')
            if (win && !win.isDestroyed()) {
              win.webContents.send('hotkey:trigger', { action: 'launch-game' })
            }
          } else if (action === 'toggle-window') {
            log.info('[Hotkey] 触发全局快捷键：切换窗口显示')
            if (win && !win.isDestroyed()) {
              if (win.isVisible()) win.hide()
              else win.show()
            }
          }
        })
        registerAllEnabledHotkeys()
        log.info('[Init] Hotkey service initialized')
      } catch (e: unknown) {
        log.warn('[Init] Hotkey service init failed:', (e as Error).message)
      }
    })(),
    (async () => {
      initAutoUpdater(win)
      log.info('[Init] Auto updater initialized')
    })()
  ]).then(() => {
    log.info(`[Init] All services initialized in ${Date.now() - initStartTime}ms`)
  }).catch((err) => {
    log.error('[Init] Service initialization failed:', err)
  })

  // ========== 注册 IPC 处理器 ==========
  try {
    const ipcResult = registerIpcHandlers(win)
    if (ipcResult.failed.length === 0) {
      writeLog(
        `>>> IPC handlers registered OK (${ipcResult.registered}/${ipcResult.total} modules)`
      )
      log.info(
        `[IPC] All registered (${ipcResult.registered}/${ipcResult.total} modules)`
      )
    } else {
      const summary = ipcResult.failed
        .map((f) => `${f.module}(${f.error})`)
        .join('; ')
      writeLog(
        `[IPC] >>> Handlers PARTIAL FAILED: ${ipcResult.registered}/${ipcResult.total} — failed: [${summary}]`
      )
      log.error(
        `[IPC] Handlers PARTIAL FAILED: ${ipcResult.registered}/${ipcResult.total} modules`,
        { failed: ipcResult.failed }
      )
    }
  } catch (err: unknown) {
    writeLog(
      '[IPC] >>> Handlers registration THROWN:',
      (err as Error).message,
      (err as Error).stack
    )
    log.error('[IPC] Handlers registration THROWN:', err)
  }

  // ========== 延迟任务（挂到 did-finish-load，不依赖固定延迟）==========
  if (pendingShareCode) {
    win.webContents.once('did-finish-load', () => {
      win.webContents.send('share:protocol-invoke', { shareCode: pendingShareCode })
      writeLog('Sent pending share code to renderer:', pendingShareCode)
      pendingShareCode = null
    })
  }

  win.webContents.once('did-finish-load', async () => {
    // xuid 回填：在渲染端完全就绪后执行
    try {
      if (win && !win.isDestroyed()) {
        const result = await win.webContents.executeJavaScript(`
          window.electronAPI?.account?.backfillXuid?.()
            .then(r => JSON.stringify(r))
            .catch(e => JSON.stringify({ok:false, error: e.message}))
        `)
        writeLog('[startup] xuid 回填结果:', result)
      }
    } catch (e: unknown) {
      writeLog('[startup] xuid 回填失败:', (e as Error).message)
    }

    // 自动更新检测：渲染端就绪后 2s 触发，避免抢占首屏资源
    setTimeout(() => {
      if (win && !win.isDestroyed()) checkForUpdates()
    }, 2000)
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const newWin = createWindow()
      updateMainWindowRefs(newWin)
    }
  })
})

app.on('window-all-closed', () => {
  // 清理分享会话和临时文件
  cleanupShareOnExit()
  // 清理全局快捷键
  cleanupHotkeys()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  cleanupShareOnExit()
  cleanupHotkeys()
})

// 打印已注册的 handlers（调试用）
app.on('web-contents-created', (_, contents) => {
  contents.on('did-finish-load', () => {
    writeLog(
      'Renderer loaded, ipcMain handlers:',
      Object.keys(
        (require('electron') as { ipcMain?: { _events?: Record<string, unknown> } }).ipcMain
          ?._events || {}
      )
    )
  })
})

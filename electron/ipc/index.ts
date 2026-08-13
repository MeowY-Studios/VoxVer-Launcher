/**
 * IPC Handler 统一注册入口
 *
 * 将 main.ts 中内联的 IPC handler 拆分为独立模块
 * 每个模块负责一类功能的 channel 注册
 */
import type { BrowserWindow } from 'electron'
import { registerWindowHandlers } from './window.ipc'
import { registerConfigHandlers } from './config.ipc'
import { registerInstanceHandlers } from './instance.ipc'
import { registerAccountHandlers } from './account.ipc'
import { registerDownloadHandlers } from './download.ipc'
import { registerGameHandlers, setGameDependencies } from './game.ipc'
import { registerJavaHandlers } from './java.ipc'
import { registerContentHandlers } from './content.ipc'
import { registerDialogHandlers } from './dialog.ipc'
import { registerCrashIpcHandlers } from './crash.ipc'
import { registerModIpcHandlers } from './mod.ipc'
import { registerModLoaderHandlers } from './modloader.ipc'
import { registerNotificationHandlers } from './notification.ipc'
import { updateModLoaderMainWindow } from './modloader.ipc'
import { registerShareHandlers, setShareMainWindow } from './share.ipc'
import { registerModpackHandlers } from './modpack.ipc'
import { registerHotkeyHandlers } from './hotkey.ipc'
import { registerThemeHandlers } from './theme.ipc'
import { registerBackupHandlers } from './backup.ipc'
import { registerExternalLauncherHandlers } from './external-launcher.ipc'
import { registerScreenshotHandlers } from './screenshot.ipc'
import { registerPerfMonitorHandlers } from './perf-monitor.ipc'
import { registerUpdaterHandlers } from './updater.ipc'
import { registerLoggerHandlers } from './logger.ipc'
import { logger } from '../utils/logger'
import type { VersionsService } from '../services/versions'
import type { ModService } from '../services/mod.service'
import type { CrashService } from '../services/crash.service'
import type { ModLoaderService } from '../services/modloader.service'
const log = logger.child('IPC')

export interface IpcRegistrationResult {
  total: number
  registered: number
  failed: { module: string; error: string }[]
}

/**
 * 注册所有 IPC 处理器
 * @param mainWindow - 主窗口实例
 * @param deps - 游戏相关依赖（版本服务、ModLoader 服务）
 * @returns 注册结果汇总（总模块数、成功数、失败明细），供调用方做总览日志
 */
export function registerAllIpcHandlers(
  mainWindow: BrowserWindow,
  deps?: {
    versionsService?: VersionsService
    modLoaderService?: ModLoaderService
    crashService?: CrashService
    modService?: ModService
  }
): IpcRegistrationResult {
  const failed: { module: string; error: string }[] = []
  let registered = 0
  let total = 0

  const run = (moduleName: string, fn: () => void): void => {
    total++
    try {
      fn()
      registered++
      log.info(`[IPC] ${moduleName} handlers registered`)
    } catch (e: unknown) {
      const msg = (e as Error).message || String(e)
      failed.push({ module: moduleName, error: msg })
      log.error(`[IPC] ${moduleName} handlers FAILED:`, msg)
    }
  }

  // 注入游戏依赖
  if (deps) {
    try {
      setGameDependencies(
        deps.versionsService as unknown as Parameters<typeof setGameDependencies>[0],
        deps.modLoaderService as unknown as Record<string, unknown>
      )
    } catch (e: unknown) {
      log.error('[IPC] setGameDependencies FAILED:', (e as Error).message)
    }
  }

  // 按模块注册（每个单独 try-catch，一个失败不影响后面的）
  run('window', () => registerWindowHandlers(mainWindow))
  run('config', () => registerConfigHandlers())
  run('instance', () => registerInstanceHandlers(deps?.modService))
  run('account', () => registerAccountHandlers())
  run('download', () => registerDownloadHandlers())
  run('game', () => registerGameHandlers(mainWindow))
  run('java', () => registerJavaHandlers())
  run('content', () => registerContentHandlers())
  run('dialog', () => registerDialogHandlers(mainWindow))

  // 崩溃分析
  if (deps?.crashService) {
    run('crash', () => registerCrashIpcHandlers(deps.crashService!))
  }

  // Mod 管理
  if (deps?.modService) {
    run('mod', () => registerModIpcHandlers(deps.modService!))
  }

  // ModLoader 安装（进度推送）
  if (deps?.modLoaderService) {
    run('modloader', () => registerModLoaderHandlers(mainWindow, deps.modLoaderService!))
  }

  // 通知系统（关键：必须注册上）
  run('notification', () => registerNotificationHandlers())

  // 自动更新
  run('updater', () => registerUpdaterHandlers())

  // 分享功能
  run('share', () => {
    setShareMainWindow(mainWindow)
    registerShareHandlers()
  })

  // 整合包（mrpack）
  run('modpack', () => registerModpackHandlers())

  // 全局快捷键
  run('hotkey', () => registerHotkeyHandlers())

  // 主题与背景
  run('theme', () => registerThemeHandlers())

  // 数据备份与迁移
  run('backup', () => registerBackupHandlers())

  // 外部启动器数据导入（HMCL/PCL2）
  run('external-launcher', () => registerExternalLauncherHandlers())

  // 游戏截图
  run('screenshot', () => registerScreenshotHandlers())

  // 性能监控
  run('perf-monitor', () => registerPerfMonitorHandlers())

  // 日志系统（诊断导出 + 日志级别控制）
  run('logger', () => registerLoggerHandlers())

  return { total, registered, failed }
}

/**
 * 仅更新各 IPC 模块中的 mainWindow 引用（不重复注册 handlers）
 * 供 app.on('activate') 重建窗口后调用
 */
export function updateMainWindowRefs(win: BrowserWindow): void {
  // 仅更新已知存在的 mainWindow 引用
  try {
    updateModLoaderMainWindow(win)
  } catch (e: unknown) {
    log.error('[IPC] update modloader win failed:', (e as Error).message)
  }
  // 其他模块的 update 函数按需在此补充
}

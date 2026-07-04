/**
 * 性能监控 IPC 通道
 */
import { ipcMain, BrowserWindow } from 'electron'
import { startMonitor, stopMonitor, getMonitorStatus, type PerfSnapshot } from '../services/perf-monitor.service'
import { logger } from '../utils/logger'

const log = logger.child('PerfMonitorIPC')

let currentWindow: BrowserWindow | null = null

function getWindow(): BrowserWindow | null {
  if (currentWindow && !currentWindow.isDestroyed()) return currentWindow
  const windows = BrowserWindow.getAllWindows()
  return windows[0] || null
}

/**
 * 推送性能数据到渲染进程
 */
function pushSnapshot(snap: PerfSnapshot): void {
  const win = getWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send('perf-monitor:snapshot', snap)
  }
}

export function registerPerfMonitorHandlers(): void {
  ipcMain.handle(
    'perf-monitor:start',
    async (_event, pid: number): Promise<{ ok: boolean }> => {
      try {
        startMonitor(pid, pushSnapshot)
        return { ok: true }
      } catch (e: any) {
        log.error('start error:', e.message)
        return { ok: false }
      }
    }
  )

  ipcMain.handle(
    'perf-monitor:stop',
    async (): Promise<{ ok: boolean }> => {
      stopMonitor()
      return { ok: true }
    }
  )

  ipcMain.handle(
    'perf-monitor:status',
    async (): Promise<{ active: boolean; pid: number | null }> => {
      return getMonitorStatus()
    }
  )

  log.info('perf-monitor handlers registered')
}

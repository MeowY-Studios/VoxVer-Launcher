/**
 * 日志系统 IPC Handlers
 * 提供诊断日志导出和日志级别控制
 */
import { ipcMain } from 'electron'
import { setLevel, exportDiagnostics, type LogLevel } from '../utils/logger'

export function registerLoggerHandlers(): void {
  // 设置日志级别
  ipcMain.handle('logger:set-level', async (_event, level: LogLevel) => {
    try {
      setLevel(level)
      return { ok: true }
    } catch (error: any) {
      return { ok: false, error: error.message }
    }
  })

  // 导出诊断日志
  ipcMain.handle('logger:export-diagnostics', async () => {
    try {
      const result = await exportDiagnostics()
      return result
    } catch (error: any) {
      return { ok: false, error: error.message || '导出诊断日志失败' }
    }
  })
}

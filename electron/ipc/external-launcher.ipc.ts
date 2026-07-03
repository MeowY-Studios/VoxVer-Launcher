/**
 * 外部启动器数据导入 IPC
 */
import { ipcMain } from 'electron'
import { detectExternalLaunchers, scanGameDir } from '../services/external-launcher.service'
import { logger } from '../utils/logger'
const log = logger.child('ExternalLauncherIPC')

export function registerExternalLauncherHandlers(): void {
  ipcMain.handle(
    'external-launcher:detect',
    async (): Promise<{ success: boolean; data: unknown[] }> => {
      try {
        const launchers = detectExternalLaunchers()
        return { success: true, data: launchers }
      } catch (e: any) {
        log.error('[IPC] detect error:', e?.message || e)
        return { success: false, data: [], error: e?.message }
      }
    }
  )

  ipcMain.handle(
    'external-launcher:scan-dir',
    async (_event, gameDir: string): Promise<{ success: boolean; data: unknown }> => {
      try {
        const info = scanGameDir(gameDir)
        return { success: !!info, data: info }
      } catch (e: any) {
        return { success: false, error: e?.message }
      }
    }
  )
}

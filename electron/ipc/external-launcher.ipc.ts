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
    async (): Promise<{ success: boolean; data: unknown[]; error?: string }> => {
      try {
        const launchers = detectExternalLaunchers()
        return { success: true, data: launchers }
      } catch (e: unknown) {
        log.error('[IPC] detect error:', (e as Error)?.message || String(e))
        return { success: false, data: [], error: (e as Error)?.message }
      }
    }
  )

  ipcMain.handle(
    'external-launcher:scan-dir',
    async (_event, gameDir: string): Promise<{ success: boolean; data?: unknown; error?: string }> => {
      try {
        const info = scanGameDir(gameDir)
        return { success: !!info, data: info }
      } catch (e: unknown) {
        return { success: false, error: (e as Error)?.message }
      }
    }
  )
}

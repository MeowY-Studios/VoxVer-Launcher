import { ipcMain } from 'electron'
import {
  checkForUpdates,
  startDownload,
  installUpdate,
  getUpdateStatus,
  setUpdateChannel,
  setAutoCheckUpdate,
  getUpdateConfig,
  type UpdateStatus
} from '../services/updater.service'

export function registerUpdaterHandlers(): void {
  ipcMain.handle('updater:check', async () => {
    checkForUpdates()
    return { success: true }
  })

  ipcMain.handle('updater:download', async () => {
    startDownload()
    return { success: true }
  })

  ipcMain.handle('updater:install', async () => {
    installUpdate()
    return { success: true }
  })

  ipcMain.handle('updater:status', async (): Promise<{ success: boolean; data: UpdateStatus }> => {
    return { success: true, data: getUpdateStatus() }
  })

  ipcMain.handle('updater:get-config', async () => {
    return getUpdateConfig()
  })

  ipcMain.handle('updater:set-channel', async (_event, channel: string) => {
    setUpdateChannel(channel)
    return { success: true }
  })

  ipcMain.handle('updater:set-auto-check', async (_event, enabled: boolean) => {
    setAutoCheckUpdate(enabled)
    return { success: true }
  })
}

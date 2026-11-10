/**
 * 通知系统 IPC Handlers
 */
import { ipcMain, BrowserWindow } from 'electron'
import * as notification from '../services/notification.service'

export function registerNotificationHandlers(): void {
  // 推送通知到渲染进程
  notification.onNotify((item) => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('notification:new', item)
      }
    }
  })

  // 同 key 通知的原地更新（下载进度等）
  notification.onUpdated((item) => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('notification:updated', item)
      }
    }
  })

  ipcMain.handle('notification:get-history', async (_event, limit?: number) => {
    try {
      const history = notification.getHistory(limit)
      return { ok: true, data: history }
    } catch (error: unknown) {
      return { ok: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('notification:mark-read', async (_event, id: string) => {
    try {
      notification.markAsRead(id)
      return { ok: true }
    } catch (error: unknown) {
      return { ok: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('notification:mark-all-read', async () => {
    try {
      notification.markAllAsRead()
      return { ok: true }
    } catch (error: unknown) {
      return { ok: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('notification:clear', async () => {
    try {
      notification.clearHistory()
      return { ok: true }
    } catch (error: unknown) {
      return { ok: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('notification:get-unread-count', async () => {
    try {
      return { ok: true, data: notification.getUnreadCount() }
    } catch (error: unknown) {
      return { ok: false, error: (error as Error).message }
    }
  })

  // 前端发送通知（替换 alert()）
  ipcMain.handle(
    'notification:send',
    async (
      _event,
      payload: {
        title: string
        body?: string
        type?: 'info' | 'success' | 'warning' | 'error'
        source?: 'system' | 'download' | 'official'
        key?: string
        progress?: number
        status?: 'info' | 'running' | 'success' | 'warning' | 'error'
        route?: string
        pinned?: boolean
      }
    ) => {
      try {
        const {
          title,
          body = '',
          type = 'info',
          source,
          key,
          progress,
          status,
          route,
          pinned
        } = payload
        notification.notify({ title, body, type, source, key, progress, status, route, pinned })
        return { ok: true }
      } catch (error: unknown) {
        return { ok: false, error: (error as Error).message }
      }
    }
  )
}

/**
 * 游戏截图 IPC 通道
 */
import { ipcMain } from 'electron'
import {
  scanScreenshots,
  generateThumbnail,
  getFullImage,
  deleteScreenshot,
  renameScreenshot,
  exportScreenshot,
  copyScreenshotToClipboard,
  openScreenshot
} from '../services/screenshot.service'
import { logger } from '../utils/logger'

const log = logger.child('ScreenshotIPC')

export function registerScreenshotHandlers(): void {
  ipcMain.handle(
    'screenshot:list',
    async (_event, gameDir: string): Promise<{ ok: boolean; data: unknown[] }> => {
      try {
        const list = scanScreenshots(gameDir)
        // 生成前10张缩略图
        const preview = await Promise.all(
          list.slice(0, 10).map(async (s) => {
            const thumb = await generateThumbnail(s.filePath)
            return { ...s, thumbnail: thumb }
          })
        )
        return { ok: true, data: preview }
      } catch (e: unknown) {
        log.error('list error:', (e as Error).message)
        return { ok: false, data: [] }
      }
    }
  )

  ipcMain.handle(
    'screenshot:list-all',
    async (_event, gameDir: string): Promise<{ ok: boolean; data: unknown[] }> => {
      try {
        const list = scanScreenshots(gameDir)
        return { ok: true, data: list }
      } catch (e: unknown) {
        return { ok: false, data: [] }
      }
    }
  )

  ipcMain.handle(
    'screenshot:preview',
    async (_event, filePath: string): Promise<{ ok: boolean; dataUrl: string | null }> => {
      try {
        const dataUrl = await getFullImage(filePath)
        return { ok: !!dataUrl, dataUrl }
      } catch {
        return { ok: false, dataUrl: null }
      }
    }
  )

  ipcMain.handle(
    'screenshot:thumbnail',
    async (_event, filePath: string): Promise<{ ok: boolean; dataUrl: string | null }> => {
      try {
        const dataUrl = await generateThumbnail(filePath)
        return { ok: !!dataUrl, dataUrl }
      } catch {
        return { ok: false, dataUrl: null }
      }
    }
  )

  ipcMain.handle(
    'screenshot:delete',
    async (_event, filePath: string): Promise<{ ok: boolean }> => {
      try {
        const result = deleteScreenshot(filePath)
        return { ok: result }
      } catch {
        return { ok: false }
      }
    }
  )

  ipcMain.handle(
    'screenshot:rename',
    async (_event, opts: { filePath: string; newName: string }): Promise<{ ok: boolean; newPath: string | null }> => {
      try {
        const newPath = renameScreenshot(opts.filePath, opts.newName)
        return { ok: !!newPath, newPath }
      } catch {
        return { ok: false, newPath: null }
      }
    }
  )

  ipcMain.handle(
    'screenshot:export',
    async (_event, filePath: string): Promise<{ ok: boolean }> => {
      try {
        const result = await exportScreenshot(filePath)
        return { ok: result }
      } catch {
        return { ok: false }
      }
    }
  )

  ipcMain.handle(
    'screenshot:copy',
    async (_event, filePath: string): Promise<{ ok: boolean }> => {
      try {
        const result = copyScreenshotToClipboard(filePath)
        return { ok: result }
      } catch {
        return { ok: false }
      }
    }
  )

  ipcMain.handle(
    'screenshot:open',
    async (_event, filePath: string): Promise<void> => {
      try {
        await openScreenshot(filePath)
      } catch (e: unknown) {
        log.error('open error:', (e as Error).message)
      }
    }
  )

  log.info('screenshot handlers registered')
}

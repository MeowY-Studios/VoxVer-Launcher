/**
 * 下载管理 IPC
 */
import { ipcMain, BrowserWindow } from 'electron'
import { getContentService, waitForContentService } from '../services/content.ipc'
import { ContentPlatform } from '../services/content.service'
import type { ContentFile } from '../services/content.service'
import type { MirrorInfo } from '../types/download.types'

let progressForwarderSetup = false

/** 将 DownloadService 事件转发到渲染进程（只设置一次） */
function setupProgressForwarder(): void {
  if (progressForwarderSetup) return
  const service = getContentService()
  if (!service) return
  const ds = service.getDownloadService()

  ds.on('task:progress', (task) => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win && !win.isDestroyed()) {
      win.webContents.send('download:progress', {
        id: task.id,
        progress: task.progress,
        downloadedSize: task.downloadedSize,
        totalSize: task.totalSize,
        speed: task.speed,
        status: task.status,
        fileName: task.fileName,
        url: task.url,
        destination: task.destination
      })
    }
  })

  ds.on('task:completed', (task) => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win && !win.isDestroyed()) {
      win.webContents.send('download:completed', {
        id: task.id,
        fileName: task.fileName,
        destination: task.destination,
        url: task.url
      })
    }
  })

  ds.on('task:error', (task) => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win && !win.isDestroyed()) {
      win.webContents.send('download:error', {
        id: task.id,
        fileName: task.fileName,
        error: task.error,
        url: task.url
      })
    }
  })

  ds.on('task:started', (task) => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win && !win.isDestroyed()) {
      win.webContents.send('download:started', {
        id: task.id,
        fileName: task.fileName,
        totalSize: task.totalSize,
        url: task.url,
        destination: task.destination
      })
    }
  })

  ds.on('task:cancelled', (task) => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win && !win.isDestroyed()) {
      win.webContents.send('download:cancelled', { id: task.id, fileName: task.fileName })
    }
  })

  progressForwarderSetup = true
}

export function registerDownloadHandlers(): void {
  ipcMain.handle('download:search-mods', async (_event, params) => {
    try {
      const service = await waitForContentService()
      const result = await service.searchMods(params)
      return { success: true, data: result }
    } catch (e: unknown) {
      console.error('[IPC] search-mods error:', (e as Error)?.message || e)
      return { success: false, data: [], error: (e as Error)?.message || 'ContentService 未就绪' }
    }
  })

  ipcMain.handle('download:get-project', async (_event, projectId, platform) => {
    const service = getContentService()
    const result = await service.getProject(projectId, platform)
    return { success: true, data: result }
  })

  ipcMain.handle('download:get-files', async (_event, projectId, platform, options) => {
    const service = getContentService()
    const result = await service.getProjectFiles(projectId, platform, options)
    return { success: true, data: result }
  })

  ipcMain.handle(
    'download:file',
    async (
      _event,
      fileData: Record<string, unknown>,
      destination: string,
      options?: { useMirror?: boolean; threads?: number }
    ) => {
      try {
        const service = getContentService()
        setupProgressForwarder()

        // 将前端传来的数据转换为 ContentFile 格式
        const platform =
          (fileData.platform as ContentPlatform) ||
          (fileData.source === 'curseforge' ? ContentPlatform.CURSEFORGE : ContentPlatform.MODRINTH)

        const contentFile: ContentFile = {
          id: String(fileData.id || ''),
          platform,
          projectId: String(fileData.projectId || fileData.id || ''),
          name: String(fileData.fileName || fileData.displayName || ''),
          fileName: String(fileData.fileName || fileData.displayName || ''),
          version: '',
          size: Number(fileData.size || 0),
          downloadUrl: String(fileData.url || fileData.downloadUrl || ''),
          gameVersions: Array.isArray(fileData.gameVersions) ? fileData.gameVersions : [],
          loaders: Array.isArray(fileData.loaders) ? fileData.loaders : [],
          releaseType: (fileData.releaseType as 'release' | 'beta' | 'alpha') || 'release',
          datePublished: String(fileData.datePublished || ''),
          downloads: Number(fileData.downloads || 0)
        }

        const result = await service.downloadFile(contentFile, destination, options)
        return { success: true, data: result }
      } catch (e: unknown) {
        console.error('[IPC] download:file error:', (e as Error)?.message || e)
        return { success: false, error: (e as Error)?.message || 'Download failed' }
      }
    }
  )

  ipcMain.handle('download:cancel', async (_event, taskId) => {
    const service = getContentService()
    const downloadService = service.getDownloadService()
    setupProgressForwarder()
    const result = downloadService.cancelDownload(taskId)
    return { success: result }
  })

  ipcMain.handle('download:pause', async (_event, taskId) => {
    const service = getContentService()
    const downloadService = service.getDownloadService()
    const result = downloadService.pauseDownload(taskId)
    return { success: result }
  })

  ipcMain.handle('download:resume', async (_event, taskId) => {
    const service = getContentService()
    const downloadService = service.getDownloadService()
    const result = downloadService.resumeDownload(taskId)
    return { success: result }
  })

  ipcMain.handle('download:get-active', async () => {
    const service = getContentService()
    const downloadService = service.getDownloadService()
    setupProgressForwarder()
    const result = downloadService.getActiveDownloads()
    return { success: true, data: result }
  })

  ipcMain.handle('download:get-queue', async () => {
    const service = getContentService()
    const downloadService = service.getDownloadService()
    const result = downloadService.getDownloadQueue()
    return { success: true, data: result }
  })

  // 镜像源管理
  ipcMain.handle(
    'download:mirrors:list',
    async (): Promise<{ success: boolean; data: MirrorInfo[] }> => {
      const service = getContentService()
      const downloadService = service.getDownloadService()
      const result = downloadService.getMirrors()
      return { success: true, data: result }
    }
  )

  ipcMain.handle(
    'download:mirrors:get-current',
    async (): Promise<{ success: boolean; data: MirrorInfo }> => {
      const service = getContentService()
      const downloadService = service.getDownloadService()
      const result = downloadService.getCurrentMirror()
      return { success: true, data: result }
    }
  )

  ipcMain.handle(
    'download:mirrors:set',
    async (_event, index: number): Promise<{ success: boolean }> => {
      const service = getContentService()
      const downloadService = service.getDownloadService()
      downloadService.setMirror(index)
      return { success: true }
    }
  )

  ipcMain.handle(
    'download:mirrors:test',
    async (): Promise<{ success: boolean; data: MirrorInfo[] }> => {
      const service = getContentService()
      const downloadService = service.getDownloadService()
      const result = await downloadService.testMirrorSpeed()
      return { success: true, data: result }
    }
  )

  ipcMain.handle(
    'download:mirrors:auto-select',
    async (): Promise<{ success: boolean; data: number }> => {
      const service = getContentService()
      const downloadService = service.getDownloadService()
      const result = await downloadService.selectFastestMirror()
      return { success: true, data: result }
    }
  )

  // 下载设置 - 获取
  ipcMain.handle(
    'download:settings:get-config',
    async (): Promise<{ success: boolean; data: unknown }> => {
      const service = getContentService()
      const downloadService = service.getDownloadService()
      const result = downloadService.getConfig()
      return { success: true, data: result }
    }
  )

  // 下载设置
  ipcMain.handle(
    'download:settings:set-concurrent',
    async (_event, max: number): Promise<{ success: boolean }> => {
      const service = getContentService()
      const downloadService = service.getDownloadService()
      downloadService.setMaxConcurrent(max)
      return { success: true }
    }
  )

  ipcMain.handle(
    'download:settings:set-threads',
    async (_event, max: number): Promise<{ success: boolean }> => {
      const service = getContentService()
      const downloadService = service.getDownloadService()
      downloadService.setMaxThreadsPerFile(max)
      return { success: true }
    }
  )

  ipcMain.handle(
    'download:settings:set-speed-limit',
    async (_event, limit: number): Promise<{ success: boolean }> => {
      const service = getContentService()
      const downloadService = service.getDownloadService()
      downloadService.setSpeedLimit(limit)
      return { success: true }
    }
  )

  ipcMain.handle(
    'download:settings:set-retries',
    async (_event, max: number): Promise<{ success: boolean }> => {
      const service = getContentService()
      const downloadService = service.getDownloadService()
      downloadService.setMaxRetries(max)
      return { success: true }
    }
  )
}

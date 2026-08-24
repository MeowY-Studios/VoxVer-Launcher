/**
 * 分享功能 IPC 处理器
 *
 * 提供 P2P 实例分享的 IPC 通道：
 * - share:start-instance - 开始分享实例
 * - share:stop-share - 停止分享
 * - share:receive-instance - 接收分享的实例
 * - share:get-session - 获取会话状态
 * - share:import-received - 导入接收到的实例
 * - share:close-session - 关闭会话
 */

import { app, ipcMain, type BrowserWindow } from 'electron'
import { join } from 'path'
import { statSync } from 'fs'
import { logger } from '../utils/logger'
import {
  packInstanceForShare,
  unpackSharedInstance,
  cleanupTempShareDir,
  deletePackedInstance,
  type PackProgress,
  type UnpackProgress
} from '../services/instanceSharePack.service'
import {
  p2pShareService,
  type ShareSession,
  type TransferProgress
} from '../services/p2pShare.service'
import { createInstanceWithDir } from '../services/instance.enhanced.service'

const log = logger.child('share.ipc')

let mainWindow: BrowserWindow | null = null

export function setShareMainWindow(win: BrowserWindow): void {
  mainWindow = win
}

function sendSessionUpdate(sessionId: string, session: ShareSession): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('share:session-update', { sessionId, session })
  }
}

function sendProgressUpdate(sessionId: string, progress: TransferProgress): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('share:progress-update', {
      sessionId,
      progress: {
        transferredChunks: progress.transferredChunks,
        totalChunks: progress.totalChunks,
        bytesPerSecond: progress.bytesPerSecond,
        estimatedRemaining: progress.estimatedRemaining
      }
    })
  }
}

export function registerShareHandlers(): void {
  log.info('Registering share IPC handlers')

  ipcMain.handle('share:start-instance', async (_event, { instanceId }) => {
    try {
      log.info('Starting instance share', { instanceId })

      let lastProgress = 0
      const packed = await packInstanceForShare(instanceId, (progress: PackProgress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('share:pack-progress', {
            instanceId,
            stage: progress.stage,
            progress: progress.progress,
            currentFile: progress.currentFile
          })
        }
        lastProgress = progress.progress
      })

      const { sessionId, shareCode, peerId } = await p2pShareService.startShareSession(packed)

      p2pShareService.onStatusChange(sessionId, (session) => {
        sendSessionUpdate(sessionId, session)
      })

      p2pShareService.onProgress(sessionId, (progress) => {
        sendProgressUpdate(sessionId, progress)
      })

      log.info('Share session started', { sessionId, shareCode, peerId })

      return {
        sessionId,
        shareCode,
        peerId,
        status: 'waiting',
        progress: lastProgress
      }
    } catch (e: unknown) {
      log.error('Failed to start share', e)
      throw new Error((e as Error).message || 'Failed to start sharing')
    }
  })

  ipcMain.handle('share:stop-share', async (_event, { sessionId }) => {
    try {
      log.info('Stopping share session', { sessionId })

      const session = p2pShareService.getSession(sessionId)
      if (session?.packedInstance?.filePath) {
        deletePackedInstance(session.packedInstance.filePath)
      }

      p2pShareService.closeSession(sessionId)
    } catch (e: unknown) {
      log.error('Failed to stop share', e)
    }
  })

  ipcMain.handle('share:receive-instance', async (_event, { shareCode, senderPeerId }) => {
    try {
      log.info('Starting receive session', { shareCode })

      const { sessionId, peerId } = await p2pShareService.startReceiveSession(
        shareCode,
        senderPeerId
      )

      p2pShareService.onStatusChange(sessionId, (session) => {
        sendSessionUpdate(sessionId, session)
      })

      p2pShareService.onProgress(sessionId, (progress) => {
        sendProgressUpdate(sessionId, progress)
      })

      log.info('Receive session started', { sessionId, peerId })

      return { sessionId, peerId }
    } catch (e: unknown) {
      log.error('Failed to start receive', e)
      throw new Error((e as Error).message || 'Failed to start receiving')
    }
  })

  ipcMain.handle('share:get-session', async (_event, { sessionId }) => {
    const session = p2pShareService.getSession(sessionId)
    if (!session) return null

    const fileInfo = p2pShareService.getReceivedFileInfo(sessionId)

    return {
      sessionId: session.sessionId,
      shareCode: session.shareCode,
      type: session.type,
      status: session.status,
      transferredChunks: session.transferredChunks,
      totalChunks: session.totalChunks,
      error: session.error,
      instanceName: fileInfo?.instanceName || session.packedInstance?.instanceName,
      mcVersion: fileInfo?.mcVersion || session.packedInstance?.mcVersion,
      loaderType: fileInfo?.loaderType || session.packedInstance?.loaderType
    }
  })

  ipcMain.handle('share:import-received', async (event, { sessionId }) => {
    try {
      log.info('Importing received instance', { sessionId })

      const fileInfo = p2pShareService.getReceivedFileInfo(sessionId)
      if (!fileInfo?.filePath) {
        return { ok: false, error: 'Received file not found' }
      }

      const session = p2pShareService.getSession(sessionId)
      if (!session || session.status !== 'completed') {
        return { ok: false, error: 'Transfer not completed' }
      }

      const targetDir = app.getPath('userData')
      const instancesDir = join(targetDir, 'instances')

      // Disk space pre-check: estimate 3x the packed file size for safety
      try {
        const packedSize = statSync(fileInfo.filePath).size
        const { statfsSync } = await import('fs')
        const disk = statfsSync(instancesDir)
        const availableBytes = disk.bavail * 4096
        if (availableBytes < packedSize * 3) {
          return {
            ok: false,
            error: `Insufficient disk space. Need ~${Math.ceil((packedSize * 3) / 1024 / 1024)}MB, available ${Math.ceil(availableBytes / 1024 / 1024)}MB`
          }
        }
      } catch {
        // Skip check if statfs unavailable (e.g. Windows)
      }

      const result = await unpackSharedInstance(
        fileInfo.filePath,
        instancesDir,
        fileInfo.fileMd5,
        (progress: UnpackProgress) => {
          event.sender.send('share:unpack-progress', {
            sessionId: sessionId || '',
            progress
          })
        }
      )

      const validLoaderTypes = ['vanilla', 'forge', 'fabric', 'neoforge', 'quilt'] as const
      type LoaderType = (typeof validLoaderTypes)[number]
      const rawLoader = result.loaderType as string
      const resolvedLoader: LoaderType = validLoaderTypes.includes(rawLoader as LoaderType)
        ? (rawLoader as LoaderType)
        : 'vanilla'

      const m = result.manifest as Record<string, unknown> | undefined
      const newInstance = createInstanceWithDir({
        name: result.instanceName,
        mcVersion: result.mcVersion,
        customPath: result.gameDir,
        loaderType: resolvedLoader,
        loaderVersion: String(m?.loaderVersion ?? ''),
        javaPath: String(m?.javaPath ?? ''),
        jvmArgs: String(m?.jvmArgs ?? ''),
        minMemory: Number(m?.minMemory ?? 1024),
        maxMemory: Number(m?.maxMemory ?? 4096),
        width: Number(m?.width ?? 854),
        height: Number(m?.height ?? 480)
      })

      if (newInstance) {
        log.info('Instance imported successfully', { instanceId: newInstance.id })
        return { ok: true, instanceId: newInstance.id }
      }

      return { ok: false, error: 'Failed to create instance' }
    } catch (e: unknown) {
      log.error('Failed to import received instance', e)
      return { ok: false, error: (e as Error).message || 'Import failed' }
    }
  })

  ipcMain.handle('share:close-session', async (_event, { sessionId }) => {
    try {
      log.info('Closing session', { sessionId })
      p2pShareService.closeSession(sessionId)
    } catch (e: unknown) {
      log.error('Failed to close session', e)
    }
  })

  log.info('Share IPC handlers registered')
}

export function cleanupShareOnExit(): void {
  try {
    p2pShareService.closeAllSessions()
    cleanupTempShareDir()
  } catch (e) {
    log.warn('Cleanup on exit failed', e)
  }
}

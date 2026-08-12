/**
 * 对话框 / 路径工具 / Shell 操作 IPC
 */
import { app, ipcMain, BrowserWindow, dialog, shell } from 'electron'
import { existsSync } from 'fs'
import { promises as fsp } from 'fs'
import { join, dirname, extname, sep } from 'path'
import * as configService from '../services/config'
import { getDatabase } from '../services/database'
import { deleteInstance } from '../services/instances'
import { logger } from '../utils/logger'
const log = logger.child('Dialog-IPC')

const MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml'
}

// 配置键名
const CUSTOM_MC_PATH_KEY = 'custom_minecraft_path'

/** 获取默认 .minecraft 路径 */
function getDefaultMinecraftPath(): string {
  const home = app.getPath('home')
  const platform = process.platform
  if (platform === 'win32') return join(home, 'AppData', 'Roaming', '.minecraft')
  if (platform === 'darwin') return join(home, 'Library', 'Application Support', 'minecraft')
  return join(home, '.minecraft')
}

/** 获取 .minecraft 路径（优先自定义，其次默认） */
function getMinecraftPath(): string {
  const customPath = configService.getConfig<string>(CUSTOM_MC_PATH_KEY)
  if (customPath) {
    return customPath
  }
  return getDefaultMinecraftPath()
}

export function registerDialogHandlers(mainWindow: BrowserWindow): void {
  log.error('[IPC dialog] ===== registerDialogHandlers called =====')
  ipcMain.handle(
    'dialog:select-folder',
    async (
      _event,
      options?: {
        title?: string
      }
    ) => {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: options?.title || '选择文件夹'
      })
      if (result.canceled || result.filePaths.length === 0) return null
      return result.filePaths[0]
    }
  )

  ipcMain.handle(
    'dialog:select-file',
    async (
      _event,
      options: {
        title?: string
        filters?: Array<{ name: string; extensions: string[] }>
        defaultPath?: string
      }
    ) => {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        title: options.title || '选择文件',
        filters: options.filters || [],
        defaultPath: options.defaultPath
      })
      if (result.canceled || result.filePaths.length === 0) return null
      return result.filePaths[0]
    }
  )

  ipcMain.handle('path:minecraft', () => getMinecraftPath())
  ipcMain.handle('path:exists', (_event, p: string) => existsSync(p))
  ipcMain.handle('path:get-default', () => getDefaultMinecraftPath())

  // 自定义 .minecraft 路径
  ipcMain.handle('path:custom:get', () => {
    const val = configService.getConfig<string>(CUSTOM_MC_PATH_KEY) ?? null
    log.info('[IPC path:custom:get] 读取结果:', val)
    return val
  })
  ipcMain.handle('path:custom:set', (_event, path: string) => {
    log.info('[IPC path:custom:set] 保存路径:', path)
    configService.setConfig(CUSTOM_MC_PATH_KEY, path)
    const verify = configService.getConfig<string>(CUSTOM_MC_PATH_KEY)
    log.info('[IPC path:custom:set] 验证读取:', verify)
  })
  ipcMain.handle('path:custom:clear', () => {
    configService.deleteConfig(CUSTOM_MC_PATH_KEY)
  })

  // 获取 MCLA 安装目录（exe 所在目录）
  ipcMain.handle('path:app-path', () => {
    return dirname(app.getPath('exe'))
  })

  // 创建目录
  ipcMain.handle('path:create-dir', (_event, dirPath: string) => {
    const fs = require('fs')
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    return fs.existsSync(dirPath)
  })

  // 版本选择器的文件夹列表持久化
  const GAME_FOLDERS_KEY = 'game_folders'
  // 上次选中的文件夹
  const LAST_FOLDER_KEY = 'last_selected_folder'

  ipcMain.handle('folders:list', () => {
    return configService.getConfig<string[]>(GAME_FOLDERS_KEY) ?? []
  })
  ipcMain.handle('folders:save', (_event, folders: string[]) => {
    configService.setConfig(GAME_FOLDERS_KEY, folders)
  })
  ipcMain.handle('folders:add', (_event, path: string) => {
    const current = configService.getConfig<string[]>(GAME_FOLDERS_KEY) ?? []
    if (!current.includes(path)) {
      current.push(path)
      configService.setConfig(GAME_FOLDERS_KEY, current)
    }
    return current
  })
  ipcMain.handle('folders:remove', async (_event, folderToRemove: string) => {
    const current = configService.getConfig<string[]>(GAME_FOLDERS_KEY) ?? []
    const updated = current.filter((p) => p !== folderToRemove)

    // 1) 找出「path 落在该文件夹下」的实例 —— 仅从数据库移除 DB 记录，不触碰磁盘文件
    const norm = (p: string) => p.replace(/[\\/]+$/, '') + sep
    const prefix = norm(folderToRemove)
    const db = getDatabase()
    const allRows = db
      .prepare<[], { id: string; name: string; path: string }>('SELECT id, name, path FROM instances')
      .all()
    const affected = allRows.filter((row) => {
      // path 为空不判定为"该文件夹下的实例"，避免误删老版本未写入 path 的记录
      if (!row.path) return false
      const np = norm(row.path)
      return np.startsWith(prefix)
    })
    const dbIds = affected.map((r) => r.id)

    // 2) 直接清理 DB（不再弹 MessageBox；用户点击"移除文件夹"本身就是显式意图）
    for (const id of dbIds) {
      try {
        deleteInstance(id)
      } catch (e) {
        log.error(`[folders:remove] 删除 DB 实例失败 id=${id}:`, (e as Error).message)
      }
    }
    if (dbIds.length) {
      log.info(
        `[folders:remove] 已从数据库移除 ${dbIds.length} 个实例记录（未删除磁盘文件），folder=`,
        folderToRemove
      )
    }

    // 3) 更新 folders.list
    configService.setConfig(GAME_FOLDERS_KEY, updated)

    // 4) 同步清理「上次选中」：如果被移除路径正好是 last，则丢弃 last，避免后续继续扫到已移除的目录
    const last = configService.getConfig<string>(LAST_FOLDER_KEY)
    if (last && last === folderToRemove) {
      configService.deleteConfig(LAST_FOLDER_KEY)
    }

    return updated
  })

  ipcMain.handle('folders:last:get', () => {
    return configService.getConfig<string>(LAST_FOLDER_KEY) ?? null
  })
  ipcMain.handle('folders:last:set', (_event, path: string) => {
    configService.setConfig(LAST_FOLDER_KEY, path)
  })

  // Shell 打开文件夹（跨平台兼容）
  ipcMain.handle('shell:open-path', async (_event, absPath: string) => {
    try {
      if (!existsSync(absPath)) {
        // 目录不存在，先创建
        const fs = require('fs')
        fs.mkdirSync(absPath, { recursive: true })
      }
      await shell.openPath(absPath)
      return { ok: true }
    } catch (e: unknown) {
      return { ok: false, error: (e as Error).message }
    }
  })

  // 用系统浏览器打开外部链接
  ipcMain.handle('shell:open-external', async (_event, url: string) => {
    try {
      await shell.openExternal(url)
      return { ok: true }
    } catch (e: unknown) {
      return { ok: false, error: (e as Error).message }
    }
  })

  // 读取本地图片文件为 data URL（绕过 dev 模式 file:// 的 CORS 限制）
  ipcMain.handle('file:read-as-data-url', async (_event, filePath: string) => {
    try {
      if (!filePath || !existsSync(filePath)) return null
      const data = await fsp.readFile(filePath)
      const ext = extname(filePath).toLowerCase().slice(1)
      const mime = MIME_MAP[ext] || 'image/png'
      return `data:${mime};base64,${data.toString('base64')}`
    } catch (e: unknown) {
      log.error('[file:read-as-data-url] 读取失败:', (e as Error).message)
      return null
    }
  })
}

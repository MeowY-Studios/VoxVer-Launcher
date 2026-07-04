/**
 * 窗口控制 IPC 处理器
 */
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { execSync } from 'child_process'
import * as fsp from 'fs/promises'
import * as path from 'path'

export function registerWindowHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle('window:minimize', () => mainWindow.minimize())

  ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
    return mainWindow.isMaximized()
  })

  ipcMain.handle('window:close', () => mainWindow.close())
  ipcMain.handle('window:is-maximized', () => mainWindow.isMaximized())

  // 获取应用版本号（从 package.json）
  ipcMain.handle('app:get-version', () => app.getVersion())

  // 打开开发者工具
  ipcMain.handle('devtools:open', () => mainWindow.webContents.openDevTools())

  // 获取应用关键目录路径
  ipcMain.handle('app:get-paths', () => {
    return {
      userData: app.getPath('userData'),
      logs: app.getPath('logs'),
      temp: app.getPath('temp'),
      cache: (app.getPath as any)('cache'),
      downloads: app.getPath('downloads'),
      home: app.getPath('home')
    }
  })

  // 获取运行时版本信息
  ipcMain.handle('app:get-runtime-info', () => {
    return {
      appVersion: app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
      v8: process.versions.v8,
      platform: process.platform,
      arch: process.arch
    }
  })

  // 清除缓存
  ipcMain.handle('app:clear-cache', async () => {
    const cleared: string[] = []
    const cacheDir = (app.getPath as any)('cache')
    const tempDir = app.getPath('temp')
    const dirsToClean = [
      path.join(cacheDir, 'voxver-launcher'),
      path.join(tempDir, 'voxver-launcher')
    ]
    for (const dir of dirsToClean) {
      try {
        await fsp.rm(dir, { recursive: true, force: true })
        cleared.push(dir)
      } catch {
        // 目录可能不存在，忽略
      }
    }
    // 清除 webContents 缓存
    await mainWindow.webContents.session.clearCache()
    cleared.push('session-cache')
    return cleared
  })

  // 重置启动器设置（清除 localStorage 相关的配置文件）
  ipcMain.handle('app:reset-settings', async () => {
    const configDir = path.join(app.getPath('userData'), 'config')
    try {
      await fsp.rm(configDir, { recursive: true, force: true })
      return true
    } catch {
      return false
    }
  })

  // 检测是否在受保护目录（需要管理员权限才能写入）
  ipcMain.handle('app:check-permissions', async () => {
    const exePath = app.getPath('exe')
    const protectedDirs = [
      'C:\\Program Files',
      'C:\\Program Files (x86)',
      'C:\\Windows',
      '/Applications',
      '/usr',
      '/opt'
    ]
    const inProtected = protectedDirs.some((dir) =>
      exePath.toLowerCase().startsWith(dir.toLowerCase())
    )

    // 测试写入权限
    let canWrite = true
    try {
      const testFile = path.join(app.getPath('userData'), '.perm-test')
      await fsp.writeFile(testFile, 'test')
      await fsp.unlink(testFile)
    } catch {
      canWrite = false
    }

    return {
      inProtectedDir: inProtected,
      canWriteToUserData: canWrite,
      exePath,
      userDataPath: app.getPath('userData'),
      isAdmin: (() => {
        if (process.platform !== 'win32') return false
        try {
          execSync('net session', { stdio: 'ignore' })
          return true
        } catch {
          return false
        }
      })()
    }
  })

  // 最大化状态变化通知渲染进程
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximized-changed', true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximized-changed', false)
  })
}

/**
 * VoxVer Launcher - 游戏截图服务
 * 扫描 .minecraft/screenshots 目录，提供预览、缩放、删除、导出功能
 */
import { existsSync, readdirSync, statSync, renameSync, unlinkSync, mkdirSync } from 'fs'
import { join, basename, extname } from 'path'
import { app, nativeImage, clipboard, dialog } from 'electron'
import sharp from 'sharp'
import { logger } from '../utils/logger'

const log = logger.child('Screenshot')

export interface ScreenshotInfo {
  fileName: string
  filePath: string
  size: number
  createdAt: number
  thumbnail?: string // base64 data URL
}

/**
 * 获取当前实例的截图目录
 */
function getScreenshotsDir(gameDir: string): string {
  const dir = join(gameDir, 'screenshots')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

/**
 * 扫描截图目录，按时间倒序排列
 */
export function scanScreenshots(gameDir: string): ScreenshotInfo[] {
  const dir = getScreenshotsDir(gameDir)
  const result: ScreenshotInfo[] = []

  try {
    const files = readdirSync(dir)
    for (const file of files) {
      const ext = extname(file).toLowerCase()
      if (!['.png', '.jpg', '.jpeg'].includes(ext)) continue

      const filePath = join(dir, file)
      try {
        const stat = statSync(filePath)
        result.push({
          fileName: file,
          filePath,
          size: stat.size,
          createdAt: stat.mtimeMs
        })
      } catch { /* skip inaccessible files */ }
    }
  } catch { /* ignore */ }

  return result.sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * 生成截图缩略图（Base64，320px 宽）
 */
export async function generateThumbnail(filePath: string): Promise<string | null> {
  try {
    const buffer = await sharp(filePath)
      .resize(320, 180, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer()

    return `data:image/jpeg;base64,${buffer.toString('base64')}`
  } catch (e: any) {
    log.warn('缩略图生成失败:', basename(filePath), e.message)
    return null
  }
}

/**
 * 读取截图文件的完整 Base64（用于预览）
 */
export async function getFullImage(filePath: string, maxWidth = 1200): Promise<string | null> {
  try {
    const buffer = await sharp(filePath)
      .resize(maxWidth, undefined, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer()

    return `data:image/png;base64,${buffer.toString('base64')}`
  } catch (e: any) {
    log.warn('截图读取失败:', basename(filePath), e.message)
    return null
  }
}

/**
 * 删除截图
 */
export function deleteScreenshot(filePath: string): boolean {
  try {
    unlinkSync(filePath)
    log.info('已删除截图:', basename(filePath))
    return true
  } catch (e: any) {
    log.error('删除截图失败:', basename(filePath), e.message)
    return false
  }
}

/**
 * 重命名截图
 */
export function renameScreenshot(filePath: string, newName: string): string | null {
  try {
    const dir = filePath.substring(0, filePath.lastIndexOf('\\'))
    const newPath = join(dir, newName)
    renameSync(filePath, newPath)
    log.info('已重命名截图:', basename(filePath), '→', newName)
    return newPath
  } catch (e: any) {
    log.error('重命名截图失败:', basename(filePath), e.message)
    return null
  }
}

/**
 * 导出截图到用户选择的位置
 */
export async function exportScreenshot(filePath: string): Promise<boolean> {
  const result = await dialog.showSaveDialog({
    title: '导出截图',
    defaultPath: basename(filePath),
    filters: [{ name: 'PNG Image', extensions: ['png'] }]
  })

  if (result.canceled || !result.filePath) return false

  try {
    const { copyFileSync } = await import('fs')
    copyFileSync(filePath, result.filePath)
    log.info('已导出截图:', result.filePath)
    return true
  } catch (e: any) {
    log.error('导出截图失败:', e.message)
    return false
  }
}

/**
 * 复制截图到剪贴板
 */
export function copyScreenshotToClipboard(filePath: string): boolean {
  try {
    const img = nativeImage.createFromPath(filePath)
    if (img.isEmpty()) return false
    clipboard.writeImage(img)
    return true
  } catch (e: any) {
    log.error('截图复制到剪贴板失败:', e.message)
    return false
  }
}

/**
 * 在默认应用中打开截图
 */
export async function openScreenshot(filePath: string): Promise<void> {
  const { shell } = await import('electron')
  await shell.openPath(filePath)
}

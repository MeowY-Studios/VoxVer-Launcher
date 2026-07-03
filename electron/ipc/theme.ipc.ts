/**
 * 主题/背景 IPC 处理器
 */
import { ipcMain } from 'electron'
import { logger } from '../utils/logger'
import {
  loadTheme,
  saveTheme,
  importBackgroundImage,
  getBackgroundAsDataUrl,
  deleteBackground,
  computeThemeVars,
  exportThemeAsJson,
  importThemeFromJson,
  getBuiltinPresets,
  type ThemeSettings
} from '../services/theme.service'

const log = logger.child('theme.ipc')

export function registerThemeHandlers(): void {
  log.info('Registering theme IPC handlers')

  ipcMain.handle('theme:load', () => {
    const theme = loadTheme()
    const vars = computeThemeVars(theme.themeColor)
    const bgDataUrl = theme.bgImageLocalPath ? getBackgroundAsDataUrl(theme.bgImageLocalPath) : null
    return { ...theme, cssVars: vars, backgroundDataUrl: bgDataUrl }
  })

  ipcMain.handle('theme:save', (_event, payload: { settings: ThemeSettings }) => {
    log.info('保存主题设置', {
      themeColor: payload.settings.themeColor,
      bgMode: payload.settings.bgImageMode
    })
    saveTheme(payload.settings)
    const vars = computeThemeVars(payload.settings.themeColor)
    const bgDataUrl = payload.settings.bgImageLocalPath
      ? getBackgroundAsDataUrl(payload.settings.bgImageLocalPath)
      : null
    return { ok: true, cssVars: vars, backgroundDataUrl: bgDataUrl }
  })

  ipcMain.handle('theme:import-background', (_event, payload: { sourcePath: string }) => {
    log.info('导入背景图片', { sourcePath: payload.sourcePath })
    const res = importBackgroundImage(payload.sourcePath)
    if (!res.ok) return { ok: false, error: res.error }
    const dataUrl = getBackgroundAsDataUrl(res.localPath || '')
    return { ok: true, localPath: res.localPath, dataUrl }
  })

  ipcMain.handle('theme:delete-background', (_event, payload: { localPath: string }) => {
    return { ok: deleteBackground(payload.localPath) }
  })

  ipcMain.handle('theme:compute-vars', (_event, payload: { hex: string }) => {
    return computeThemeVars(payload.hex)
  })

  ipcMain.handle('theme:export', (_event, payload: { settings: ThemeSettings }) => {
    try {
      const json = exportThemeAsJson(payload.settings)
      return { ok: true, json }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  })

  ipcMain.handle('theme:import', (_event, payload: { json: string }) => {
    const result = importThemeFromJson(payload.json)
    if (result.ok && result.settings) {
      saveTheme(result.settings)
      const vars = computeThemeVars(result.settings.themeColor)
      const bgDataUrl = result.settings.bgImageLocalPath
        ? getBackgroundAsDataUrl(result.settings.bgImageLocalPath)
        : null
      return { ok: true, settings: result.settings, cssVars: vars, backgroundDataUrl: bgDataUrl }
    }
    return { ok: false, error: result.error }
  })

  ipcMain.handle('theme:presets', () => {
    return getBuiltinPresets()
  })

  log.info('theme handlers registered')
}

/**
 * 主题与背景服务
 *
 * 功能：
 *  - 保存/恢复自定义主题色（CSS 变量）
 *  - 保存/恢复背景图片（复制到用户数据目录，避免源文件删除后失效）
 *  - 背景透明度、模糊等效果参数
 *
 * 存储：
 *  - 配置使用 config service（数据库）
 *  - 背景图片存放在 app.getPath('userData')/themes/backgrounds/
 */

import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { getConfig, setConfig } from './config'

// ========== 类型 ==========

export interface ThemeSettings {
  themeColor: string // #RRGGBB
  bgImageMode: 'none' | 'custom' | 'preset'
  bgImageLocalPath: string // 保存在 userData 中的相对路径
  bgOpacity: number // 0-100
  bgBlur: number // 0-20 px
  bgColorOverlay: boolean
  accentColor: string // 备用强调色
}

const DEFAULT_THEME: ThemeSettings = {
  themeColor: '#6366f1',
  bgImageMode: 'none',
  bgImageLocalPath: '',
  bgOpacity: 100,
  bgBlur: 0,
  bgColorOverlay: false,
  accentColor: '#8b5cf6'
}

const THEME_CONFIG_KEY = 'theme_settings'
const BG_DIR_NAME = 'themes/backgrounds'

// ========== 内部工具 ==========

function getBgDir(): string {
  const dir = path.join(app.getPath('userData'), BG_DIR_NAME)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function copyFileSafe(src: string, dest: string): void {
  const parent = path.dirname(dest)
  if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true })
  fs.copyFileSync(src, dest)
}

// ========== 读取 / 保存 ==========

export function loadTheme(): ThemeSettings {
  try {
    const saved = getConfig<ThemeSettings>(THEME_CONFIG_KEY)
    if (saved && typeof saved === 'object') {
      return { ...DEFAULT_THEME, ...saved }
    }
  } catch {}
  return { ...DEFAULT_THEME }
}

export function saveTheme(settings: ThemeSettings): void {
  setConfig(THEME_CONFIG_KEY, settings as unknown as Record<string, unknown>)
}

// ========== 背景图片 ==========

/**
 * 将用户选择的背景图片复制到 userData 目录，返回相对文件名
 */
export function importBackgroundImage(sourcePath: string): {
  ok: boolean
  localPath?: string
  error?: string
} {
  try {
    if (!fs.existsSync(sourcePath)) {
      return { ok: false, error: '图片文件不存在' }
    }
    const stat = fs.statSync(sourcePath)
    if (stat.size > 20 * 1024 * 1024) {
      return { ok: false, error: '图片大小超过 20MB 限制' }
    }

    const ext = path.extname(sourcePath).toLowerCase()
    const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif']
    if (!allowed.includes(ext)) {
      return { ok: false, error: '不支持的图片格式（仅支持 ' + allowed.join(', ') + '）' }
    }

    const baseName = path.basename(sourcePath, ext)
    const safeName = baseName.replace(/[^a-z0-9_\-]/gi, '_').slice(0, 60)
    const timestamp = Date.now()
    const fileName = `${safeName}_${timestamp}${ext}`

    const dest = path.join(getBgDir(), fileName)
    copyFileSafe(sourcePath, dest)

    return { ok: true, localPath: fileName }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message || '导入背景图片失败' }
  }
}

/**
 * 获取本地背景图片的绝对路径（供前端 file:// 或转为 base64 使用）
 */
export function getBackgroundAbsolutePath(localPath: string): string | null {
  if (!localPath) return null
  const full = path.join(getBgDir(), localPath)
  if (!fs.existsSync(full)) return null
  return full
}

/**
 * 将背景图片转为 base64，供渲染进程直接使用（避免 file:// 安全限制）
 */
export function getBackgroundAsDataUrl(localPath: string): string | null {
  const full = getBackgroundAbsolutePath(localPath)
  if (!full) return null
  try {
    const ext = path.extname(full).slice(1).toLowerCase()
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/' + ext
    const buf = fs.readFileSync(full)
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

/**
 * 删除指定的本地背景图片
 */
export function deleteBackground(localPath: string): boolean {
  try {
    const full = path.join(getBgDir(), localPath)
    if (fs.existsSync(full)) {
      fs.unlinkSync(full)
      return true
    }
  } catch {}
  return false
}

/**
 * 将主题设置导出为可分享的 JSON 字符串
 */
export function exportThemeAsJson(settings: ThemeSettings): string {
  return JSON.stringify({
    version: 1,
    type: 'voxver_theme',
    settings,
    exportedAt: new Date().toISOString()
  }, null, 2)
}

/**
 * 从 JSON 字符串导入主题设置
 */
export function importThemeFromJson(jsonStr: string): { ok: boolean; settings?: ThemeSettings; error?: string } {
  try {
    const data = JSON.parse(jsonStr)
    if (data.type !== 'voxver_theme') {
      return { ok: false, error: '无效的主题文件格式' }
    }
    const settings: ThemeSettings = { ...DEFAULT_THEME, ...data.settings }
    if (!isValidHex(settings.themeColor)) {
      return { ok: false, error: '无效的主题色' }
    }
    return { ok: true, settings }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message || '解析主题文件失败' }
  }
}

// ========== 主题预设 ==========

export interface ThemePreset {
  id: string
  name: string
  description: string
  themeColor: string
  accentColor: string
  thumbnail?: string
}

export const BUILTIN_PRESETS: ThemePreset[] = [
  {
    id: 'indigo',
    name: '靛青',
    description: '默认靛青紫配色',
    themeColor: '#6366f1',
    accentColor: '#8b5cf6'
  },
  {
    id: 'teal',
    name: '深青',
    description: 'GitHub Dark 风格墨色',
    themeColor: '#14b8a6',
    accentColor: '#0d9488'
  },
  {
    id: 'coral',
    name: '珊瑚',
    description: '温暖活力的橙色系',
    themeColor: '#f43f5e',
    accentColor: '#e11d48'
  },
  {
    id: 'amber',
    name: '琥珀',
    description: '明亮的金色主题',
    themeColor: '#f59e0b',
    accentColor: '#d97706'
  },
  {
    id: 'emerald',
    name: '翠绿',
    description: '清新的绿色主题',
    themeColor: '#10b981',
    accentColor: '#059669'
  },
  {
    id: 'sky',
    name: '天蓝',
    description: '清爽的蓝色主题',
    themeColor: '#0ea5e9',
    accentColor: '#0284c7'
  },
  {
    id: 'violet',
    name: '紫罗兰',
    description: '优雅的紫色主题',
    themeColor: '#8b5cf6',
    accentColor: '#7c3aed'
  },
  {
    id: 'rose',
    name: '玫瑰',
    description: '柔美的粉色主题',
    themeColor: '#ec4899',
    accentColor: '#db2777'
  }
]

export function getBuiltinPresets(): ThemePreset[] {
  return BUILTIN_PRESETS
}

/**
 * 基于主色生成完整的 CSS 变量集（供前端直接 apply 到 document）
 */
export interface ComputedThemeVars {
  '--mcla-primary': string
  '--mcla-primary-light': string
  '--mcla-primary-dark': string
  '--mcla-gradient-primary': string
  '--mcla-shadow-glow-primary': string
  '--mcla-accent': string
}

export function computeThemeVars(hex: string): ComputedThemeVars {
  const primary = isValidHex(hex) ? hex : DEFAULT_THEME.themeColor
  return {
    '--mcla-primary': primary,
    '--mcla-primary-light': adjustHex(primary, 35),
    '--mcla-primary-dark': adjustHex(primary, -35),
    '--mcla-gradient-primary': `linear-gradient(135deg, ${primary}, ${adjustHex(primary, 35)})`,
    '--mcla-shadow-glow-primary': `0 4px 20px ${hexToRgba(primary, 0.35)}`,
    '--mcla-accent': adjustHex(primary, 50)
  }
}

function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex) || /^#[0-9a-fA-F]{3}$/.test(hex)
}

function adjustHex(hex: string, offset: number): string {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  let r = parseInt(full.slice(0, 2), 16)
  let g = parseInt(full.slice(2, 4), 16)
  let b = parseInt(full.slice(4, 6), 16)
  r = Math.min(255, Math.max(0, r + offset))
  g = Math.min(255, Math.max(0, g + offset))
  b = Math.min(255, Math.max(0, b + offset))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

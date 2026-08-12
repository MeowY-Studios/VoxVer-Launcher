/**
 * 实例增强服务
 * 在基础 CRUD 之上提供：目录创建、文件系统操作、Mod 列表、打开文件夹等
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { app, shell } from 'electron'
import { getDatabase } from './database'
import {
  getInstanceById,
  createInstance,
  updateInstance,
  deleteInstance,
  Instance
} from './instances'
import { logger } from '../utils/logger'
const log = logger.child('InstanceEnhanced')

export interface CreateInstanceInput {
  name: string
  mcVersion: string
  loaderType?: 'vanilla' | 'forge' | 'fabric' | 'neoforge' | 'quilt'
  loaderVersion?: string
  /** 自定义游戏目录，不填则自动在 mcDir 下建 */
  customPath?: string
  javaPath?: string
  jvmArgs?: string
  minMemory?: number
  maxMemory?: number
  width?: number
  height?: number
  icon?: string
}

// ===== 创建 =====

/**
 * 创建实例，同时初始化目录结构
 */
export function createInstanceWithDir(input: CreateInstanceInput): Instance {
  const id = `inst_${Date.now()}`
  const mcDir = defaultMcDir()
  const instanceDir = input.customPath || path.join(mcDir, 'instances', id)

  // 创建目录结构
  ensureDir(instanceDir)
  ensureDir(path.join(instanceDir, 'mods'))
  ensureDir(path.join(instanceDir, 'resourcepacks'))
  ensureDir(path.join(instanceDir, 'saves'))
  ensureDir(path.join(instanceDir, 'screenshots'))
  ensureDir(path.join(instanceDir, 'logs'))

  return createInstance({
    id,
    name: input.name,
    path: instanceDir,
    mc_version: input.mcVersion,
    loader_type: input.loaderType || 'vanilla',
    loader_version: input.loaderVersion || '',
    icon: input.icon || '',
    java_path: input.javaPath || '',
    jvm_args: '',
    min_memory: input.minMemory || 512,
    max_memory: input.maxMemory || 2048,
    width: 854,
    height: 480,
    fullscreen: 0,
    is_favorited: 0,
    last_played: null
  })
}

// ===== 删除 =====

/**
 * 删除实例（可选是否同时删除文件系统目录）
 */
export function deleteInstanceWithDir(id: string, deleteFiles = false): boolean {
  const instance = getInstanceById(id)
  if (!instance) return false

  if (deleteFiles && instance.path && fs.existsSync(instance.path)) {
    try {
      fs.rmSync(instance.path, { recursive: true, force: true })
    } catch (e) {
      log.error(`[InstanceEnhanced] 删除目录失败: ${e}`)
    }
  }

  return deleteInstance(id)
}

// ===== 文件系统操作 =====

/** 打开实例目录（系统资源管理器） */
export async function openInstanceFolder(id: string): Promise<boolean> {
  const instance = getInstanceById(id)
  if (!instance || !instance.path) return false
  if (!fs.existsSync(instance.path)) {
    fs.mkdirSync(instance.path, { recursive: true })
  }
  await shell.openPath(instance.path)
  return true
}

/** 打开实例 mods 目录 */
export async function openModsFolder(id: string): Promise<boolean> {
  const instance = getInstanceById(id)
  if (!instance || !instance.path) return false
  const modsDir = path.join(instance.path, 'mods')
  ensureDir(modsDir)
  await shell.openPath(modsDir)
  return true
}

// ===== Mod 文件扫描 =====

export interface ModFileInfo {
  filename: string
  size: number
  enabled: boolean // .jar = enabled, .jar.disabled = disabled
  modifiedAt: string
}

/** 扫描实例 mods 目录，返回文件列表 */
export function listModFiles(id: string): ModFileInfo[] {
  const instance = getInstanceById(id)
  if (!instance || !instance.path) return []

  const modsDir = path.join(instance.path, 'mods')
  if (!fs.existsSync(modsDir)) return []

  try {
    return fs
      .readdirSync(modsDir)
      .filter((f) => f.endsWith('.jar') || f.endsWith('.jar.disabled'))
      .map((filename) => {
        const fullPath = path.join(modsDir, filename)
        const stat = fs.statSync(fullPath)
        return {
          filename,
          size: stat.size,
          enabled: filename.endsWith('.jar'),
          modifiedAt: stat.mtime.toISOString()
        }
      })
      .sort((a, b) => a.filename.localeCompare(b.filename))
  } catch {
    return []
  }
}

/** 启用/禁用 Mod（重命名文件） */
export function toggleMod(id: string, filename: string, enabled: boolean): boolean {
  const instance = getInstanceById(id)
  if (!instance || !instance.path) return false

  const modsDir = path.join(instance.path, 'mods')
  const oldPath = path.join(modsDir, filename)
  if (!fs.existsSync(oldPath)) return false

  let newFilename: string
  if (enabled) {
    // 启用：去掉 .disabled 后缀
    newFilename = filename.replace(/\.disabled$/, '')
  } else {
    // 禁用：加 .disabled 后缀
    newFilename = filename.endsWith('.disabled') ? filename : filename + '.disabled'
  }

  if (newFilename === filename) return true

  const newPath = path.join(modsDir, newFilename)
  try {
    fs.renameSync(oldPath, newPath)
    return true
  } catch {
    return false
  }
}

/** 删除 Mod 文件 */
export function deleteMod(id: string, filename: string): boolean {
  const instance = getInstanceById(id)
  if (!instance || !instance.path) return false

  const modPath = path.join(instance.path, 'mods', filename)
  if (!fs.existsSync(modPath)) return false

  try {
    fs.unlinkSync(modPath)
    return true
  } catch {
    return false
  }
}

// ===== 实例统计 =====

/** 获取实例磁盘占用大小（字节） */
export function getInstanceDiskUsage(id: string): number {
  const instance = getInstanceById(id)
  if (!instance || !instance.path || !fs.existsSync(instance.path)) return 0
  return getDirSize(instance.path)
}

function getDirSize(dirPath: string): number {
  let total = 0
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        total += getDirSize(full)
      } else if (entry.isFile()) {
        total += fs.statSync(full).size
      }
    }
  } catch {}
  return total
}

// ===== 工具 =====

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// ===== 资源包/光影包/存档 通用列表 =====
export interface PackFileInfo {
  filename: string
  size: number
  enabled: boolean
  modifiedAt: string
  isDir: boolean
}

/**
 * 扫描指定子目录（resourcepacks/shaderpacks/saves）
 */
function scanInstanceSubDir(id: string, subDirName: string, patterns: RegExp[]): PackFileInfo[] {
  const instance = getInstanceById(id)
  if (!instance || !instance.path) return []
  const dir = path.join(instance.path, subDirName)
  if (!fs.existsSync(dir)) return []

  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => {
        if (entry.isDirectory()) return subDirName === 'saves'
        return patterns.some((p) => p.test(entry.name))
      })
      .map((entry) => {
        const fullPath = path.join(dir, entry.name)
        const stat = fs.statSync(fullPath)
        // 资源包：zip=enabled，zip.disabled=disabled
        // 存档：始终 enabled
        let enabled = true
        if (subDirName !== 'saves') {
          enabled = !entry.name.endsWith('.disabled')
        }
        return {
          filename: entry.name,
          size: stat.size,
          enabled,
          modifiedAt: stat.mtime.toISOString(),
          isDir: entry.isDirectory()
        }
      })
      .sort((a, b) => {
        // 资源包/光影：先 enabled
        if (subDirName !== 'saves' && a.enabled !== b.enabled) return (b.enabled ? 1 : 0) - (a.enabled ? 1 : 0)
        return a.filename.localeCompare(b.filename)
      })
  } catch {
    return []
  }
}

/** 通用启用/禁用（zip↔zip.disabled），存档不支持 */
function togglePack(id: string, subDirName: string, filename: string, enabled: boolean): boolean {
  if (subDirName === 'saves') return false
  const instance = getInstanceById(id)
  if (!instance || !instance.path) return false
  const dir = path.join(instance.path, subDirName)
  const oldPath = path.join(dir, filename)
  if (!fs.existsSync(oldPath)) return false

  let newFilename: string
  if (enabled) newFilename = filename.replace(/\.disabled$/, '')
  else newFilename = filename.endsWith('.disabled') ? filename : filename + '.disabled'
  if (newFilename === filename) return true

  try {
    fs.renameSync(oldPath, path.join(dir, newFilename))
    return true
  } catch {
    return false
  }
}

/** 通用删除文件/目录 */
function deleteFsEntry(id: string, subDirName: string, filename: string): boolean {
  const instance = getInstanceById(id)
  if (!instance || !instance.path) return false
  const target = path.join(instance.path, subDirName, filename)
  if (!fs.existsSync(target)) return false
  try {
    const stat = fs.statSync(target)
    if (stat.isDirectory()) fs.rmSync(target, { recursive: true, force: true })
    else fs.unlinkSync(target)
    return true
  } catch {
    return false
  }
}

// ===== 资源包 =====
const PACK_PATTERNS = [/\.zip$/, /\.zip\.disabled$/, /\.jar$/, /\.jar\.disabled$/]

export function listResourcePacks(id: string): PackFileInfo[] {
  return scanInstanceSubDir(id, 'resourcepacks', PACK_PATTERNS)
}
export function toggleResourcePack(id: string, filename: string, enabled: boolean): boolean {
  return togglePack(id, 'resourcepacks', filename, enabled)
}
export function deleteResourcePack(id: string, filename: string): boolean {
  return deleteFsEntry(id, 'resourcepacks', filename)
}

// ===== 光影包（先尝试 shaderpacks，不存在则在目录里检测） =====
export function listShaderPacks(id: string): PackFileInfo[] {
  return scanInstanceSubDir(id, 'shaderpacks', PACK_PATTERNS)
}
export function toggleShaderPack(id: string, filename: string, enabled: boolean): boolean {
  return togglePack(id, 'shaderpacks', filename, enabled)
}
export function deleteShaderPack(id: string, filename: string): boolean {
  return deleteFsEntry(id, 'shaderpacks', filename)
}

// ===== 存档 =====
export function listSaves(id: string): PackFileInfo[] {
  return scanInstanceSubDir(id, 'saves', [])
}
export function deleteSave(id: string, saveName: string): boolean {
  return deleteFsEntry(id, 'saves', saveName)
}
export function renameSave(id: string, oldName: string, newName: string): boolean {
  const instance = getInstanceById(id)
  if (!instance || !instance.path) return false
  const savesDir = path.join(instance.path, 'saves')
  const oldPath = path.join(savesDir, oldName)
  const newPath = path.join(savesDir, newName)
  if (!fs.existsSync(oldPath) || fs.existsSync(newPath)) return false
  try {
    fs.renameSync(oldPath, newPath)
    return true
  } catch {
    return false
  }
}
/** 备份：将存档目录 zip 到 backups 文件夹 */
export function backupSave(id: string, saveName: string): string | null {
  const instance = getInstanceById(id)
  if (!instance || !instance.path) return null
  const savesDir = path.join(instance.path, 'saves')
  const backupsDir = path.join(instance.path, 'backups')
  ensureDir(backupsDir)
  const src = path.join(savesDir, saveName)
  if (!fs.existsSync(src)) return null
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const dest = path.join(backupsDir, `${saveName}-${ts}.zip`)
  try {
    // 简易 zip：用 shell ？ 这里直接用原生递归压缩不现实，退而做目录拷贝
    const destDir = path.join(backupsDir, `${saveName}-${ts}`)
    copyDirRecursive(src, destDir)
    return destDir
  } catch {
    return null
  }
}

function copyDirRecursive(src: string, dest: string) {
  ensureDir(dest)
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const e of entries) {
    const s = path.join(src, e.name)
    const d = path.join(dest, e.name)
    if (e.isDirectory()) copyDirRecursive(s, d)
    else fs.copyFileSync(s, d)
  }
}

/**
 * 实例默认根目录：**不**使用系统默认的 %AppData%\.minecraft（C 盘），
 * 改放在应用自己的 userData/voxver-mc 目录。这样能保证：
 * 1) 不会读取/写入 C:\Users\<name>\AppData\Roaming\.minecraft
 * 2) 实例文件和数据库（userData/data/voxver.db）同根，便于打包/备份/迁移
 * 用户仍可通过 customPath（设置中的自定义路径）把单个实例放到指定目录。
 */
function defaultMcDir(): string {
  const userData = app.getPath('userData')
  const dir = path.join(userData, 'voxver-mc')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

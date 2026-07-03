/**
 * 外部启动器数据导入服务
 * 支持检测 HMCL (Hello Minecraft! Launcher) 和 PCL2 (Plain Craft Launcher 2) 的安装
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { join, basename } from 'path'
import { homedir } from 'os'
import { logger } from '../utils/logger'

const log = logger.child('ExternalLauncher')

export interface ExternalInstance {
  name: string
  version: string
  loaderType: string
  loaderVersion: string
  gameDir: string
  modCount: number
  source: 'hmcl' | 'pcl2'
}

export interface ExternalLauncherInfo {
  type: 'hmcl' | 'pcl2'
  name: string
  path: string
  instances: ExternalInstance[]
  detected: boolean
}

function getDataPath(folder: string): string {
  // APPDATA on Win, ~/.config on Linux, ~/Library/Application Support on macOS
  const platform = process.platform
  if (platform === 'win32') {
    const appData = process.env.APPDATA || join(homedir(), 'AppData', 'Roaming')
    return join(appData, folder)
  } else if (platform === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', folder)
  }
  return join(homedir(), '.config', folder)
}

function detectMcVersion(gameDir: string): string {
  const versionsDir = join(gameDir, 'versions')
  if (!existsSync(versionsDir)) return ''

  try {
    const dirs = readdirSync(versionsDir)
    for (const dir of dirs) {
      const jsonPath = join(versionsDir, dir, `${dir}.json`)
      if (existsSync(jsonPath)) {
        try {
          const content = readFileSync(jsonPath, 'utf8')
          const json = JSON.parse(content)
          if (json.id && json.type !== 'release') {
            // For mod loader versions, check inheritsFrom
            if (json.inheritsFrom) {
              const parentPath = join(versionsDir, json.inheritsFrom, `${json.inheritsFrom}.json`)
              if (existsSync(parentPath)) {
                return json.inheritsFrom
              }
            }
            continue
          }
          if (json.id) return json.id
        } catch { continue }
      }
    }
  } catch { /* ignore */ }
  return ''
}

function getLoaderFromVersion(gameDir: string): { type: string; version: string } {
  const versionsDir = join(gameDir, 'versions')
  if (!existsSync(versionsDir)) return { type: 'vanilla', version: '' }

  try {
    const dirs = readdirSync(versionsDir)
    for (const dir of dirs) {
      const jsonPath = join(versionsDir, dir, `${dir}.json`)
      if (!existsSync(jsonPath)) continue
      try {
        const content = readFileSync(jsonPath, 'utf8')
        const json = JSON.parse(content)
        if (json.inheritsFrom) {
          const name = json.id || dir
          if (name.includes('fabric')) return { type: 'fabric', version: name.replace(/.*fabric-?/, '') }
          if (name.includes('forge')) return { type: 'forge', version: name.replace(/.*forge-?/, '') }
          if (name.includes('quilt')) return { type: 'quilt', version: name.replace(/.*quilt-?/, '') }
          if (name.includes('neoforge')) return { type: 'neoforge', version: name.replace(/.*neoforge-?/, '') }
          return { type: dir, version: name }
        }
      } catch { continue }
    }
  } catch { /* ignore */ }
  return { type: 'vanilla', version: '' }
}

function countMods(gameDir: string): number {
  const modsDir = join(gameDir, 'mods')
  if (!existsSync(modsDir)) return 0
  try {
    return readdirSync(modsDir).filter((f) => f.endsWith('.jar')).length
  } catch {
    return 0
  }
}

/**
 * 检测 HMCL 安装
 * HMCL 配置存储在 %APPDATA%/.hmcl/
 */
function detectHMCL(): ExternalLauncherInfo | null {
  const hmclPath = getDataPath('.hmcl')
  if (!existsSync(hmclPath)) {
    log.info('[HMCL] Not found at:', hmclPath)
    return null
  }

  log.info('[HMCL] Found at:', hmclPath)

  // Read HMCL config to find game directories
  const configPath = join(hmclPath, 'hmcl.json')
  let gameDirs: string[] = [join(homedir(), '.minecraft')]

  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf8'))
      if (config.commonDirType === 'custom' && config.commonDirectory) {
        gameDirs = [config.commonDirectory]
      } else if (config.commonpath) {
        gameDirs = [config.commonpath]
      }
    } catch { /* ignore */ }
  }

  // Also check hmcl.json.multimc style
  const hmclJsonPath = join(hmclPath, 'hmcl.json')
  if (existsSync(hmclJsonPath)) {
    try {
      const config = JSON.parse(readFileSync(hmclJsonPath, 'utf8'))
      if (config.gameDir) {
        gameDirs.push(config.gameDir)
      }
    } catch { /* ignore */ }
  }

  const instances: ExternalInstance[] = []
  for (const gameDir of [...new Set(gameDirs)]) {
    if (!existsSync(gameDir)) continue
    const version = detectMcVersion(gameDir)
    if (!version) continue
    const loader = getLoaderFromVersion(gameDir)
    instances.push({
      name: basename(gameDir),
      version,
      loaderType: loader.type,
      loaderVersion: loader.version,
      gameDir,
      modCount: countMods(gameDir),
      source: 'hmcl'
    })
  }

  return {
    type: 'hmcl',
    name: 'HMCL',
    path: hmclPath,
    instances: [...new Map(instances.map((i) => [i.gameDir, i])).values()],
    detected: true
  }
}

/**
 * 检测 PCL2 安装
 * PCL2 数据存储在 minecraft 目录旁边
 */
function detectPCL2(): ExternalLauncherInfo | null {
  // PCL2 stores config in the minecraft directory
  const mcPath = join(homedir(), '.minecraft')
  const pclConfigPath = join(mcPath, 'PCL.json')

  if (!existsSync(pclConfigPath)) {
    // Try alternative locations
    const altPath = getDataPath('PCL')
    if (existsSync(altPath)) {
      log.info('[PCL2] Found at:', altPath)
      return scanPCLDir(mcPath)
    }
    log.info('[PCL2] Not found')
    return null
  }

  log.info('[PCL2] Found at:', mcPath)
  return scanPCLDir(mcPath)
}

function scanPCLDir(mcPath: string): ExternalLauncherInfo {
  // PCL2 can manage multiple game directories
  let gameDirs: string[] = [mcPath]

  try {
    const pclConfig = JSON.parse(readFileSync(join(mcPath, 'PCL.json'), 'utf8'))
    if (pclConfig.launcherData?.CommonDirectory) {
      gameDirs = [pclConfig.launcherData.CommonDirectory]
    }
  } catch { /* ignore */ }

  const instances: ExternalInstance[] = []
  for (const gameDir of [...new Set(gameDirs)]) {
    if (!existsSync(gameDir)) continue
    const version = detectMcVersion(gameDir)
    if (!version) continue
    const loader = getLoaderFromVersion(gameDir)
    instances.push({
      name: basename(gameDir),
      version,
      loaderType: loader.type,
      loaderVersion: loader.version,
      gameDir,
      modCount: countMods(gameDir),
      source: 'pcl2'
    })
  }

  return {
    type: 'pcl2',
    name: 'PCL2',
    path: mcPath,
    instances: [...new Map(instances.map((i) => [i.gameDir, i])).values()],
    detected: true
  }
}

/**
 * 检测所有外部启动器
 */
export function detectExternalLaunchers(): ExternalLauncherInfo[] {
  const results: ExternalLauncherInfo[] = []

  const hmcl = detectHMCL()
  if (hmcl) {
    results.push(hmcl)
    log.info(`[HMCL] Found ${hmcl.instances.length} instances`)
  }

  const pcl2 = detectPCL2()
  if (pcl2) {
    results.push(pcl2)
    log.info(`[PCL2] Found ${pcl2.instances.length} instances`)
  }

  return results
}

/**
 * 扫描指定的 minecraft 目录并返回实例信息
 */
export function scanGameDir(gameDir: string): ExternalInstance | null {
  if (!existsSync(gameDir)) return null
  const version = detectMcVersion(gameDir)
  if (!version) return null
  const loader = getLoaderFromVersion(gameDir)
  return {
    name: basename(gameDir),
    version,
    loaderType: loader.type,
    loaderVersion: loader.version,
    gameDir,
    modCount: countMods(gameDir),
    source: 'pcl2'
  }
}

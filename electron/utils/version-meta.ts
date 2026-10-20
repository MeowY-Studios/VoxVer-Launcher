/**
 * 版本元数据识别工具
 * 从版本 JSON 与 mods 文件夹识别真实 MC 版本号与 Mod 加载器
 * 用于整合包式命名的版本目录（如 "Zombie Invade 100 Days"），版本号在文件夹内部的版本 JSON 中
 */

import * as fs from 'fs'
import * as path from 'path'

/** Mod 加载器类型 */
export type LoaderKind = 'forge' | 'neoforge' | 'fabric' | 'quilt'

/** 加载器识别结果 */
export interface LoaderInfo {
  kind: LoaderKind
  /** 加载器版本号（无法识别时为空字符串） */
  version: string
}

/** 版本 JSON 识别所需的关键字段（全部可选） */
export interface VersionJsonMeta {
  id?: string
  type?: string
  inheritsFrom?: string
  mainClass?: string
  clientVersion?: string
  javaVersion?: { majorVersion?: number }
  libraries?: Array<{ name?: string }>
}

/** 版本识别结果 */
export interface VersionDetection {
  /** 真实 MC 版本号（如 1.20.1） */
  mcVersion: string
  /** Mod 加载器（无加载器时为 null） */
  loader: LoaderInfo | null
  /** 版本 JSON 元数据 */
  meta: VersionJsonMeta | null
  /** 版本 JSON 路径 */
  jsonPath: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/** 判断 JSON 对象是否为版本 JSON（排除 emi.json、usercache.json 等杂项 JSON） */
function isVersionJson(data: Record<string, unknown>): boolean {
  if (typeof data.mainClass === 'string') return true
  if (typeof data.inheritsFrom === 'string') return true
  if (isRecord(data.assetIndex)) return true
  if (isRecord(data.arguments)) return true
  return false
}

function parseVersionJson(filePath: string): VersionJsonMeta | null {
  let raw: string
  try {
    raw = fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isRecord(parsed) || !isVersionJson(parsed)) return null

  const libraries: Array<{ name?: string }> = []
  if (Array.isArray(parsed.libraries)) {
    for (const lib of parsed.libraries) {
      if (isRecord(lib)) {
        libraries.push({ name: asString(lib.name) })
      }
    }
  }

  const javaVersion = isRecord(parsed.javaVersion)
    ? { majorVersion: asNumber(parsed.javaVersion.majorVersion) }
    : undefined

  return {
    id: asString(parsed.id),
    type: asString(parsed.type),
    inheritsFrom: asString(parsed.inheritsFrom),
    mainClass: asString(parsed.mainClass),
    clientVersion: asString(parsed.clientVersion),
    javaVersion,
    libraries
  }
}

/**
 * 查找版本目录内的版本 JSON 路径
 * 优先 `<版本名>.json`，避免选中 emi.json 等杂项 JSON
 */
export function findVersionJsonPath(versionDir: string, versionId: string): string | null {
  const preferred = path.join(versionDir, `${versionId}.json`)
  if (fs.existsSync(preferred) && parseVersionJson(preferred)) {
    return preferred
  }
  let files: string[]
  try {
    files = fs.readdirSync(versionDir).filter((f) => f.toLowerCase().endsWith('.json')).sort()
  } catch {
    return null
  }
  for (const file of files) {
    const full = path.join(versionDir, file)
    if (parseVersionJson(full)) {
      return full
    }
  }
  return null
}

/** 读取版本目录内的版本 JSON 元数据 */
export function readVersionMeta(versionDir: string, versionId: string): VersionJsonMeta | null {
  const jsonPath = findVersionJsonPath(versionDir, versionId)
  return jsonPath ? parseVersionJson(jsonPath) : null
}

/** 提取形如 1.20.1 的 MC 版本号 */
function extractVersionNumber(text: string | undefined): string | undefined {
  if (!text) return undefined
  const match = text.match(/\d+\.\d+(?:\.\d+)?/)
  return match ? match[0] : undefined
}

/** 从 mods 文件夹的 mod 文件名中投票识别 MC 版本号（多数 mod 文件名含 MC 版本） */
function detectMcVersionFromMods(modsDirs: string[]): string | undefined {
  const counter = new Map<string, number>()
  for (const dir of modsDirs) {
    let files: string[]
    try {
      files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.jar'))
    } catch {
      continue
    }
    for (const file of files) {
      const match = file.match(/(^|[^\d])(\d+\.\d+\.\d+)([^\d]|$)/)
      if (match) {
        counter.set(match[2], (counter.get(match[2]) ?? 0) + 1)
      }
    }
  }
  let best: string | undefined
  let bestCount = 0
  for (const [version, count] of counter) {
    if (count > bestCount) {
      best = version
      bestCount = count
    }
  }
  return best
}

/**
 * 识别真实 MC 版本号
 * 顺序：clientVersion（PCL 注入）→ inheritsFrom → fmlloader/forge 库名 → mods 文件名投票 → 版本名前缀 → 原样返回
 */
export function detectMcVersion(
  meta: VersionJsonMeta | null,
  versionId: string,
  modsDirs: string[] = []
): string {
  const fromClient = extractVersionNumber(meta?.clientVersion)
  if (fromClient) return fromClient

  const fromInherits = extractVersionNumber(meta?.inheritsFrom)
  if (fromInherits) return fromInherits

  for (const lib of meta?.libraries ?? []) {
    const name = lib.name
    if (!name) continue
    // 形如 net.minecraftforge:fmlloader:1.20.1-47.4.10 或 net.minecraftforge:forge:1.20.1-47.4.10
    if (/^net\.(minecraftforge|neoforged):(fmlloader|forge|neoforge):/.test(name)) {
      const coordinate = name.split(':')[2] ?? ''
      const fromLib = coordinate.match(/^\d+\.\d+(?:\.\d+)?/)
      if (fromLib) return fromLib[0]
    }
  }

  const fromMods = detectMcVersionFromMods(modsDirs)
  if (fromMods) return fromMods

  // 版本名前缀兜底（如 1.20.1-Forge_47.4.10）
  const fromPrefix = versionId.match(/^v?(\d+\.\d+(?:\.\d+)?)/)
  if (fromPrefix) return fromPrefix[1]

  return extractVersionNumber(versionId) ?? versionId
}

/** 从库坐标解析加载器类型与版本 */
function detectLoaderFromLibraries(libraries: Array<{ name?: string }>): LoaderInfo | null {
  for (const lib of libraries) {
    const name = lib.name
    if (!name) continue
    const parts = name.split(':')
    if (parts.length < 3) continue
    const [group, artifact, coordinateVersion] = parts
    // 去掉形如 1.20.1- 的 MC 版本前缀，保留加载器版本
    const version = coordinateVersion.replace(/^\d+\.\d+(?:\.\d+)?-/, '')
    if (group === 'net.neoforged' && (artifact === 'fmlloader' || artifact === 'neoforge')) {
      return { kind: 'neoforge', version }
    }
    if (group === 'net.minecraftforge' && (artifact === 'fmlloader' || artifact === 'forge')) {
      return { kind: 'forge', version }
    }
    if (group === 'net.fabricmc' && artifact === 'fabric-loader') {
      return { kind: 'fabric', version }
    }
    if (group === 'org.quiltmc' && artifact === 'quilt-loader') {
      return { kind: 'quilt', version }
    }
  }
  return null
}

/** 从 mods 文件夹的 mod 文件名投票识别加载器（多数 mod 文件名含加载器标记） */
function detectLoaderFromMods(modsDirs: string[]): LoaderInfo | null {
  const patterns: Array<{ kind: LoaderKind; pattern: RegExp }> = [
    { kind: 'neoforge', pattern: /[-_.]neoforge[-_.]?|[-_.]neoforge$/i },
    { kind: 'forge', pattern: /[-_.]forge[-_.]?|[-_.]forge$/i },
    { kind: 'fabric', pattern: /[-_.]fabric[-_.]?|[-_.]fabric$/i },
    { kind: 'quilt', pattern: /[-_.]quilt[-_.]?|[-_.]quilt$/i }
  ]
  const counter = new Map<LoaderKind, number>()
  for (const dir of modsDirs) {
    let files: string[]
    try {
      files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.jar'))
    } catch {
      continue
    }
    for (const file of files) {
      for (const { kind, pattern } of patterns) {
        if (pattern.test(file)) {
          counter.set(kind, (counter.get(kind) ?? 0) + 1)
          break
        }
      }
    }
  }
  let best: LoaderKind | null = null
  let bestCount = 0
  for (const [kind, count] of counter) {
    if (count > bestCount) {
      best = kind
      bestCount = count
    }
  }
  return best ? { kind: best, version: '' } : null
}

/** 从 mainClass 识别加载器类型（BootstrapLauncher 为现代 Forge/NeoForge 共用，无法区分版本） */
function detectLoaderFromMainClass(mainClass: string | undefined): LoaderInfo | null {
  if (!mainClass) return null
  if (mainClass === 'net.fabricmc.loader.impl.launch.knot.KnotClient') {
    return { kind: 'fabric', version: '' }
  }
  if (mainClass.includes('quilt')) {
    return { kind: 'quilt', version: '' }
  }
  if (mainClass === 'cpw.mods.bootstraplauncher.BootstrapLauncher' || mainClass === 'net.minecraft.launchwrapper.Launch') {
    return { kind: 'forge', version: '' }
  }
  return null
}

/** 从版本名正则识别加载器（如 1.20.1-Forge_47.4.10、Fabric_0.18.1） */
function detectLoaderFromName(versionId: string): LoaderInfo | null {
  const match = versionId.match(/(?:^|[-_. ])(neoforge|forge|fabric|quilt)[-_ ]?([\d.]+)?/i)
  if (!match) return null
  const kindMap: Record<string, LoaderKind> = {
    neoforge: 'neoforge',
    forge: 'forge',
    fabric: 'fabric',
    quilt: 'quilt'
  }
  const kind = kindMap[match[1].toLowerCase()]
  return { kind, version: match[2] ?? '' }
}

/**
 * 识别 Mod 加载器
 * 顺序：版本 JSON 库名（最权威）→ mods 文件夹投票 → mainClass → 版本名正则
 */
export function detectLoader(
  meta: VersionJsonMeta | null,
  modsDirs: string[] = [],
  versionId: string
): LoaderInfo | null {
  return (
    detectLoaderFromLibraries(meta?.libraries ?? []) ??
    detectLoaderFromMods(modsDirs) ??
    detectLoaderFromMainClass(meta?.mainClass) ??
    detectLoaderFromName(versionId)
  )
}

/**
 * 识别版本信息（真实 MC 版本号 + 加载器）
 * @param gameRoot 共享 .minecraft 根目录（版本目录为其下的 versions/<版本名>）
 * @param versionId 版本名（可能是整合包式命名）
 */
export function detectVersionInfo(gameRoot: string, versionId: string): VersionDetection {
  const versionDir = path.join(gameRoot, 'versions', versionId)
  const jsonPath = findVersionJsonPath(versionDir, versionId)
  const meta = jsonPath ? parseVersionJson(jsonPath) : null
  // 优先 PCL 版本隔离目录内的 mods，其次共享 .minecraft/mods
  const modsDirs = [path.join(versionDir, 'mods'), path.join(gameRoot, 'mods')]
  const mcVersion = detectMcVersion(meta, versionId, modsDirs)
  const loader = detectLoader(meta, modsDirs, versionId)
  return { mcVersion, loader, meta, jsonPath }
}

/** 加载器显示文本（如 "Forge 47.4.10"） */
export function formatLoaderInfo(loader: LoaderInfo | null): string {
  if (!loader) return 'Vanilla'
  const labelMap: Record<LoaderKind, string> = {
    forge: 'Forge',
    neoforge: 'NeoForge',
    fabric: 'Fabric',
    quilt: 'Quilt'
  }
  return loader.version ? `${labelMap[loader.kind]} ${loader.version}` : labelMap[loader.kind]
}

import { promises as fs, createReadStream } from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { logger } from '../utils/logger'
import { ModrinthService, ModrinthProject } from './modrinth.service'
import { readFabricMod, readForgeMod, readQuiltMod } from '@xmcl/mod-parser'
import type { FabricModMetadata, QuiltModMetadata, ForgeModMetadata } from '@xmcl/mod-parser'
const log = logger.child('ModService')

const AdmZip = require('adm-zip')

const MR_BASE = 'https://api.modrinth.com/v2'

/** Mod 依赖信息 */
export interface ModDependencyInfo {
  project_id: string
  project_type: string
  dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded'
  version_id?: string
  project?: ModrinthProject
}

/** Mod 依赖检查结果 */
export interface ModDependencyCheckResult {
  mod: ModInfo
  dependencies: ModDependencyInfo[]
  missingDependencies: ModDependencyInfo[]
  installedDependencies: ModDependencyInfo[]
}

/** Mod 更新信息 */
export interface ModUpdateInfo {
  /** 本地 mod 的文件路径 */
  filePath: string
  /** 本地 mod 的 sha1 hash */
  hash: string
  /** 是否有更新 */
  hasUpdate: boolean
  /** Modrinth 上对应的项目 ID（如果找到） */
  projectId?: string
  /** 当前版本名（Modrinth 上的） */
  currentVersionName?: string
  /** 最新版本 ID */
  latestVersionId?: string
  /** 最新版本名 */
  latestVersionName?: string
  /** 最新版本文件下载 URL */
  latestDownloadUrl?: string
  /** 最新版本文件名 */
  latestFileName?: string
  /** 最新版本文件大小 */
  latestFileSize?: number
}

/** Modrinth version_files API 返回的版本对象（精简） */
interface MrVersionFile {
  id: string
  project_id: string
  name: string
  version_number: string
  loaders: string[]
  game_versions: string[]
  date_published: string
  version_type: 'release' | 'beta' | 'alpha'
  files: {
    url: string
    filename: string
    primary: boolean
    size: number
    hashes: { sha1: string; sha512: string }
  }[]
}

/**
 * Mod 信息
 */
export interface ModInfo {
  id: string
  name: string
  version: string
  description?: string
  authors?: string[]
  url?: string
  filePath: string
  fileName: string
  size: number
  hash?: string
  enabled: boolean
  loader?: 'fabric' | 'forge' | 'quilt' | 'neoforge'
  mcVersion?: string
  dependencies?: string[]
  logoUrl?: string
}

/**
 * Mod 文件类型
 */
export enum ModType {
  Jar = 'jar',
  Fabric = 'fabric-mod-json',
  Forge = 'mods.toml'
}

/**
 * Mod 管理服务
 */
export class ModService {
  private cacheDir: string
  // mod 信息内存缓存：key=filePath，value={mtime, info}，按 mtime 失效
  private modInfoCache = new Map<string, { mtime: number; info: any }>()

  constructor(cacheDir?: string) {
    // 默认缓存目录：%APPDATA%\mcla\mod-icons（Windows）或 ~/.mcla/mod-icons
    this.cacheDir =
      cacheDir || path.join(process.env.APPDATA || process.env.HOME || '.', 'mcla', 'mod-icons')
  }

  /**
   * 获取 mods 目录路径
   */
  getModsDir(gameDir: string): string {
    return path.join(gameDir, 'mods')
  }

  /**
   * 获取所有已安装的 Mod（包括已禁用的 .jar.disabled）
   * 使用并行处理 + 内存缓存优化加载速度
   */
  async getInstalledMods(gameDir: string): Promise<ModInfo[]> {
    const modsDir = this.getModsDir(gameDir)

    try {
      const files = await fs.readdir(modsDir)

      // 第一步：并行 stat 所有文件，过滤出 jar 文件
      const fileInfos = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(modsDir, file)
          const stat = await fs.stat(filePath)
          const isDisabled = file.endsWith('.disabled')
          const isJar = file.endsWith('.jar') || isDisabled
          if (!stat.isFile() || !isJar) return null
          return { file, filePath, stat, isDisabled }
        })
      )

      const validFiles = fileInfos.filter(
        (f): f is { file: string; filePath: string; stat: any; isDisabled: boolean } => f !== null
      )

      // 第二步：并行读取所有 mod 信息（带缓存）
      const mods = await Promise.all(
        validFiles.map(async ({ file, filePath, stat, isDisabled }) => {
          const modInfo = await this.readModInfoWithCache(filePath, stat.mtimeMs)
          const baseName = isDisabled ? file.replace(/\.disabled$/, '') : file

          return {
            id: this.generateModId(baseName),
            name: modInfo.name || this.extractModName(baseName),
            version: modInfo.version || 'Unknown',
            description: modInfo.description,
            authors: modInfo.authors,
            url: modInfo.url,
            filePath,
            fileName: file,
            size: stat.size,
            enabled: !isDisabled,
            loader: modInfo.loader,
            mcVersion: modInfo.mcVersion,
            dependencies: modInfo.dependencies,
            logoUrl: modInfo.logoUrl
          } as ModInfo
        })
      )

      return mods
    } catch (error) {
      log.error('[ModService] 读取 mods 目录失败:', error)
      return []
    }
  }

  /**
   * 带内存缓存的 readModInfo，按文件 mtime 失效
   */
  private async readModInfoWithCache(filePath: string, mtime: number) {
    const cached = this.modInfoCache.get(filePath)
    if (cached && cached.mtime === mtime) {
      return cached.info
    }
    const info = await this.readModInfo(filePath)
    this.modInfoCache.set(filePath, { mtime, info })
    return info
  }

  /**
   * 从文件名提取 Mod 名称
   */
  private extractModName(fileName: string): string {
    return fileName
      .replace(/\.jar(\.disabled)?$/i, '')
      .replace(/-\d[\d.]*(?:-[\w]+)?$/i, '')
      .replace(/_/g, ' ')
      .trim()
  }

  /**
   * 从文件名提取版本号
   */
  private extractVersionFromFileName(fileName: string): string {
    const match = fileName.match(/-\d[\d.]*(?:-[\w]+)?(?=\.jar)/i)
    return match ? match[0].replace(/^-/, '') : 'Unknown'
  }

  /**
   * 生成 Mod ID
   */
  private generateModId(fileName: string): string {
    const name = fileName.replace(/\.jar(\.disabled)?$/i, '').toLowerCase()
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i)
      hash = hash & hash
    }
    return `mod_${Math.abs(hash).toString(16)}`
  }

  /**
   * 读取 Mod 信息（从 jar 文件）
   * 使用 @xmcl/mod-parser 解析 Fabric / Quilt / Forge 三种 Mod 格式
   */
  private async readModInfo(filePath: string): Promise<{
    name?: string
    version?: string
    description?: string
    authors?: string[]
    url?: string
    loader?: 'fabric' | 'forge' | 'quilt' | 'neoforge'
    mcVersion?: string
    dependencies?: string[]
    logoUrl?: string
  }> {
    const fileName = path.basename(filePath)
    const result: any = {}

    try {
      // 1. 尝试 Fabric Mod 解析（fabric.mod.json）
      try {
        const fabMeta: FabricModMetadata = await readFabricMod(filePath)
        result.loader = 'fabric'
        result.name = fabMeta.name || fabMeta.id
        result.version = fabMeta.version
        result.description = fabMeta.description

        if (fabMeta.authors) {
          result.authors = fabMeta.authors
            .map((a: any) => (typeof a === 'string' ? a : a.name))
            .filter(Boolean)
        }

        if (fabMeta.contact?.homepage) {
          result.url = fabMeta.contact.homepage
        }

        if (fabMeta.depends) {
          result.dependencies = Object.keys(fabMeta.depends)
        }

        if (fabMeta.icon) {
          result.logoUrl = await this.extractIconToCache(filePath, fabMeta.icon, fileName)
        }

        return result
      } catch {
        // 不是 Fabric Mod，继续尝试其他格式
      }

      // 2. 尝试 Quilt Mod 解析（quilt.mod.json）
      try {
        const quiltMeta: QuiltModMetadata = await readQuiltMod(filePath)
        result.loader = 'quilt'
        const loader = quiltMeta.quilt_loader
        result.name = loader.metadata?.name || loader.id
        result.version = loader.version
        result.description = loader.metadata?.description

        if (loader.metadata?.contributors) {
          result.authors = Object.keys(loader.metadata.contributors)
        }

        if (loader.metadata?.contact?.homepage) {
          result.url = loader.metadata.contact.homepage
        }

        if (loader.depends) {
          result.dependencies = loader.depends.map((d: any) => d.id)
        }

        const iconValue = loader.metadata?.icon
        if (iconValue) {
          const iconPath = typeof iconValue === 'string' ? iconValue : Object.values(iconValue)[0]
          if (iconPath) {
            result.logoUrl = await this.extractIconToCache(filePath, iconPath, fileName)
          }
        }

        return result
      } catch {
        // 不是 Quilt Mod，继续尝试其他格式
      }

      // 3. 尝试 Forge Mod 解析（mods.toml / mcmod.info / ASM）
      try {
        const forgeMeta: ForgeModMetadata = await readForgeMod(filePath)
        result.loader = 'forge'

        // 优先使用 mods.toml（新版 Forge 格式）
        const tomlEntry = forgeMeta.modsToml?.[0]
        if (tomlEntry) {
          result.name = tomlEntry.displayName || tomlEntry.modid
          result.version = tomlEntry.version
          result.description = tomlEntry.description
          result.authors = tomlEntry.authors ? [tomlEntry.authors] : []
          result.url = tomlEntry.displayURL

          if (tomlEntry.dependencies) {
            result.dependencies = tomlEntry.dependencies.map((d: any) => d.modId)
          }

          if (tomlEntry.logoFile) {
            result.logoUrl = await this.extractIconToCache(filePath, tomlEntry.logoFile, fileName)
          }

          return result
        }

        // 回退到 mcmod.info（旧版 Forge 格式）
        const mcmodInfo = forgeMeta.mcmodInfo?.[0]
        if (mcmodInfo) {
          result.name = mcmodInfo.name || mcmodInfo.modid
          result.version = mcmodInfo.version
          result.description = mcmodInfo.description
          result.authors = mcmodInfo.authorList || []
          result.url = mcmodInfo.url

          if (mcmodInfo.logoFile) {
            result.logoUrl = await this.extractIconToCache(filePath, mcmodInfo.logoFile, fileName)
          }

          return result
        }

        // 回退到 MANIFEST.MF 元数据
        if (forgeMeta.manifestMetadata) {
          result.name = forgeMeta.manifestMetadata.name
          result.version = forgeMeta.manifestMetadata.version
          result.description = forgeMeta.manifestMetadata.description
          result.authors = forgeMeta.manifestMetadata.authors
          result.url = forgeMeta.manifestMetadata.url
          return result
        }

        return result
      } catch {
        // 不是 Forge Mod，回退到文件名解析
      }

      // 4. 文件名推测（无法识别为已知 Mod 格式时）
      result.version = this.extractVersionFromFileName(fileName)
      if (/fabric/i.test(fileName)) result.loader = 'fabric'
      else if (/forge/i.test(fileName)) result.loader = 'forge'
      else if (/quilt/i.test(fileName)) result.loader = 'quilt'
      else if (/neoforge/i.test(fileName)) result.loader = 'neoforge'

      const mcMatch = fileName.match(/(1\.\d+(?:\.\d+)?)/)
      if (mcMatch) result.mcVersion = mcMatch[1]

      return result
    } catch (e: any) {
      log.warn('[ModService] 读取 jar 信息失败，回退到文件名解析:', filePath, e?.message)
      return {
        name: this.extractModName(fileName),
        version: this.extractVersionFromFileName(fileName),
        loader: /fabric/i.test(fileName)
          ? 'fabric'
          : /forge/i.test(fileName)
            ? 'forge'
            : /quilt/i.test(fileName)
              ? 'quilt'
              : undefined
      }
    }
  }

  /**
   * 从 jar 文件中提取图标并缓存到本地
   * 返回 base64 data URL 格式字符串（避免 file:// CORS 限制），失败返回 undefined
   * @param zip 可选，复用已打开的 AdmZip 对象避免重复打开
   */
  private async extractIconToCache(
    jarPath: string,
    iconPathInJar: string,
    jarFileName: string,
    zip?: any
  ): Promise<string | undefined> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })

      // 生成缓存文件名
      const iconExt = path.extname(iconPathInJar) || '.png'
      const safeIconPath = iconPathInJar.replace(/[^a-zA-Z0-9.]/g, '_').slice(0, 50)
      const cacheBaseName = `${path.basename(
        jarFileName,
        path.extname(jarFileName)
      )}__${safeIconPath}${iconExt}`
      const cachePath = path.join(this.cacheDir, cacheBaseName)

      // 已缓存则读取缓存文件转 base64
      try {
        await fs.access(cachePath)
        const cachedData = await fs.readFile(cachePath)
        return this.bufferToDataUrl(cachedData, iconPathInJar)
      } catch {
        // 未缓存，继续提取
      }

      // 复用传入的 zip，避免重复打开同一个 jar
      const zipToUse = zip || new AdmZip(jarPath)
      const entry = zipToUse.getEntry(iconPathInJar)
      if (!entry) {
        log.warn(`[ModService] 图标在 jar 中未找到: ${iconPathInJar}`)
        return undefined
      }

      const iconData: Buffer = zip.readFile(entry)
      if (!iconData) {
        log.warn(`[ModService] 读取图标数据失败: ${iconPathInJar}`)
        return undefined
      }

      await fs.writeFile(cachePath, iconData)
      return this.bufferToDataUrl(iconData, iconPathInJar)
    } catch (e: any) {
      log.warn('[ModService] 提取图标失败:', e?.message)
      return undefined
    }
  }

  /**
   * 将图标 Buffer 转为 base64 data URL
   */
  private bufferToDataUrl(buf: Buffer, iconPathInJar: string): string {
    const ext = path.extname(iconPathInJar).slice(1).toLowerCase()
    const mime =
      ext === 'png'
        ? 'image/png'
        : ext === 'jpg' || ext === 'jpeg'
          ? 'image/jpeg'
          : ext === 'gif'
            ? 'image/gif'
            : ext === 'webp'
              ? 'image/webp'
              : 'image/png'
    return `data:${mime};base64,${buf.toString('base64')}`
  }

  /**
   * 安装 Mod（复制文件到 mods 目录）
   */
  async installMod(sourcePath: string, gameDir: string): Promise<ModInfo | null> {
    try {
      const fileName = path.basename(sourcePath)
      const destDir = this.getModsDir(gameDir)
      const destPath = path.join(destDir, fileName)

      await fs.mkdir(destDir, { recursive: true })
      await fs.copyFile(sourcePath, destPath)

      const stat = await fs.stat(destPath)
      const modInfo = await this.readModInfo(destPath)

      return {
        id: this.generateModId(fileName),
        name: modInfo.name || this.extractModName(fileName),
        version: modInfo.version || 'Unknown',
        description: modInfo.description,
        authors: modInfo.authors,
        url: modInfo.url,
        filePath: destPath,
        fileName,
        size: stat.size,
        enabled: true,
        loader: modInfo.loader,
        mcVersion: modInfo.mcVersion,
        dependencies: modInfo.dependencies,
        logoUrl: modInfo.logoUrl
      }
    } catch (error) {
      log.error('[ModService] 安装 Mod 失败:', error)
      return null
    }
  }

  /**
   * 卸载 Mod（删除文件）
   */
  async uninstallMod(modInfo: ModInfo): Promise<boolean> {
    try {
      await fs.unlink(modInfo.filePath)
      this.modInfoCache.delete(modInfo.filePath)
      return true
    } catch (error) {
      log.error('[ModService] 卸载 Mod 失败:', error)
      return false
    }
  }

  /**
   * 启用 Mod（重命名恢复）
   */
  async enableMod(modInfo: ModInfo): Promise<boolean> {
    if (!modInfo.fileName.includes('.disabled')) return true
    try {
      const newFileName = modInfo.fileName.replace(/\.disabled$/, '')
      const newPath = path.join(path.dirname(modInfo.filePath), newFileName)
      await fs.rename(modInfo.filePath, newPath)
      this.modInfoCache.delete(modInfo.filePath)
      return true
    } catch (error) {
      log.error('[ModService] 启用 Mod 失败:', error)
      return false
    }
  }

  /**
   * 禁用 Mod（重命名为 .disabled）
   */
  async disableMod(modInfo: ModInfo): Promise<boolean> {
    if (modInfo.fileName.endsWith('.disabled')) return true
    try {
      const disabledFileName = modInfo.fileName + '.disabled'
      const disabledPath = path.join(path.dirname(modInfo.filePath), disabledFileName)
      await fs.rename(modInfo.filePath, disabledPath)
      this.modInfoCache.delete(modInfo.filePath)
      return true
    } catch (error) {
      log.error('[ModService] 禁用 Mod 失败:', error)
      return false
    }
  }

  /**
   * 批量安装 Mod
   */
  async installMods(
    sourcePaths: string[],
    gameDir: string
  ): Promise<{ success: ModInfo[]; failed: string[] }> {
    const success: ModInfo[] = []
    const failed: string[] = []

    for (const sourcePath of sourcePaths) {
      const mod = await this.installMod(sourcePath, gameDir)
      if (mod) {
        success.push(mod)
      } else {
        failed.push(sourcePath)
      }
    }

    return { success, failed }
  }

  /**
   * 检查 Mod 兼容性
   */
  async checkCompatibility(
    mods: ModInfo[],
    targetVersion: string,
    loader?: string
  ): Promise<{
    compatible: ModInfo[]
    incompatible: { mod: ModInfo; reason: string }[]
    missingDeps: { mod: ModInfo; deps: string[] }[]
  }> {
    const compatible: ModInfo[] = []
    const incompatible: { mod: ModInfo; reason: string }[] = []
    const missingDeps: { mod: ModInfo; deps: string[] }[] = []

    for (const mod of mods) {
      let reason: string | null = null

      if (mod.mcVersion && mod.mcVersion !== targetVersion) {
        reason = `需要 Minecraft ${mod.mcVersion}，当前版本 ${targetVersion}`
      }

      if (loader && mod.loader && mod.loader !== loader) {
        reason = `需要 ${mod.loader}，当前选择 ${loader}`
      }

      if (reason) {
        incompatible.push({ mod, reason })
      } else {
        compatible.push(mod)
      }
    }

    return { compatible, incompatible, missingDeps }
  }

  /**
   * 获取 Mod 文件大小（格式化）
   */
  formatModSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  /**
   * 创建 mods 目录（如果不存在）
   */
  async ensureModsDir(gameDir: string): Promise<string> {
    const modsDir = this.getModsDir(gameDir)
    await fs.mkdir(modsDir, { recursive: true })
    return modsDir
  }

  // ─────────────────────────────────────────────
  // Mod 更新检测（Modrinth API）
  // ─────────────────────────────────────────────

  /**
   * 计算文件 sha1 hash
   */
  async computeFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha1')
      const stream = createReadStream(filePath)
      stream.on('data', (chunk: string | Buffer) => hash.update(chunk))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', reject)
    })
  }

  /**
   * 批量检查 mod 是否有更新（通过 Modrinth API）
   * @param mods 需要检查的 mod 列表
   * @param mcVersion 当前 MC 版本（用于过滤兼容版本），传 undefined 则不过滤
   * @param loader mod loader 类型（如 'fabric'/'forge'），传 undefined 则不过滤
   */
  async checkModsUpdate(
    mods: ModInfo[],
    mcVersion?: string,
    loader?: string
  ): Promise<ModUpdateInfo[]> {
    // 只检查已启用的 .jar 文件
    const enabledMods = mods.filter((m) => m.enabled && m.filePath.endsWith('.jar'))
    if (enabledMods.length === 0) return []

    // 计算所有 hash（并发）
    const hashResults = await Promise.allSettled(
      enabledMods.map(async (m) => ({
        mod: m,
        hash: await this.computeFileHash(m.filePath)
      }))
    )

    const hashMap: { mod: ModInfo; hash: string }[] = []
    for (const r of hashResults) {
      if (r.status === 'fulfilled') hashMap.push(r.value)
    }

    if (hashMap.length === 0) return []

    // 用 hash 批量查 Modrinth（POST /version_files）
    const hashToMod = new Map(hashMap.map((h) => [h.hash, h]))
    const hashes = hashMap.map((h) => h.hash)

    let currentVersions: Record<string, MrVersionFile> = {}
    try {
      const resp = await fetch(`${MR_BASE}/version_files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'VoxVer-Launcher/1.0'
        },
        body: JSON.stringify({ hashes, algorithm: 'sha1' })
      })
      if (resp.ok) {
        currentVersions = (await resp.json()) as Record<string, MrVersionFile>
      }
    } catch (e) {
      log.error('[ModService] Modrinth version_files API 失败:', e)
    }

    const results: ModUpdateInfo[] = []

    for (const { mod, hash } of hashMap) {
      const currentVer = currentVersions[hash]
      if (!currentVer) {
        // hash 不在 Modrinth 上（本地 mod 或私有 mod），跳过
        results.push({ filePath: mod.filePath, hash, hasUpdate: false })
        continue
      }

      // 查该项目的最新版本
      let latestVer: MrVersionFile | null = null
      try {
        const qs = new URLSearchParams()
        if (mcVersion) qs.set('game_versions', JSON.stringify([mcVersion]))
        if (loader) qs.set('loaders', JSON.stringify([loader]))
        const query = qs.toString() ? `?${qs}` : ''
        const verResp = await fetch(`${MR_BASE}/project/${currentVer.project_id}/version${query}`, {
          headers: { 'User-Agent': 'VoxVer-Launcher/1.0' }
        })
        if (verResp.ok) {
          const versions = (await verResp.json()) as MrVersionFile[]
          // 优先取 release，其次 beta/alpha，取第一个（最新）
          const releases = versions.filter((v) => v.version_type === 'release')
          latestVer = releases.length > 0 ? releases[0] : (versions[0] ?? null)
        }
      } catch (e) {
        log.error('[ModService] 查最新版本失败:', e)
      }

      const hasUpdate = latestVer ? latestVer.id !== currentVer.id : false
      const primaryFile = latestVer?.files.find((f) => f.primary) ?? latestVer?.files[0]

      results.push({
        filePath: mod.filePath,
        hash,
        hasUpdate,
        projectId: currentVer.project_id,
        currentVersionName: currentVer.version_number,
        latestVersionId: latestVer?.id,
        latestVersionName: latestVer?.version_number,
        latestDownloadUrl: primaryFile?.url,
        latestFileName: primaryFile?.filename,
        latestFileSize: primaryFile?.size
      })
    }

    return results
  }

  /**
   * 下载并替换 mod 到最新版本
   * @param mod 当前 mod 信息
   * @param updateInfo 更新信息（来自 checkModsUpdate）
   * @param onProgress 下载进度回调（0~1）
   */
  async updateMod(
    mod: ModInfo,
    updateInfo: ModUpdateInfo,
    onProgress?: (progress: number) => void
  ): Promise<ModInfo | null> {
    if (!updateInfo.latestDownloadUrl || !updateInfo.latestFileName) {
      log.error('[ModService] 更新信息不完整')
      return null
    }

    const destDir = path.dirname(mod.filePath)
    const newFilePath = path.join(destDir, updateInfo.latestFileName)

    try {
      // 下载新版本
      const resp = await fetch(updateInfo.latestDownloadUrl, {
        headers: { 'User-Agent': 'VoxVer-Launcher/1.0' }
      })
      if (!resp.ok) throw new Error(`下载失败: ${resp.status} ${resp.statusText}`)

      const contentLength = Number(resp.headers.get('content-length') ?? '0')
      const chunks: Buffer[] = []
      let downloaded = 0

      if (resp.body) {
        const reader = resp.body.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(Buffer.from(value))
          downloaded += value.length
          if (contentLength > 0 && onProgress) {
            onProgress(downloaded / contentLength)
          }
        }
      }

      const buffer = Buffer.concat(chunks)
      await fs.writeFile(newFilePath, buffer)

      // 删除旧文件（如果新旧文件名不同）
      if (newFilePath !== mod.filePath) {
        try {
          await fs.unlink(mod.filePath)
        } catch {
          /* ignore */
        }
      }

      onProgress?.(1)

      // 读取新文件信息
      const stat = await fs.stat(newFilePath)
      const modInfo = await this.readModInfo(newFilePath)
      const newFileName = path.basename(newFilePath)

      return {
        ...mod,
        filePath: newFilePath,
        fileName: newFileName,
        version: modInfo.version || updateInfo.latestVersionName || mod.version,
        name: modInfo.name || mod.name,
        description: modInfo.description || mod.description,
        logoUrl: modInfo.logoUrl || mod.logoUrl,
        size: stat.size
      }
    } catch (e: any) {
      log.error('[ModService] 更新 mod 失败:', e)
      return null
    }
  }

  // ─────────────────────────────────────────────
  // Mod 依赖管理（Modrinth API）
  // ─────────────────────────────────────────────

  private modrinthService: ModrinthService = new ModrinthService()

  /**
   * 检查单个 Mod 的依赖关系
   * @param mod 要检查的 Mod
   * @param installedMods 已安装的 Mod 列表（用于比对）
   * @param mcVersion MC 版本
   * @param loader ModLoader 类型
   */
  async checkModDependencies(
    mod: ModInfo,
    installedMods: ModInfo[],
    mcVersion?: string,
    loader?: string
  ): Promise<ModDependencyCheckResult> {
    const result: ModDependencyCheckResult = {
      mod,
      dependencies: [],
      missingDependencies: [],
      installedDependencies: []
    }

    try {
      const hash = await this.computeFileHash(mod.filePath)
      const versionInfo = await this.getVersionByHash(hash)

      if (!versionInfo) {
        return result
      }

      const dependencies = await this.getVersionDependencies(versionInfo.id)
      result.dependencies = dependencies

      const installedIds = new Set<string>()
      for (const installedMod of installedMods) {
        if (installedMod.filePath === mod.filePath) continue
        try {
          const installedHash = await this.computeFileHash(installedMod.filePath)
          const installedVersion = await this.getVersionByHash(installedHash)
          if (installedVersion) {
            installedIds.add(installedVersion.project_id)
          }
        } catch {
          // 忽略计算失败的 mod
        }
      }

      for (const dep of dependencies) {
        if (dep.dependency_type === 'required') {
          if (installedIds.has(dep.project_id)) {
            result.installedDependencies.push(dep)
          } else {
            result.missingDependencies.push(dep)
          }
        }
      }

      if (result.missingDependencies.length > 0) {
        const projectIds = result.missingDependencies.map((d) => d.project_id)
        const projects = await this.modrinthService.getProjects(projectIds)
        const projectMap = new Map(projects.map((p) => [p.id, p]))
        result.missingDependencies = result.missingDependencies.map((d) => ({
          ...d,
          project: projectMap.get(d.project_id)
        }))
      }
    } catch (e) {
      log.error('[ModService] 检查 Mod 依赖失败:', e)
    }

    return result
  }

  /**
   * 批量检查 Mod 依赖
   */
  async checkModsDependencies(
    mods: ModInfo[],
    mcVersion?: string,
    loader?: string
  ): Promise<ModDependencyCheckResult[]> {
    const enabledMods = mods.filter((m) => m.enabled && m.filePath.endsWith('.jar'))
    if (enabledMods.length === 0) return []

    const results: ModDependencyCheckResult[] = []

    for (const mod of enabledMods) {
      const result = await this.checkModDependencies(mod, enabledMods, mcVersion, loader)
      results.push(result)
    }

    return results
  }

  /**
   * 通过 hash 获取版本信息
   */
  private async getVersionByHash(hash: string): Promise<MrVersionFile | null> {
    try {
      const resp = await fetch(`${MR_BASE}/version_file/${hash}?algorithm=sha1`, {
        headers: { 'User-Agent': 'VoxVer-Launcher/1.0' }
      })
      if (resp.ok) {
        return (await resp.json()) as MrVersionFile
      }
      return null
    } catch (e) {
      log.warn('[ModService] 通过 hash 获取版本信息失败:', hash, e)
      return null
    }
  }

  /**
   * 获取版本的依赖关系
   */
  private async getVersionDependencies(versionId: string): Promise<ModDependencyInfo[]> {
    try {
      const resp = await fetch(`${MR_BASE}/version/${versionId}`, {
        headers: { 'User-Agent': 'VoxVer-Launcher/1.0' }
      })
      if (resp.ok) {
        const data = (await resp.json()) as any
        return (data.dependencies || []) as ModDependencyInfo[]
      }
      return []
    } catch (e) {
      log.warn('[ModService] 获取版本依赖失败:', versionId, e)
      return []
    }
  }

  /**
   * 自动安装缺失的依赖
   * @param mod 目标 Mod
   * @param gameDir 游戏目录
   * @param mcVersion MC 版本
   * @param loader ModLoader 类型
   * @param onProgress 进度回调
   */
  async installMissingDependencies(
    mod: ModInfo,
    gameDir: string,
    mcVersion?: string,
    loader?: string,
    onProgress?: (depName: string, progress: number) => void
  ): Promise<{ success: ModInfo[]; failed: string[] }> {
    const installedMods = await this.getInstalledMods(gameDir)
    const depCheck = await this.checkModDependencies(mod, installedMods, mcVersion, loader)

    const success: ModInfo[] = []
    const failed: string[] = []

    for (const dep of depCheck.missingDependencies) {
      if (dep.dependency_type !== 'required') continue

      try {
        onProgress?.(dep.project?.title || dep.project_id, 0)

        const versions = await this.modrinthService.getProjectVersions(dep.project_id, {
          game_versions: mcVersion ? [mcVersion] : undefined,
          loaders: loader ? [loader] : undefined
        })

        if (versions.length === 0) {
          failed.push(dep.project?.title || dep.project_id)
          continue
        }

        const latestVersion = versions[0]
        const primaryFile = latestVersion.files.find((f) => f.primary) || latestVersion.files[0]

        if (!primaryFile) {
          failed.push(dep.project?.title || dep.project_id)
          continue
        }

        const tempPath = path.join(gameDir, 'mods', `temp_${dep.project_id}.jar`)
        await this.downloadFile(primaryFile.url, tempPath, (progress) => {
          onProgress?.(dep.project?.title || dep.project_id, progress)
        })

        const installedMod = await this.installMod(tempPath, gameDir)
        try {
          await fs.unlink(tempPath)
        } catch {
          /* ignore */
        }

        if (installedMod) {
          success.push(installedMod)
        } else {
          failed.push(dep.project?.title || dep.project_id)
        }

        onProgress?.(dep.project?.title || dep.project_id, 1)
      } catch (e) {
        log.error('[ModService] 安装依赖失败:', dep.project_id, e)
        failed.push(dep.project?.title || dep.project_id)
      }
    }

    return { success, failed }
  }

  /**
   * 下载文件到指定路径
   */
  private async downloadFile(
    url: string,
    destPath: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'VoxVer-Launcher/1.0' }
    })
    if (!resp.ok) throw new Error(`下载失败: ${resp.status} ${resp.statusText}`)

    const contentLength = Number(resp.headers.get('content-length') ?? '0')
    const chunks: Buffer[] = []
    let downloaded = 0

    if (resp.body) {
      const reader = resp.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(Buffer.from(value))
        downloaded += value.length
        if (contentLength > 0 && onProgress) {
          onProgress(downloaded / contentLength)
        }
      }
    }

    const buffer = Buffer.concat(chunks)
    await fs.writeFile(destPath, buffer)
  }
}

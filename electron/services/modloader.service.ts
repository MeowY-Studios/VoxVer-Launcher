/**
 * ModLoader 服务（调度层）
 * Forge / NeoForge / Fabric / Quilt 四个加载器由 adapters/loaders 下的适配器实现，
 * 本服务负责适配器注册、版本列表分发、安装入口与进度回调转发。
 * OptiFine 非 ModLoaderType，保留原有内联实现。
 */
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import * as path from 'path'
import axios from 'axios'
import type { GameInstance, ModLoader, ModLoaderType } from '../types/adapter.types'
import { logger } from '../utils/logger'
import { downloadFile } from '../adapters/loaders/download'
import type { ILoaderAdapter, InstallationProgress } from '../adapters/loaders/ILoaderAdapter'
import { ForgeAdapter } from '../adapters/loaders/forge.adapter'
import { NeoForgeAdapter } from '../adapters/loaders/neoforge.adapter'
import { FabricAdapter } from '../adapters/loaders/fabric.adapter'
import { QuiltAdapter } from '../adapters/loaders/quilt.adapter'

const log = logger.child('ModLoaderService')

const OPTIFINE_BASE = 'https://optifine.net'

export class ModLoaderService {
  private adapters: Map<ModLoaderType, ILoaderAdapter> = new Map()
  private progressCallback?: (progress: InstallationProgress) => void

  /** OptiFine 支持的 MC 版本（保留原有静态列表） */
  private readonly optifineSupportedVersions = [
    '1.7.10',
    '1.8.9',
    '1.9.4',
    '1.10.2',
    '1.11.2',
    '1.12.2',
    '1.14.4',
    '1.15.2',
    '1.16.1',
    '1.16.3',
    '1.16.5',
    '1.17.1',
    '1.18.1',
    '1.18.2',
    '1.19',
    '1.19.1',
    '1.19.2',
    '1.19.3',
    '1.19.4',
    '1.20',
    '1.20.1',
    '1.20.2',
    '1.20.4',
    '1.20.5',
    '1.20.6',
    '1.21',
    '1.21.1',
    '1.21.3',
    '1.21.4'
  ]

  constructor() {
    const loaderAdapters: ILoaderAdapter[] = [
      new ForgeAdapter(),
      new NeoForgeAdapter(),
      new FabricAdapter(),
      new QuiltAdapter()
    ]
    for (const adapter of loaderAdapters) {
      this.adapters.set(adapter.type, adapter)
    }
  }

  setProgressCallback(callback?: (progress: InstallationProgress) => void) {
    this.progressCallback = callback
  }

  private reportProgress(progress: InstallationProgress) {
    if (this.progressCallback) {
      this.progressCallback(progress)
    }
  }

  /**
   * 获取指定类型的加载器适配器
   */
  getAdapter(loaderType: ModLoaderType): ILoaderAdapter | undefined {
    return this.adapters.get(loaderType)
  }

  /**
   * 获取指定 MC 版本支持的 ModLoader 版本列表
   */
  async getLoaderVersionList(mcVersion: string, loaderType: string): Promise<string[]> {
    try {
      const adapter = this.adapters.get(loaderType as ModLoaderType)
      if (adapter) {
        return await adapter.getVersions(mcVersion)
      }
      if (loaderType === 'optifine') {
        return await this.getOptiFineVersionsForMinecraft(mcVersion)
      }
      return []
    } catch (err: unknown) {
      log.warn(`获取 ${loaderType} 版本列表失败:`, (err as Error).message)
      return []
    }
  }

  // ==================== 加载器安装（IPC 具名入口） ====================

  async installForge(gameDir: string, mcVersion: string, loaderVersion?: string): Promise<void> {
    await this.runAdapterInstall('forge', gameDir, mcVersion, loaderVersion)
  }

  async installNeoForge(gameDir: string, mcVersion: string, loaderVersion?: string): Promise<void> {
    await this.runAdapterInstall('neoforge', gameDir, mcVersion, loaderVersion)
  }

  async installFabric(gameDir: string, mcVersion: string, loaderVersion?: string): Promise<void> {
    await this.runAdapterInstall('fabric', gameDir, mcVersion, loaderVersion)
  }

  async installQuilt(gameDir: string, mcVersion: string, loaderVersion?: string): Promise<void> {
    await this.runAdapterInstall('quilt', gameDir, mcVersion, loaderVersion)
  }

  /**
   * 委托适配器执行安装并转发进度
   */
  public async runAdapterInstall(
    loaderType: ModLoaderType,
    gameDir: string,
    mcVersion: string,
    loaderVersion?: string
  ): Promise<void> {
    const adapter = this.adapters.get(loaderType)
    if (!adapter) {
      throw new Error(`不支持的 Mod 加载器类型: ${loaderType}`)
    }
    await adapter.install({
      gameDir,
      mcVersion,
      loaderVersion,
      onProgress: (progress) => this.reportProgress(progress)
    })
  }

  /**
   * 获取指定 Minecraft 版本支持的 Mod 加载器
   */
  public async getModLoaders(minecraftVersion: string): Promise<ModLoader[]> {
    const loaders: ModLoader[] = []

    for (const adapter of this.adapters.values()) {
      if (await this.isLoaderSupported(minecraftVersion, adapter.type)) {
        loaders.push({
          type: adapter.type,
          name: adapter.name,
          supportedVersions: adapter.supportedVersions
        })
      }
    }

    if (this.optifineSupportedVersions.includes(minecraftVersion)) {
      loaders.push({
        type: 'optifine' as ModLoaderType,
        name: 'OptiFine',
        supportedVersions: this.optifineSupportedVersions
      })
    }

    return loaders
  }

  /** 支持性判断缓存：加载器类型 + MC 版本 -> 结果 */
  private supportCache = new Map<string, { supported: boolean; at: number }>()
  private readonly supportCacheTtl = 10 * 60 * 1000

  /**
   * 指定 MC 版本是否支持某个加载器
   * 以加载器官方版本列表为准（带缓存），OptiFine 用静态列表
   */
  public async isLoaderSupported(mcVersion: string, loaderType: string): Promise<boolean> {
    if (loaderType === 'optifine') {
      return this.optifineSupportedVersions.includes(mcVersion)
    }
    const adapter = this.adapters.get(loaderType as ModLoaderType)
    if (!adapter) return false

    const cacheKey = `${loaderType}:${mcVersion}`
    const cached = this.supportCache.get(cacheKey)
    if (cached && Date.now() - cached.at < this.supportCacheTtl) {
      return cached.supported
    }

    const supported = await adapter.isSupported(mcVersion)
    this.supportCache.set(cacheKey, { supported, at: Date.now() })
    return supported
  }

  /**
   * 安装 Mod 加载器到游戏实例（统一入口）
   */
  public async installModLoader(instance: GameInstance, loaderType: string): Promise<void> {
    const adapter = this.adapters.get(loaderType as ModLoaderType)

    if (!adapter && loaderType !== 'optifine') {
      throw new Error(`不支持的 Mod 加载器类型: ${loaderType}`)
    }
    if (!(await this.isLoaderSupported(instance.version, loaderType))) {
      throw new Error(`版本 ${instance.version} 不支持 ${adapter?.name ?? 'OptiFine'} 加载器`)
    }

    this.reportProgress({
      stage: 'downloading',
      progress: 0,
      message: `开始安装 ${adapter?.name ?? 'OptiFine'}...`
    })

    switch (loaderType) {
      case 'forge':
      case 'neoforge':
      case 'fabric':
      case 'quilt':
        await this.runAdapterInstall(
          loaderType as ModLoaderType,
          instance.gameDir,
          instance.version
        )
        break
      case 'optifine':
        await this.installOptiFine(instance.gameDir, instance.version)
        break
      default:
        throw new Error(`不支持的 Mod 加载器: ${loaderType}`)
    }
  }

  /** 版本下载后安装加载器/扩展（不依赖实例ID，直接传入版本和目录） */
  public async installForVersion(
    mcVersion: string,
    gameDir: string,
    loaderType: string,
    loaderVersion?: string,
    optifineVersion?: string
  ): Promise<void> {
    if (loaderType === 'optifine') {
      if (!(await this.isLoaderSupported(mcVersion, 'optifine'))) {
        throw new Error(`版本 ${mcVersion} 不支持 OptiFine 加载器`)
      }
      await this.installOptiFine(gameDir, mcVersion, optifineVersion)
      return
    }
    const adapter = this.adapters.get(loaderType as ModLoaderType)
    if (!adapter) {
      throw new Error(`不支持的 Mod 加载器类型: ${loaderType}`)
    }
    if (!(await this.isLoaderSupported(mcVersion, loaderType))) {
      throw new Error(`版本 ${mcVersion} 不支持 ${adapter.name} 加载器`)
    }
    await adapter.install({
      gameDir,
      mcVersion,
      loaderVersion,
      onProgress: (progress) => this.reportProgress(progress)
    })
  }

  // ==================== OptiFine 相关功能（保留原有实现） ====================

  /**
   * 获取指定 Minecraft 版本的 OptiFine 版本列表
   */
  private async getOptiFineVersionsForMinecraft(mcVersion: string): Promise<string[]> {
    try {
      this.reportProgress({
        stage: 'downloading',
        progress: 5,
        message: '获取 OptiFine 版本信息...'
      })

      // 以 OptiFine 官网下载页为准，静态表容易过期（例如 1.20.4 实际是 HD_U_I7）
      try {
        const response = await axios.get(`${OPTIFINE_BASE}/downloads`)
        const html = String(response.data)

        const versions: string[] = []
        const regex = new RegExp(`OptiFine_${mcVersion.replace(/\./g, '\\.')}_(HD_U_[A-Za-z0-9]+)`, 'g')
        let match: RegExpExecArray | null
        while ((match = regex.exec(html)) !== null) {
          if (!versions.includes(match[1])) versions.push(match[1])
        }

        if (versions.length > 0) {
          return versions
        }
        // 官网确认没有该 MC 版本的 OptiFine，直接返回空
        return []
      } catch {
        log.warn('无法从 OptiFine 官网获取版本，使用默认列表')
      }

      // 仅在网络失败时回退静态表
      if (!this.optifineSupportedVersions.includes(mcVersion)) {
        return []
      }

      // 返回默认的 OptiFine 版本列表（基于常见版本）
      const defaultVersions: Record<string, string[]> = {
        '1.21.4': ['Ultra'],
        '1.21.3': ['Ultra'],
        '1.21.1': ['Ultra'],
        '1.21': ['Ultra'],
        '1.20.6': ['Ultra'],
        '1.20.5': ['Ultra'],
        '1.20.4': ['Ultra', 'HD_U_I5'],
        '1.20.2': ['Ultra', 'HD_U_H9'],
        '1.20.1': ['Ultra', 'HD_U_G8', 'HD_U_G5'],
        '1.20': ['Ultra', 'HD_U_G3'],
        '1.19.4': ['Ultra', 'HD_U_I5', 'HD_U_H9'],
        '1.19.3': ['Ultra', 'HD_U_G8'],
        '1.19.2': ['Ultra', 'HD_U_G8', 'HD_U_G5', 'HD_U_I5'],
        '1.19.1': ['Ultra', 'HD_U_G5'],
        '1.19': ['Ultra', 'HD_U_G3'],
        '1.18.2': ['Ultra', 'HD_U_H9', 'HD_U_H5'],
        '1.18.1': ['Ultra', 'HD_U_H3'],
        '1.17.1': ['Ultra', 'HD_U_G8', 'HD_U_G5'],
        '1.16.5': ['Ultra', 'HD_U_G8', 'HD_U_G5', 'HD_U_F8'],
        '1.16.3': ['Ultra', 'HD_U_F5'],
        '1.16.1': ['Ultra', 'HD_U_F3'],
        '1.15.2': ['Ultra', 'HD_U_F8', 'HD_U_F5'],
        '1.14.4': ['Ultra', 'HD_U_E8', 'HD_U_E5'],
        '1.12.2': ['Ultra', 'HD_U_F8', 'HD_U_F5', 'HD_U_E3'],
        '1.11.2': ['Ultra', 'HD_U_E8'],
        '1.10.2': ['Ultra', 'HD_U_D8'],
        '1.9.4': ['Ultra', 'HD_U_D5'],
        '1.8.9': ['Ultra', 'HD_U_F8', 'HD_U_F5', 'HD_U_M5'],
        '1.7.10': ['Ultra', 'HD_U_E8', 'HD_U_E5', 'HD_U_D3']
      }

      return (defaultVersions[mcVersion] || []).filter((v) => v !== 'Ultra')
    } catch (error) {
      log.error(`[OptiFine] 获取 ${mcVersion} 的 OptiFine 版本失败:`, error)
      return []
    }
  }

  /**
   * 安装 OptiFine
   */
  async installOptiFine(
    gameDir: string,
    mcVersion: string,
    optifineVersion?: string
  ): Promise<void> {
    this.reportProgress({ stage: 'downloading', progress: 0, message: '获取 OptiFine 版本信息...' })

    // 以官网实际发布的版本为准，忽略非法的 flag 值（例如 'optifine'）
    const available = await this.getOptiFineVersionsForMinecraft(mcVersion)
    const requested = optifineVersion?.startsWith('HD_U_') ? optifineVersion : undefined
    const targetVersion =
      requested && available.includes(requested) ? requested : available[0]
    if (!targetVersion) {
      throw new Error(`Minecraft ${mcVersion} 没有可用的 OptiFine 版本`)
    }

    const optifineFullVersion = `OptiFine_${mcVersion}_${targetVersion}`
    const fileName = `${optifineFullVersion}.jar`
    const installerPath = path.join(gameDir, 'temp', fileName)

    // 确保目录存在
    await fs.mkdir(path.dirname(installerPath), { recursive: true })

    this.reportProgress({ stage: 'downloading', progress: 10, message: `下载 OptiFine ${targetVersion}...` })

    // OptiFine 的下载链接是 adloadx 页面动态生成的一次性 token，不能硬编码
    const downloadUrl = await this.resolveOptiFineDownloadUrl(fileName)
    await downloadFile(
      downloadUrl,
      installerPath,
      (progress) => {
        this.reportProgress({
          stage: 'downloading',
          progress: 10 + progress * 0.35,
          message: `下载中... ${Math.round(progress * 100)}%`
        })
      },
      {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Referer: `${OPTIFINE_BASE}/adloadx?f=${fileName}`
      }
    )

    // 官网在文件名/版本不存在时会返回 HTML 错误页而不是 404，这里校验 jar 文件头
    const invalidReason = await this.checkJarFile(installerPath)
    if (invalidReason) {
      try {
        await fs.unlink(installerPath)
      } catch {
        // 忽略清理失败
      }
      throw new Error(`OptiFine 安装包下载失败：${invalidReason}（${fileName}）`)
    }

    this.reportProgress({ stage: 'installing', progress: 45, message: '安装 OptiFine...' })

    // 运行 OptiFine 安装器
    await this.runOptiFineInstaller(installerPath, gameDir)

    // 清理临时文件
    try {
      await fs.unlink(installerPath)
    } catch {
      // 忽略清理失败
    }

    this.reportProgress({ stage: 'verifying', progress: 90, message: '验证安装...' })

    // 验证安装
    const optifineDir = path.join(gameDir, 'libraries', 'optifine')
    try {
      await fs.access(optifineDir)
    } catch (err) {
      log.warn('[OptiFine] 验证警告:', err)
    }

    this.reportProgress({ stage: 'complete', progress: 100, message: 'OptiFine 安装完成！' })
  }

  /**
   * 从 adloadx 页面解析真实下载链接
   * 页面内含一次性 token 的 downloadx?f=...&x=... 链接，硬编码 token 会得到 HTML 错误页
   */
  private async resolveOptiFineDownloadUrl(fileName: string): Promise<string> {
    const pageUrl = `${OPTIFINE_BASE}/adloadx?f=${fileName}`
    const response = await axios.get(pageUrl, {
      responseType: 'text',
      timeout: 30000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
      }
    })
    const html = String(response.data)
    const match = html.match(/downloadx\?[^"'>\s]+/)
    if (!match) {
      throw new Error(`OptiFine 官网未提供 ${fileName} 的下载链接，请确认该版本是否存在`)
    }
    return `${OPTIFINE_BASE}/${match[0].replace(/&amp;/g, '&')}`
  }

  /**
   * 校验文件是否为 jar（zip 头为 PK）
   * @returns 合法返回 null，否则返回原因
   */
  private async checkJarFile(filePath: string): Promise<string | null> {
    const handle = await fs.open(filePath, 'r')
    try {
      const buf = Buffer.alloc(8)
      const { bytesRead } = await handle.read(buf, 0, buf.length, 0)
      if (bytesRead < 2 || buf[0] !== 0x50 || buf[1] !== 0x4b) {
        const head = buf.subarray(0, bytesRead).toString('utf8').replace(/\s+/g, ' ').trim()
        return `文件内容不是 jar（开头为 "${head || '空文件'}"）`
      }
      return null
    } finally {
      await handle.close()
    }
  }

  /**
   * 运行 OptiFine 安装器
   */
  private async runOptiFineInstaller(installerPath: string, gameDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = ['-jar', installerPath]

      log.info(`[OptiFine] 运行安装器: java ${args.join(' ')}`)

      const child = spawn('java', args, {
        stdio: 'inherit',
        cwd: gameDir
      })

      child.on('close', (code) => {
        if (code === 0) {
          log.info('[OptiFine] 安装器成功完成')
          resolve()
        } else {
          log.error(`[OptiFine] 安装器退出码: ${code}`)
          reject(new Error(`OptiFine 安装器失败，退出码: ${code}`))
        }
      })

      child.on('error', (err) => {
        log.error('[OptiFine] 运行安装器出错:', err)
        reject(err)
      })
    })
  }
}

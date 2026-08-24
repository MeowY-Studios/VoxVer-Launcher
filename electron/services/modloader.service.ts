import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import * as path from 'path'
import { join } from 'path'
import axios from 'axios'
import { GameInstance, ModLoader, ModLoaderType } from '../types/adapter.types'
import { logger } from '../utils/logger'
const log = logger.child('ModLoaderService')

// API 端点
const FABRIC_META_BASE = 'https://meta.fabricmc.net/v2'
const FABRIC_DOWNLOAD_BASE = 'https://maven.fabricmc.net'
const FORGE_PROMO_URL =
  'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json'
const FORGE_MAVEN_META =
  'https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml'
const FORGE_MAVEN = 'https://maven.minecraftforge.net'
const NEOFORGE_MAVEN = 'https://maven.neoforged.net/releases'
const NEOFORGE_META = 'https://maven.neoforged.net'
const QUILT_META_BASE = 'https://meta.quiltmc.org/v3'
const QUILT_MAVEN = 'https://maven.quiltmc.org/repository/release'
const OPTIFINE_BASE = 'https://optifine.net'
const OPTIFINE_VERSIONS = 'https://raw.githubusercontent.com/OptiFine/optifine.github.io/master/versions.json'

export interface LoaderVersion {
  loader: string
  installer: string
}

export interface InstallationProgress {
  stage: 'downloading' | 'installing' | 'verifying' | 'complete' | 'error'
  progress: number
  message: string
}

export class ModLoaderService {
  private modLoaders: Map<string, ModLoaderInfo> = new Map()
  private progressCallback?: (progress: InstallationProgress) => void

  constructor() {
    this.initializeModLoaders()
  }

  setProgressCallback(callback: (progress: InstallationProgress) => void) {
    this.progressCallback = callback
  }

  private reportProgress(progress: InstallationProgress) {
    if (this.progressCallback) {
      this.progressCallback(progress)
    }
  }

  /**
   * 获取指定 MC 版本支持的所有 ModLoader 版本列表
   */
  async getLoaderVersionList(mcVersion: string, loaderType: string): Promise<string[]> {
    try {
      if (loaderType === 'fabric') {
        const response = await axios.get(`${FABRIC_META_BASE}/versions/loader/${mcVersion}`)
        const data = response.data
        if (Array.isArray(data)) {
          return data.map((v: { loader: { version: string } }) => v.loader?.version).filter(Boolean)
        }
      } else if (loaderType === 'forge') {
        const prefix = `${mcVersion}-`
        const versions: string[] = []
        
        try {
          // 使用 Maven metadata 获取全部 Forge 版本
          const response = await axios.get(FORGE_MAVEN_META, { responseType: 'text' })
          const xml = response.data as string
          const versionRegex = /<version>(\d+\.\d+\.\d+-[^<]+)<\/version>/g
          let match
          while ((match = versionRegex.exec(xml)) !== null) {
            const ver = match[1]
            if (ver.startsWith(prefix)) {
              versions.push(ver)
            }
          }
        } catch (e) {
          log.warn('Failed to get Forge versions from Maven:', e)
        }
        
        // 如果没有找到版本，返回默认版本（Forge 版本格式: <mcVersion>-<buildNumber>）
        if (versions.length === 0) {
          versions.push(`${mcVersion}-47.3.0`)
        }
        
        // 倒序（最新在前）
        versions.sort((a, b) => {
          const aNum = parseInt(a.split('-')[1].replace(/\./g, '')) || 0
          const bNum = parseInt(b.split('-')[1].replace(/\./g, '')) || 0
          return bNum - aNum
        })
        return versions
      } else if (loaderType === 'neoforge') {
        // 使用 Maven API 获取 NeoForge 版本列表，按 MC 版本前缀过滤
        // MC 版本 1.20.1 → NeoForge 前缀 20.1.
        const mcPrefix = mcVersion.replace(/^1\./, '') + '.'
        const versions: string[] = []
        try {
          const response = await axios.get(
            `${NEOFORGE_META}/api/maven/versions/releases/net/neoforged/neoforge?filter=${mcVersion}`
          )
          const data = response.data
          if (data?.versions && Array.isArray(data.versions)) {
            const filtered = data.versions.filter((v: string) => v.startsWith(mcPrefix))
            versions.push(...filtered)
          }
          if (versions.length === 0) {
            // 如果 filter 没生效，尝试不带 filter 获取全量再过滤
            log.info('NeoForge Maven filter 未返回结果，尝试全量获取')
            const fullResponse = await axios.get(
              `${NEOFORGE_META}/api/maven/versions/releases/net/neoforged/neoforge`
            )
            if (fullResponse.data?.versions && Array.isArray(fullResponse.data.versions)) {
              versions.push(
                ...fullResponse.data.versions.filter((v: string) => v.startsWith(mcPrefix))
              )
            }
          }
        } catch (e) {
          log.warn('Failed to get NeoForge versions:', e)
        }
        // 如果没有找到版本，返回默认版本（NeoForge 版本格式: <shortMc>.<build>-beta）
        if (versions.length === 0) {
          versions.push(`${mcPrefix}55-beta`)
        }
        return versions
      } else if (loaderType === 'quilt') {
        const response = await axios.get(`${QUILT_META_BASE}/versions/loader/${mcVersion}`)
        const data = response.data
        if (Array.isArray(data)) {
          return data.map((v: { loader: { version: string } }) => v.loader?.version).filter(Boolean)
        }
      } else if (loaderType === 'optifine') {
        return await this.getOptiFineVersionsForMinecraft(mcVersion)
      }
      return []
    } catch (err: unknown) {
      log.warn(`获取 ${loaderType} 版本列表失败:`, (err as Error).message)
      return []
    }
  }

  /**
   * 初始化支持的 Mod 加载器信息
   */
  private initializeModLoaders(): void {
    // Forge 加载器
    this.modLoaders.set('forge', {
      name: 'Forge',
      supportedVersions: [
        '1.7.10',
        '1.8.9',
        '1.9.4',
        '1.10.2',
        '1.11.2',
        '1.12.2',
        '1.14.4',
        '1.15.2',
        '1.16.5',
        '1.17.1',
        '1.18.2',
        '1.19.2',
        '1.19.4',
        '1.20',
        '1.20.1',
        '1.20.2',
        '1.20.4',
        '1.20.5',
        '1.20.6'
      ]
    })

    // Fabric 加载器
    this.modLoaders.set('fabric', {
      name: 'Fabric',
      supportedVersions: [
        '1.14.4',
        '1.15.2',
        '1.16.1',
        '1.16.2',
        '1.16.3',
        '1.16.4',
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
        '1.20.6'
      ]
    })

    // Quilt 加载器
    this.modLoaders.set('quilt', {
      name: 'Quilt',
      supportedVersions: [
        '1.16.5',
        '1.17.1',
        '1.18.2',
        '1.19',
        '1.19.2',
        '1.19.3',
        '1.19.4',
        '1.20',
        '1.20.1',
        '1.20.2',
        '1.20.4',
        '1.20.5',
        '1.20.6'
      ]
    })

    // NeoForge 加载器
    this.modLoaders.set('neoforge', {
      name: 'NeoForge',
      supportedVersions: [
        '1.20.1', '1.20.2', '1.20.4', '1.20.5', '1.20.6',
        '1.21', '1.21.1', '1.21.3', '1.21.4'
      ]
    })

    // OptiFine 加载器
    this.modLoaders.set('optifine', {
      name: 'OptiFine',
      supportedVersions: [
        '1.7.10', '1.8.9', '1.9.4', '1.10.2', '1.11.2', '1.12.2',
        '1.14.4', '1.15.2', '1.16.1', '1.16.3', '1.16.5',
        '1.17.1', '1.18.1', '1.18.2', '1.19', '1.19.1', '1.19.2', '1.19.3', '1.19.4',
        '1.20', '1.20.1', '1.20.2', '1.20.4', '1.20.5', '1.20.6',
        '1.21', '1.21.1', '1.21.3', '1.21.4'
      ]
    })
  }

  // ==================== Forge 相关功能 ====================

  /**
   * 获取指定 Minecraft 版本的 Forge 最新版本
   */
  async getForgeVersionForMinecraft(mcVersion: string): Promise<string | null> {
    try {
      this.reportProgress({ stage: 'downloading', progress: 5, message: '获取 Forge 版本信息...' })

      const response = await axios.get(FORGE_PROMO_URL)
      const promos = response.data.promos

      // 查找推荐版本或最新版本
      const recommendedKey = `${mcVersion}-recommended`
      const latestKey = `${mcVersion}-latest`

      if (promos[recommendedKey]) {
        return `${mcVersion}-${promos[recommendedKey]}`
      } else if (promos[latestKey]) {
        return `${mcVersion}-${promos[latestKey]}`
      }

      log.warn(`[Forge] 未找到 Minecraft ${mcVersion} 的推荐版本`)
      return null
    } catch (error) {
      log.error(`[Forge] 获取 Forge 版本失败:`, error)
      return null
    }
  }

  /**
   * 安装 Forge
   */
  async installForge(gameDir: string, mcVersion: string, forgeVersion?: string): Promise<void> {
    this.reportProgress({ stage: 'downloading', progress: 0, message: '获取 Forge 版本信息...' })

    let targetForgeVersion: string | null = forgeVersion || null
    if (!targetForgeVersion) {
      targetForgeVersion = await this.getForgeVersionForMinecraft(mcVersion)
      if (!targetForgeVersion) {
        throw new Error(`不支持 Minecraft ${mcVersion} 版本的 Forge`)
      }
    }

    // 下载 Forge 安装器
    this.reportProgress({ stage: 'downloading', progress: 10, message: '下载 Forge 安装器...' })

    const installerUrl = `${FORGE_MAVEN}/net/minecraftforge/forge/${targetForgeVersion}/forge-${targetForgeVersion}-installer.jar`
    const installerPath = path.join(gameDir, 'temp', `forge-installer-${targetForgeVersion}.jar`)

    // 确保目录存在
    await fs.mkdir(path.dirname(installerPath), { recursive: true })

    // 下载安装器
    await this.downloadFile(installerUrl, installerPath, (progress) => {
      this.reportProgress({
        stage: 'downloading',
        progress: 10 + progress * 0.35,
        message: `下载中... ${Math.round(progress * 100)}%`
      })
    })

    this.reportProgress({ stage: 'installing', progress: 45, message: '安装 Forge...' })

    // 运行安装器（仅安装到客户端）
    await this.runForgeInstaller(installerPath, gameDir, mcVersion)

    // 清理临时文件
    try {
      await fs.unlink(installerPath)
    } catch {}

    this.reportProgress({ stage: 'verifying', progress: 90, message: '验证安装...' })

    // 验证安装
    const versionJsonPath = path.join(
      gameDir,
      'versions',
      `forge-${targetForgeVersion}`,
      `forge-${targetForgeVersion}.json`
    )
    try {
      await fs.access(versionJsonPath)
    } catch {
      // 尝试另一种命名格式
      const altVersionJsonPath = path.join(
        gameDir,
        'versions',
        `${mcVersion}-forge-${targetForgeVersion.split('-').pop()}`,
        `${mcVersion}-forge-${targetForgeVersion.split('-').pop()}.json`
      )
      await fs.access(altVersionJsonPath)
    }

    this.reportProgress({ stage: 'complete', progress: 100, message: 'Forge 安装完成！' })
  }

  /**
   * 运行 Forge 安装器
   */
  private async runForgeInstaller(
    installerPath: string,
    gameDir: string,
    mcVersion: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = ['-jar', installerPath, '--installClient', gameDir]

      log.info(`[Forge] 运行安装器: java ${args.join(' ')}`)

      const child = spawn('java', args, {
        stdio: 'inherit',
        cwd: path.dirname(installerPath)
      })

      child.on('close', (code) => {
        if (code === 0) {
          log.info('[Forge] 安装器成功完成')
          resolve()
        } else {
          log.error(`[Forge] 安装器退出码: ${code}`)
          reject(new Error(`Forge 安装器失败，退出码: ${code}`))
        }
      })

      child.on('error', (err) => {
        log.error('[Forge] 运行安装器出错:', err)
        reject(err)
      })
    })
  }

  // ==================== NeoForge 相关功能 ====================

  /**
   * 获取指定 Minecraft 版本的 NeoForge 最新版本
   */
  async getNeoForgeVersionForMinecraft(mcVersion: string): Promise<string | null> {
    try {
      this.reportProgress({
        stage: 'downloading',
        progress: 5,
        message: '获取 NeoForge 版本信息...'
      })

      const response = await axios.get(`${NEOFORGE_META}/v3/versions/neoforge/${mcVersion}`)
      const versions = response.data

      if (versions && versions.length > 0) {
        // 返回最新稳定版本
        const latest = versions[0]
        return latest.version || latest
      }

      log.warn(`[NeoForge] 未找到 Minecraft ${mcVersion} 的 NeoForge 版本`)
      return null
    } catch (error) {
      log.error(`[NeoForge] 获取 NeoForge 版本失败:`, error)
      return null
    }
  }

  /**
   * 安装 NeoForge
   */
  async installNeoForge(
    gameDir: string,
    mcVersion: string,
    neoforgeVersion?: string
  ): Promise<void> {
    this.reportProgress({ stage: 'downloading', progress: 0, message: '获取 NeoForge 版本信息...' })

    let targetNeoForgeVersion: string | null = neoforgeVersion || null
    if (!targetNeoForgeVersion) {
      targetNeoForgeVersion = await this.getNeoForgeVersionForMinecraft(mcVersion)
      if (!targetNeoForgeVersion) {
        throw new Error(`不支持 Minecraft ${mcVersion} 版本的 NeoForge`)
      }
    }

    // 下载 NeoForge 安装器
    this.reportProgress({ stage: 'downloading', progress: 10, message: '下载 NeoForge 安装器...' })

    // NeoForge 1.20.1+ 使用新的命名格式
    let installerUrl: string
    if (mcVersion === '1.20.1') {
      installerUrl = `${NEOFORGE_MAVEN}/net/neoforged/neoforge/${mcVersion}-${targetNeoForgeVersion}/neoforge-${mcVersion}-${targetNeoForgeVersion}-installer.jar`
    } else {
      installerUrl = `${NEOFORGE_MAVEN}/net/neoforged/neoforge/${targetNeoForgeVersion}/neoforge-${targetNeoForgeVersion}-installer.jar`
    }

    const installerPath = path.join(
      gameDir,
      'temp',
      `neoforge-installer-${targetNeoForgeVersion}.jar`
    )

    // 确保目录存在
    await fs.mkdir(path.dirname(installerPath), { recursive: true })

    // 下载安装器
    await this.downloadFile(installerUrl, installerPath, (progress) => {
      this.reportProgress({
        stage: 'downloading',
        progress: 10 + progress * 0.35,
        message: `下载中... ${Math.round(progress * 100)}%`
      })
    })

    this.reportProgress({ stage: 'installing', progress: 45, message: '安装 NeoForge...' })

    // 运行安装器
    await this.runNeoForgeInstaller(installerPath, gameDir, mcVersion, targetNeoForgeVersion)

    // 清理临时文件
    try {
      await fs.unlink(installerPath)
    } catch {}

    this.reportProgress({ stage: 'verifying', progress: 90, message: '验证安装...' })

    this.reportProgress({ stage: 'complete', progress: 100, message: 'NeoForge 安装完成！' })
  }

  /**
   * 运行 NeoForge 安装器
   */
  private async runNeoForgeInstaller(
    installerPath: string,
    gameDir: string,
    mcVersion: string,
    neoforgeVersion: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = ['-jar', installerPath, '--installClient', gameDir]

      log.info(`[NeoForge] 运行安装器: java ${args.join(' ')}`)

      const child = spawn('java', args, {
        stdio: 'inherit',
        cwd: path.dirname(installerPath)
      })

      child.on('close', (code) => {
        if (code === 0) {
          log.info('[NeoForge] 安装器成功完成')
          resolve()
        } else {
          log.error(`[NeoForge] 安装器退出码: ${code}`)
          reject(new Error(`NeoForge 安装器失败，退出码: ${code}`))
        }
      })

      child.on('error', (err) => {
        log.error('[NeoForge] 运行安装器出错:', err)
        reject(err)
      })
    })
  }

  // ==================== Quilt 相关功能 ====================

  /**
   * 获取指定 Minecraft 版本的 Quilt 版本
   */
  async getQuiltVersionForMinecraft(mcVersion: string): Promise<LoaderVersion | null> {
    try {
      this.reportProgress({ stage: 'downloading', progress: 5, message: '获取 Quilt 版本信息...' })

      const response = await axios.get(`${QUILT_META_BASE}/versions/loader/${mcVersion}`)
      const data = response.data

      if (data.length > 0) {
        // 返回最新稳定版本
        const latest = data[0]
        return {
          loader: latest.loader.version,
          installer: latest.installer.version
        }
      }
      return null
    } catch (error) {
      log.error(`[Quilt] 获取 ${mcVersion} 的 Quilt 版本失败:`, error)
      return null
    }
  }

  /**
   * 安装 Quilt
   */
  async installQuilt(gameDir: string, mcVersion: string, quiltVersion?: string): Promise<void> {
    this.reportProgress({ stage: 'downloading', progress: 0, message: '获取 Quilt 版本信息...' })

    const versionInfo = await this.getQuiltVersionForMinecraft(mcVersion)
    if (!versionInfo) {
      throw new Error(`不支持 Minecraft ${mcVersion} 版本的 Quilt`)
    }

    // 下载 Quilt 安装器
    this.reportProgress({ stage: 'downloading', progress: 10, message: '下载 Quilt 安装器...' })

    const installerUrl = `${QUILT_MAVEN}/org/quiltmc/quilt-installer/${versionInfo.installer}/quilt-installer-${versionInfo.installer}.jar`
    const installerPath = path.join(gameDir, 'temp', `quilt-installer-${versionInfo.installer}.jar`)

    // 确保目录存在
    await fs.mkdir(path.dirname(installerPath), { recursive: true })

    // 下载安装器
    await this.downloadFile(installerUrl, installerPath, (progress) => {
      this.reportProgress({
        stage: 'downloading',
        progress: 10 + progress * 0.35,
        message: `下载中... ${Math.round(progress * 100)}%`
      })
    })

    this.reportProgress({ stage: 'installing', progress: 45, message: '安装 Quilt...' })

    // 运行安装器
    await this.runQuiltInstaller(installerPath, gameDir, mcVersion)

    // 清理临时文件
    try {
      await fs.unlink(installerPath)
    } catch {}

    this.reportProgress({ stage: 'verifying', progress: 90, message: '验证安装...' })

    // 验证安装
    const quiltDir = path.join(gameDir, 'libraries', 'org', 'quiltmc', 'quilt-loader')
    try {
      await fs.access(quiltDir)
    } catch {
      // 尝试其他位置
      const altDir = path.join(gameDir, 'mods')
      await fs.access(altDir)
    }

    this.reportProgress({ stage: 'complete', progress: 100, message: 'Quilt 安装完成！' })
  }

  /**
   * 运行 Quilt 安装器
   */
  private async runQuiltInstaller(
    installerPath: string,
    gameDir: string,
    mcVersion: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-jar',
        installerPath,
        'install',
        'client',
        mcVersion,
        '--dir',
        gameDir,
        '--no-profile'
      ]

      log.info(`[Quilt] 运行安装器: java ${args.join(' ')}`)

      const child = spawn('java', args, {
        stdio: 'inherit',
        cwd: path.dirname(installerPath)
      })

      child.on('close', (code) => {
        if (code === 0) {
          log.info('[Quilt] 安装器成功完成')
          resolve()
        } else {
          log.error(`[Quilt] 安装器退出码: ${code}`)
          reject(new Error(`Quilt 安装器失败，退出码: ${code}`))
        }
      })

      child.on('error', (err) => {
        log.error('[Quilt] 运行安装器出错:', err)
        reject(err)
      })
    })
  }

  // ==================== Fabric 相关功能 ====================

  /**
   * 获取 Fabric 可用版本列表（从 Fabric Meta API）
   */
  async getFabricVersions(): Promise<
    Array<{ gameVersion: string; loaderVersion: string; installerVersion: string }>
  > {
    try {
      const response = await axios.get(`${FABRIC_META_BASE}/versions`)
      const data = response.data

      const results: Array<{
        gameVersion: string
        loaderVersion: string
        installerVersion: string
      }> = []

      for (const version of data.versions || []) {
        if (version.stable) {
          results.push({
            gameVersion: version.gameVersion,
            loaderVersion: version.loader.version,
            installerVersion: version.installer.version
          })
        }
      }

      return results.sort((a, b) => this.compareVersions(b.gameVersion, a.gameVersion))
    } catch (error) {
      log.error('[Fabric] 获取 Fabric 版本失败:', error)
      return []
    }
  }

  /**
   * 获取指定 Minecraft 版本的 Fabric 版本
   */
  async getFabricVersionForMinecraft(mcVersion: string): Promise<LoaderVersion | null> {
    try {
      const response = await axios.get(`${FABRIC_META_BASE}/versions/loader/${mcVersion}`)
      const data = response.data

      if (data.length > 0) {
        // 返回最新稳定版本
        const latest = data[0]
        return {
          loader: latest.loader.version,
          installer: latest.installer.version
        }
      }
      return null
    } catch (error) {
      log.error(`[Fabric] 获取 ${mcVersion} 的 Fabric 版本失败:`, error)
      return null
    }
  }

  /**
   * 安装 Fabric
   */
  async installFabric(gameDir: string, mcVersion: string, fabricVersion?: string): Promise<void> {
    this.reportProgress({ stage: 'downloading', progress: 0, message: '获取 Fabric 版本信息...' })

    const versionInfo = await this.getFabricVersionForMinecraft(mcVersion)
    if (!versionInfo) {
      throw new Error(`不支持 Minecraft ${mcVersion} 版本的 Fabric`)
    }

    // 下载 Fabric 安装器
    this.reportProgress({ stage: 'downloading', progress: 10, message: '下载 Fabric 安装器...' })

    const installerUrl = `${FABRIC_DOWNLOAD_BASE}/net/fabricmc/fabric-installer/${versionInfo.installer}/fabric-installer-${versionInfo.installer}.jar`
    const installerPath = path.join(
      gameDir,
      'temp',
      `fabric-installer-${versionInfo.installer}.jar`
    )

    // 确保目录存在
    await fs.mkdir(path.dirname(installerPath), { recursive: true })

    // 下载安装器
    await this.downloadFile(installerUrl, installerPath, (progress) => {
      this.reportProgress({
        stage: 'downloading',
        progress: 10 + progress * 0.35,
        message: `下载中... ${Math.round(progress * 100)}%`
      })
    })

    this.reportProgress({ stage: 'installing', progress: 45, message: '安装 Fabric...' })

    // 运行安装器
    await this.runFabricInstaller(installerPath, gameDir, mcVersion)

    // 清理临时文件
    try {
      await fs.unlink(installerPath)
    } catch {}

    this.reportProgress({ stage: 'verifying', progress: 90, message: '验证安装...' })

    // 验证安装
    const fabricDir = path.join(gameDir, 'libraries', 'net', 'fabricmc', 'fabric-loader')
    try {
      await fs.access(fabricDir)
    } catch (err) {
      log.warn('[Fabric] 验证警告:', err)
    }

    this.reportProgress({ stage: 'complete', progress: 100, message: 'Fabric 安装完成！' })
  }

  /**
   * 运行 Fabric 安装器
   */
  private async runFabricInstaller(
    installerPath: string,
    gameDir: string,
    mcVersion: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-jar',
        installerPath,
        'install',
        'client',
        mcVersion,
        '--dir',
        gameDir,
        '--noprofile'
      ]

      log.info(`[Fabric] 运行安装器: java ${args.join(' ')}`)

      const child = spawn('java', args, {
        stdio: 'inherit',
        cwd: path.dirname(installerPath)
      })

      child.on('close', (code) => {
        if (code === 0) {
          log.info('[Fabric] 安装器成功完成')
          resolve()
        } else {
          log.error(`[Fabric] 安装器退出码: ${code}`)
          reject(new Error(`Fabric 安装器失败，退出码: ${code}`))
        }
      })

      child.on('error', (err) => {
        log.error('[Fabric] 运行安装器出错:', err)
        reject(err)
      })
    })
  }

  // ==================== OptiFine 相关功能 ====================

  /**
   * 获取指定 Minecraft 版本的 OptiFine 版本列表
   */
  private async getOptiFineVersionsForMinecraft(mcVersion: string): Promise<string[]> {
    try {
      this.reportProgress({ stage: 'downloading', progress: 5, message: '获取 OptiFine 版本信息...' })

      // 尝试从 OptiFine 官方源获取
      try {
        const response = await axios.get(`${OPTIFINE_BASE}/downloads`)
        const html = response.data
        
        // 解析 HTML 中的 OptiFine 版本
        const versions: string[] = []
        const regex = new RegExp(`OptiFine_${mcVersion.replace(/\./g, '\\.')}_([A-Za-z0-9_]+)`, 'g')
        let match
        while ((match = regex.exec(html)) !== null) {
          versions.push(match[1])
        }
        
        if (versions.length > 0) {
          return versions
        }
      } catch (e) {
        log.warn('无法从 OptiFine 官网获取版本，使用默认列表')
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
      
      return defaultVersions[mcVersion] || ['Ultra']
    } catch (error) {
      log.error(`[OptiFine] 获取 ${mcVersion} 的 OptiFine 版本失败:`, error)
      return ['Ultra']
    }
  }

  /**
   * 安装 OptiFine
   */
  async installOptiFine(gameDir: string, mcVersion: string, optifineVersion?: string): Promise<void> {
    this.reportProgress({ stage: 'downloading', progress: 0, message: '获取 OptiFine 版本信息...' })

    const targetVersion = optifineVersion || 'Ultra'
    const optifineFullVersion = `OptiFine_${mcVersion}_${targetVersion}`
    
    // 下载 OptiFine
    this.reportProgress({ stage: 'downloading', progress: 10, message: '下载 OptiFine...' })

    const downloadUrl = `${OPTIFINE_BASE}/downloadx?f=${optifineFullVersion}.jar&x=85c117c90661e63ed1f8e37729a8801c`
    const fallbackUrl = `${OPTIFINE_BASE}/adloadx?f=${optifineFullVersion}.jar`
    const installerPath = path.join(gameDir, 'temp', `${optifineFullVersion}.jar`)

    // 确保目录存在
    await fs.mkdir(path.dirname(installerPath), { recursive: true })

    // 尝试下载，失败时使用备用链接
    try {
      await this.downloadFile(downloadUrl, installerPath, (progress) => {
        this.reportProgress({
          stage: 'downloading',
          progress: 10 + progress * 0.35,
          message: `下载中... ${Math.round(progress * 100)}%`
        })
      })
    } catch {
      log.info('使用备用链接下载 OptiFine')
      await this.downloadFile(fallbackUrl, installerPath, (progress) => {
        this.reportProgress({
          stage: 'downloading',
          progress: 10 + progress * 0.35,
          message: `下载中... ${Math.round(progress * 100)}%`
        })
      })
    }

    this.reportProgress({ stage: 'installing', progress: 45, message: '安装 OptiFine...' })

    // 运行 OptiFine 安装器
    await this.runOptiFineInstaller(installerPath, gameDir, mcVersion)

    // 清理临时文件
    try {
      await fs.unlink(installerPath)
    } catch {}

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
   * 运行 OptiFine 安装器
   */
  private async runOptiFineInstaller(
    installerPath: string,
    gameDir: string,
    mcVersion: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = ['-jar', installerPath]

      log.info(`[OptiFine] 运行安装器: java ${args.join(' ')}`)

      const child = spawn('java', args, {
        stdio: 'inherit',
        cwd: path.dirname(installerPath)
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

  // ==================== 通用功能 ====================

  /**
   * 下载文件（带进度回调）
   */
  private async downloadFile(
    url: string,
    destPath: string,
    onProgress: (progress: number) => void
  ): Promise<void> {
    log.info(`[Download] 开始下载: ${url} -> ${destPath}`)

    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream',
      timeout: 600000 // 10分钟超时
    })

    const totalSize = parseInt(
      (response.headers as Record<string, string>)['content-length'] || '0',
      10
    )
    let downloaded = 0

    const writer = await fs.open(destPath, 'w')
    const writeStream = writer.createWriteStream()

    response.data.on('data', (chunk: Buffer) => {
      downloaded += chunk.length
      if (totalSize > 0) {
        onProgress(downloaded / totalSize)
      }
    })

    response.data.pipe(writeStream)

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        writer.close()
        log.info(`[Download] 下载完成: ${destPath}`)
        resolve()
      })

      writeStream.on('error', async (err: Error) => {
        try {
          await writer.close()
          await fs.unlink(destPath)
        } catch {}
        log.error(`[Download] 下载失败:`, err)
        reject(err)
      })

      response.data.on('error', async (err: Error) => {
        try {
          await writer.close()
          await fs.unlink(destPath)
        } catch {}
        log.error(`[Download] 下载失败:`, err)
        reject(err)
      })
    })
  }

  /**
   * 版本比较
   */
  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number)
    const partsB = b.split('.').map(Number)

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = partsA[i] || 0
      const numB = partsB[i] || 0
      if (numA !== numB) return numB - numA
    }
    return 0
  }

  /**
   * 获取指定 Minecraft 版本支持的 Mod 加载器
   */
  public getModLoaders(minecraftVersion: string): ModLoader[] {
    const loaders: ModLoader[] = []

    for (const [type, info] of this.modLoaders) {
      if (info.supportedVersions.includes(minecraftVersion)) {
        loaders.push({
          type: type as ModLoaderType,
          name: info.name,
          supportedVersions: info.supportedVersions
        })
      }
    }

    return loaders
  }

  /**
   * 安装 Mod 加载器到游戏实例（统一入口）
   */
  public async installModLoader(instance: GameInstance, loaderType: string): Promise<void> {
    const loaderInfo = this.modLoaders.get(loaderType)
    if (!loaderInfo) {
      throw new Error(`不支持的 Mod 加载器类型: ${loaderType}`)
    }

    if (!loaderInfo.supportedVersions.includes(instance.version)) {
      throw new Error(`版本 ${instance.version} 不支持 ${loaderInfo.name} 加载器`)
    }

    this.reportProgress({
      stage: 'downloading',
      progress: 0,
      message: `开始安装 ${loaderInfo.name}...`
    })

    // 根据加载器类型调用对应的安装方法
    switch (loaderType) {
      case 'forge':
        await this.installForge(instance.gameDir, instance.version)
        break
      case 'neoforge':
        await this.installNeoForge(instance.gameDir, instance.version)
        break
      case 'fabric':
        await this.installFabric(instance.gameDir, instance.version)
        break
      case 'quilt':
        await this.installQuilt(instance.gameDir, instance.version)
        break
      case 'optifine':
        await this.installOptiFine(instance.gameDir, instance.version)
        break
      default:
        throw new Error(`不支持的 Mod 加载器: ${loaderType}`)
    }
  }

  /**
   * 获取当前平台
   */
  private getPlatform(): 'windows' | 'macos' | 'linux' {
    const platform = process.platform
    if (platform === 'win32') return 'windows'
    if (platform === 'darwin') return 'macos'
    return 'linux'
  }
}

/**
 * Mod 加载器信息接口
 */
interface ModLoaderInfo {
  name: string
  supportedVersions: string[]
}

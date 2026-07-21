/**
 * 游戏启动服务（StarLight 风格重构版）
 * 模块化设计：配置类 + 启动器类 + 辅助服务
 */

import { spawn, ChildProcess } from 'child_process'
import { BrowserWindow, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as https from 'https'
import * as http from 'http'
const { join } = path
import {
  getDefaultJava,
  validateJava,
  recommendedJavaMajor,
  probeJava,
  detectAllJava
} from './java.management.service'
import { updateLastPlayed } from './instances'
import { getDatabase } from './database'
import { logger } from '../utils/logger'
const log = logger.child('GameLauncher')

// ===== 配置类定义 =====

export interface GameAccount {
  name: string
  uuid: string
  accessToken?: string | null
  xuid?: string | null
}

export interface GameWindowConfig {
  width: number
  height: number
  isFullScreen: boolean
}

export interface JavaConfig {
  javaPath: string
  maxMemory: number
  minMemory: number
  disabledOptimizationAdvancedArgs: boolean
  disabledOptimizationGcArgs: boolean
}

export interface GameCoreConfig {
  root: string
  version: string
  /** 实例游戏目录（用于版本隔离：mods/configs/saves/options.txt 存储位置）*/
  gameDir?: string
  isVersionIsolation: boolean
  ip?: string
  port?: number
  gameArguments?: string[]
}

export interface LaunchConfig {
  account: GameAccount
  gameWindowConfig: GameWindowConfig
  gameCoreConfig: GameCoreConfig
  javaConfig: JavaConfig
}

// ===== 类型定义 =====

export interface LaunchResult {
  success: boolean
  error?: string
  pid?: number
  /** 需要用户确认下载缺失文件 */
  needsFileDownload?: boolean
  /** 缺失文件列表 */
  missingFiles?: MissingFileInfo[]
}

export interface MissingFileInfo {
  type: 'library' | 'asset' | 'natives' | 'version'
  name: string
  path: string
  size?: number
}

export type GameStatus = 'idle' | 'launching' | 'running' | 'exiting' | 'waiting-download'

export type LaunchPhase =
  | 'idle'
  | 'building-config'
  | 'validating-java'
  | 'checking-files'
  | 'waiting-confirm'  // 等待用户确认下载
  | 'downloading-files' // 正在下载缺失文件
  | 'launching-process'
  | 'running'
  | 'error'

export interface LaunchProgress {
  phase: LaunchPhase
  message: string
  detail?: string
}

export interface CrashReport {
  type: string
  message: string
  suggestion?: string
  stackTrace?: string
}

// ===== 内部类型 =====

interface NativeArtifact {
  path: string
  sha1: string
  size: number
  url: string
}

interface VersionJson {
  id: string
  inheritsFrom?: string
  mainClass: string
  minecraftArguments?: string
  arguments?: {
    game?: Array<string | { rules: unknown[]; value?: string | string[] }>
    jvm?: Array<string | { rules: unknown[]; value?: string | string[] }>
  }
  libraries: Array<{
    name: string
    downloads?: {
      artifact?: NativeArtifact
      classifiers?: Record<string, NativeArtifact>
    }
    rules?: Array<{ action: string; os?: { name?: string } }>
    natives?: Record<string, string>
    extract?: { exclude?: string[] }
  }>
  assetIndex?: { id: string; sha1: string; size: number; totalSize: number; url: string }
  assets?: string
}

interface AccountRow {
  name: string
  uuid: string
  access_token: string | null
  xuid: string | null
}

// ===== 常量 =====

const BMCLAPI = 'https://bmclapi2.bangbang93.com'
const PARALLEL_DOWNLOAD_CONCURRENCY = 5 // 并行下载并发数

// ===== MinecraftLauncher 类 =====

class MinecraftLauncher {
  private currentProcess: ChildProcess | null = null
  private currentInstanceId: string | null = null
  private gameStatus: GameStatus = 'idle'
  private logBuffer = ''
  private mainWindow: BrowserWindow | null = null

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  get status(): GameStatus {
    return this.gameStatus
  }

  get pid(): number | null {
    return this.currentProcess?.pid ?? null
  }

  /**
   * 并行下载工具方法
   */
  private async parallelDownload<T extends { url: string; path: string }>(
    tasks: T[],
    concurrency: number,
    onProgress?: (completed: number, total: number, item: T) => void
  ): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0
    const total = tasks.length

    const running: Promise<void>[] = []
    let taskIndex = 0

    const downloadOne = async (task: T): Promise<void> => {
      try {
        await this.downloadFile(task.url, task.path)
        success++
      } catch (e: unknown) {
        const fallbackUrl = (task as { fallbackUrl?: string }).fallbackUrl
        if (fallbackUrl) {
          try {
            log.info(`[parallelDownload] 主源失败，尝试备用源: ${fallbackUrl}`)
            await this.downloadFile(fallbackUrl, task.path)
            success++
          } catch (e2: unknown) {
            log.warn(`[parallelDownload] 备用源也失败: ${fallbackUrl}: ${(e2 as Error).message}`)
            failed++
          }
        } else {
          log.warn(`[parallelDownload] 下载失败: ${task.url}: ${(e as Error).message}`)
          failed++
        }
      }
      onProgress?.(success + failed, total, task)
    }

    const startTask = (): Promise<void> | null => {
      if (taskIndex >= tasks.length) return null
      const task = tasks[taskIndex++]
      return downloadOne(task)
    }

    for (let i = 0; i < Math.min(concurrency, tasks.length); i++) {
      running.push(
        (async () => {
          while (true) {
            const next = startTask()
            if (!next) break
            await next
          }
        })()
      )
    }

    await Promise.all(running)
    return { success, failed }
  }

  /**
   * 启动游戏（优化：并行操作 + 性能测量）
   */
  async launch(config: LaunchConfig): Promise<LaunchResult> {
    if (this.gameStatus === 'running' || this.gameStatus === 'launching') {
      return { success: false, error: '已有游戏在运行中，请先关闭' }
    }

    const launchStartTime = Date.now()
    this.setStatus('launching')
    this.sendProgress('building-config', '正在构建启动参数...')
    this.logBuffer = ''

    try {
      const { account, gameWindowConfig, gameCoreConfig, javaConfig } = config

      // 1. 验证 Java
      this.sendProgress('validating-java', '正在检测 Java 环境...')
      const javaStartTime = Date.now()
      const javaValidation = await this.validateJava(javaConfig, gameCoreConfig.version)
      if (!javaValidation.success) {
        this.sendProgress('error', 'Java 验证失败', javaValidation.error)
        this.setStatus('idle')
        return { success: false, error: javaValidation.error }
      }
      const javaPath = javaValidation.javaPath
      log.info(`[launch] Java 验证完成，耗时 ${Date.now() - javaStartTime}ms`)

      // 2. 解析版本信息
      this.sendProgress('checking-files', '正在检查版本信息...')
      const versionJson = await this.resolveVersionJson(gameCoreConfig)
      if (!versionJson) {
        this.sendProgress('error', '版本文件缺失', `找不到 ${gameCoreConfig.version} 的版本 JSON`)
        this.setStatus('idle')
        return { success: false, error: `版本文件不存在: ${gameCoreConfig.version}` }
      }

      // 3. 处理继承版本
      const finalVersionJson = await this.resolveInheritedVersion(gameCoreConfig, versionJson)

      // 4. 检测缺失文件
      this.sendProgress('checking-files', '正在检测缺失文件...')
      const missingFiles = await this.checkMissingFiles(gameCoreConfig, finalVersionJson)

      // 如果有缺失文件，返回需要用户确认的状态
      if (missingFiles.length > 0) {
        log.info(`[launch] 检测到 ${missingFiles.length} 个缺失文件，需要用户确认下载`)
        this.setStatus('waiting-download')
        this.sendProgress(
          'waiting-confirm',
          `检测到 ${missingFiles.length} 个缺失文件，是否下载？`,
          `点击"确定"开始下载缺失文件`
        )
        return {
          success: false,
          needsFileDownload: true,
          missingFiles
        }
      }

      // 5. 构建类路径
      const classpathStartTime = Date.now()
      const classpath = await this.buildClasspath(gameCoreConfig, finalVersionJson)
      const classpathStr = classpath.join(process.platform === 'win32' ? ';' : ':')
      log.info(`[launch] 类路径构建完成，耗时 ${Date.now() - classpathStartTime}ms`)

      // 5.5 验证并修复 options.txt（防止窗口偏移导致不可见）
      this.validateOptionsFile(gameCoreConfig.gameDir || gameCoreConfig.root)

      // 6. 构建启动参数
      const jvmArgs = this.buildJvmArguments(
        finalVersionJson,
        gameCoreConfig,
        javaConfig,
        classpathStr
      )
      const mcArgs = this.buildGameArguments(
        finalVersionJson,
        gameCoreConfig,
        account,
        gameWindowConfig
      )

      // 7. 启动进程
      log.info(
        `[GameLauncher] [launch] 准备启动游戏: version=${gameCoreConfig.version}, java=${javaPath}, account=${account.name}`
      )
      log.info(
        `[GameLauncher] [launch] JVM参数数量: ${jvmArgs.length}, MC参数数量: ${mcArgs.length}`
      )

      const result = await this.spawnProcess(
        javaPath,
        jvmArgs,
        mcArgs,
        finalVersionJson.mainClass,
        gameCoreConfig.root,
        classpathStr,
        gameCoreConfig.version
      )

      if (result.success) {
        this.setStatus('running')
        this.sendProgress('running', '游戏运行中')
        log.info(`[GameLauncher] [launch] 启动准备完成，总耗时 ${Date.now() - launchStartTime}ms`)
      } else {
        log.error(`[GameLauncher] [launch] 启动失败: ${result.error}`)
        this.sendProgress('error', '启动失败', result.error)
      }
      return result
    } catch (e: unknown) {
      const err = e as Error
      log.error(`[GameLauncher] [launch] 异常: ${err.stack || err.message}`)
      this.sendProgress('error', '启动失败', err.message)
      this.setStatus('idle')
      return { success: false, error: err.message }
    }
  }

  /**
   * 终止游戏进程
   */
  terminate(): void {
    if (this.currentProcess) {
      try {
        this.currentProcess.kill('SIGTERM')
      } catch {
        this.currentProcess.kill('SIGKILL')
      }
      this.currentProcess = null
    }
    this.currentInstanceId = null
    this.setStatus('idle')
  }

  /**
   * 直接启动游戏（跳过文件检测，用于下载完成后继续启动）
   */
  async launchDirect(config: LaunchConfig): Promise<LaunchResult> {
    if (this.gameStatus === 'running' || this.gameStatus === 'launching') {
      return { success: false, error: '已有游戏在运行中，请先关闭' }
    }

    const launchStartTime = Date.now()
    this.setStatus('launching')
    this.sendProgress('building-config', '正在构建启动参数...')
    this.logBuffer = ''

    try {
      const { account, gameWindowConfig, gameCoreConfig, javaConfig } = config

      // 1. 验证 Java
      this.sendProgress('validating-java', '正在检测 Java 环境...')
      const javaValidation = await this.validateJava(javaConfig, gameCoreConfig.version)
      if (!javaValidation.success) {
        this.sendProgress('error', 'Java 验证失败', javaValidation.error)
        this.setStatus('idle')
        return { success: false, error: javaValidation.error }
      }
      const javaPath = javaValidation.javaPath

      // 2. 解析版本信息
      this.sendProgress('checking-files', '正在检查版本信息...')
      const versionJson = await this.resolveVersionJson(gameCoreConfig)
      if (!versionJson) {
        this.sendProgress('error', '版本文件缺失', `找不到 ${gameCoreConfig.version} 的版本 JSON`)
        this.setStatus('idle')
        return { success: false, error: `版本文件不存在: ${gameCoreConfig.version}` }
      }

      // 3. 处理继承版本
      const finalVersionJson = await this.resolveInheritedVersion(gameCoreConfig, versionJson)

      // 跳过文件检测（下载完成后直接启动）

      // 4. 构建类路径
      const classpath = await this.buildClasspath(gameCoreConfig, finalVersionJson)
      const classpathStr = classpath.join(process.platform === 'win32' ? ';' : ':')

      // 5. 验证并修复 options.txt
      this.validateOptionsFile(gameCoreConfig.gameDir || gameCoreConfig.root)

      // 6. 构建启动参数
      const jvmArgs = this.buildJvmArguments(
        finalVersionJson,
        gameCoreConfig,
        javaConfig,
        classpathStr
      )
      const mcArgs = this.buildGameArguments(
        finalVersionJson,
        gameCoreConfig,
        account,
        gameWindowConfig
      )

      // 7. 启动进程
      log.info(
        `[GameLauncher] [launchDirect] 准备启动游戏: version=${gameCoreConfig.version}, java=${javaPath}, account=${account.name}`
      )

      const result = await this.spawnProcess(
        javaPath,
        jvmArgs,
        mcArgs,
        finalVersionJson.mainClass,
        gameCoreConfig.root,
        classpathStr,
        gameCoreConfig.version
      )

      if (result.success) {
        this.setStatus('running')
        this.sendProgress('running', '游戏运行中')
        log.info(`[GameLauncher] [launchDirect] 启动准备完成，总耗时 ${Date.now() - launchStartTime}ms`)
      } else {
        log.error(`[GameLauncher] [launchDirect] 启动失败: ${result.error}`)
        this.sendProgress('error', '启动失败', result.error)
      }
      return result
    } catch (e: unknown) {
      const err = e as Error
      log.error(`[GameLauncher] [launchDirect] 异常: ${err.stack || err.message}`)
      this.sendProgress('error', '启动失败', err.message)
      this.setStatus('idle')
      return { success: false, error: err.message }
    }
  }

  /**
   * 验证 Java 环境（PCL2风格：智能版本匹配 + 兼容性检查）
   */
  private async validateJava(
    javaConfig: JavaConfig,
    versionId: string
  ): Promise<{ success: boolean; javaPath: string; error?: string }> {
    const { javaPath: configJavaPath, maxMemory, minMemory } = javaConfig

    // 检查内存配置
    if (minMemory > maxMemory) {
      return { success: false, javaPath: '', error: '最小内存不能大于最大内存' }
    }

    // 提取纯版本号用于 Java 选择
    const baseVersion = extractBaseVersion(versionId)
    const recommendedMajor = recommendedJavaMajor(baseVersion)
    const isForge = versionId.toLowerCase().includes('forge')
    const isNeoForge = versionId.toLowerCase().includes('neoforge')

    log.info(`[validateJava] 游戏版本: ${baseVersion}, 推荐 Java 主版本: ${recommendedMajor}`)
    log.info(`[validateJava] 是否 Forge: ${isForge}, 是否 NeoForge: ${isNeoForge}`)

    let selectedJava: {
      path: string
      vendor: string
      version: string
      majorVersion: number
    } | null = null

    // 检查 Java 版本是否兼容
    const isCompatible = (java: { majorVersion: number }): boolean => {
      if (java.majorVersion < recommendedMajor) return false
      // Forge/NeoForge 严格限制：不允许高于推荐版本
      if ((isForge || isNeoForge) && java.majorVersion > recommendedMajor) return false
      return true
    }

    // 如果配置了路径，验证后使用
    if (configJavaPath && fs.existsSync(configJavaPath)) {
      const javaInfo = await getJavaInfoFromPath(configJavaPath)
      if (javaInfo) {
        if (isCompatible(javaInfo)) {
          selectedJava = javaInfo
          log.info(`[validateJava] 使用配置的 Java: ${javaInfo.vendor} ${javaInfo.version}`)
        } else {
          log.warn(
            `[validateJava] 配置的 Java ${javaInfo.majorVersion} 与版本不兼容，尝试自动选择`
          )
        }
      } else {
        log.warn(`[validateJava] 配置的 Java 路径无效，尝试自动选择`)
      }
    }

    // 自动选择 Java（配置不兼容或未配置时调用）
    if (!selectedJava) {
      const allJava = await detectAllJava()
      if (allJava.length > 0) {
        // 筛选兼容的 Java
        let compatible = allJava.filter((j) => isCompatible(j))
        if (compatible.length === 0) {
          // 没有完全兼容的，尝试找接近的（Forge/NeoForge 降级到所有版本）
          log.warn(`[validateJava] 未找到完全兼容的 Java，尝试选择最近似版本`)
          compatible = [...allJava]
        }
        // 优先选择推荐主版本，其次更高版本
        compatible.sort((a, b) => {
          if (a.majorVersion === recommendedMajor && b.majorVersion !== recommendedMajor) return -1
          if (b.majorVersion === recommendedMajor && a.majorVersion !== recommendedMajor) return 1
          return b.majorVersion - a.majorVersion
        })
        selectedJava = compatible[0]
        log.info(
          `[validateJava] 自动选择 Java: ${selectedJava.vendor} ${selectedJava.version} (主版本: ${selectedJava.majorVersion})`
        )
      }
    }

    if (!selectedJava) {
      return {
        success: false,
        javaPath: '',
        error: `未找到兼容的 Java 环境。Minecraft ${baseVersion} 需要 Java ${recommendedMajor}${isForge || isNeoForge ? '（Forge/NeoForge 仅限此版本）' : ' 或更高版本'}，请在设置中配置 Java`
      }
    }

    // 显示最终选择
    if (selectedJava.majorVersion !== recommendedMajor) {
      this.sendProgress(
        'validating-java',
        `警告: Java ${selectedJava.majorVersion} 可能与 Minecraft ${baseVersion} 不兼容`
      )
    } else {
      this.sendProgress(
        'validating-java',
        `已选择 Java: ${selectedJava.vendor} ${selectedJava.version}`
      )
    }

    return { success: true, javaPath: selectedJava.path }
  }

  /**
   * 解析版本 JSON
   */
  async resolveVersionJson(gameCoreConfig: GameCoreConfig): Promise<VersionJson | null> {
    const { root, version } = gameCoreConfig
    const versionJsonPath = join(root, 'versions', version, `${version}.json`)

    if (!fs.existsSync(versionJsonPath)) {
      log.error(`[resolveVersionJson] 版本 JSON 不存在: ${versionJsonPath}`)
      return null
    }

    try {
      return JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'))
    } catch (e) {
      log.error(`[resolveVersionJson] JSON 解析失败: ${versionJsonPath}`, e)
      return null
    }
  }

  /**
   * 解析继承版本
   */
  async resolveInheritedVersion(
    gameCoreConfig: GameCoreConfig,
    versionJson: VersionJson
  ): Promise<VersionJson> {
    if (!versionJson.inheritsFrom) {
      return versionJson
    }

    const parentJson = await this.resolveVersionJson({
      ...gameCoreConfig,
      version: versionJson.inheritsFrom
    })

    if (!parentJson) {
      return versionJson
    }

    return {
      ...parentJson,
      ...versionJson,
      libraries: [...(versionJson.libraries || []), ...(parentJson.libraries || [])]
    }
  }

  /**
   * 检测缺失文件（不下载，返回缺失列表）
   */
  async checkMissingFiles(
    gameCoreConfig: GameCoreConfig,
    versionJson: VersionJson
  ): Promise<MissingFileInfo[]> {
    const { root } = gameCoreConfig
    const baseLibPath = join(root, 'libraries')
    const assetsPath = join(root, 'assets')
    const missingFiles: MissingFileInfo[] = []

    // 1. 检查 libraries
    for (const lib of versionJson.libraries || []) {
      if (!this.checkLibRules(lib.rules)) continue

      const dl = lib.downloads?.artifact
      if (!dl) continue

      const fullPath = join(baseLibPath, dl.path)
      const fileSize = fs.existsSync(fullPath) ? fs.statSync(fullPath).size : 0
      if (fileSize === 0 || (dl.size > 0 && fileSize !== dl.size)) {
        const reason =
          fileSize === 0 ? '文件为空' : `大小不匹配(期望 ${dl.size}, 实际 ${fileSize})`
        log.warn(`[checkMissingFiles] 库文件缺失或不完整: ${dl.path} (${reason})`)
        missingFiles.push({
          type: 'library',
          name: dl.path.split('/').pop() || dl.path,
          path: fullPath,
          size: dl.size
        })
      }
    }

    // 2. 检查 natives
    const versionId = versionJson.id
    const nativesDir = join(root, 'versions', versionId, `${versionId}-natives`)
    const key =
      process.platform === 'win32'
        ? 'natives-windows'
        : process.platform === 'darwin'
          ? 'natives-osx'
          : 'natives-linux'

    for (const lib of versionJson.libraries || []) {
      const classifiers = lib.downloads?.classifiers
      if (!classifiers) continue

      const nativeInfo = classifiers[key]
      if (!nativeInfo) continue

      const jarName = path.basename(nativeInfo.path || `natives-${versionId}.jar`)
      const nativeJarPath = join(nativesDir, jarName)

      if (!fs.existsSync(nativeJarPath)) {
        missingFiles.push({
          type: 'natives',
          name: jarName,
          path: nativeJarPath
        })
      }
    }

    // 3. 检查 assets（只检查资源索引是否存在，不逐个检查资源文件）
    // 资源文件数量庞大，且部分可由游戏运行时按需下载，逐个校验会导致误报和死循环
    const assetIndexId = versionJson.assetIndex?.id
    if (assetIndexId && versionJson.assetIndex) {
      const indexPath = join(assetsPath, 'indexes', `${assetIndexId}.json`)

      if (!fs.existsSync(indexPath)) {
        missingFiles.push({
          type: 'asset',
          name: `资源索引 ${assetIndexId}.json`,
          path: indexPath
        })
      }
    }

    // 4. 检查版本 JAR
    const versionJar = join(root, 'versions', versionId, `${versionId}.jar`)
    if (!fs.existsSync(versionJar)) {
      missingFiles.push({
        type: 'version',
        name: `${versionId}.jar`,
        path: versionJar
      })
    }

    log.info(`[checkMissingFiles] 检测到 ${missingFiles.length} 个缺失文件`)
    return missingFiles
  }

  /**
   * 下载缺失文件（由用户确认后调用）
   */
  async downloadMissingFiles(
    gameCoreConfig: GameCoreConfig,
    versionJson: VersionJson
  ): Promise<{ success: boolean; error?: string }> {
    const { root } = gameCoreConfig
    const baseLibPath = join(root, 'libraries')
    const assetsPath = join(root, 'assets')
    const versionId = versionJson.id

    this.sendProgress('downloading-files', '正在下载缺失文件...')

    // 1. 下载缺失的 libraries
    const missingLibs: Array<{ url: string; path: string }> = []
    for (const lib of versionJson.libraries || []) {
      if (!this.checkLibRules(lib.rules)) continue

      const dl = lib.downloads?.artifact
      if (!dl) continue

      const fullPath = join(baseLibPath, dl.path)
      const fileSize = fs.existsSync(fullPath) ? fs.statSync(fullPath).size : 0
      if (fileSize === 0 || (dl.size > 0 && fileSize !== dl.size)) {
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath)
          } catch {}
        }
        const bmclUrl = `${BMCLAPI}/libraries/${dl.path}`
        missingLibs.push({ url: bmclUrl, path: fullPath })
      }
    }

    if (missingLibs.length > 0) {
      this.sendProgress('downloading-files', `正在下载缺失库文件 (${missingLibs.length} 个)...`)
      const result = await this.parallelDownload(
        missingLibs,
        PARALLEL_DOWNLOAD_CONCURRENCY,
        (completed, total, item) => {
          this.sendProgress(
            'downloading-files',
            `正在补全支持库 (${completed}/${total})`,
            path.basename(item.path)
          )
        }
      )
      log.info(`[downloadMissingFiles] 库文件下载完成: 成功 ${result.success}, 失败 ${result.failed}`)

      if (result.failed > 0 && result.success === 0) {
        return { success: false, error: '库文件下载失败' }
      }
    }

    // 2. 下载并解压 natives
    this.sendProgress('downloading-files', '正在下载原生库...')
    await this.downloadAndExtractNatives(root, versionJson)

    // 3. 下载 assets
    this.sendProgress('downloading-files', '正在下载资源文件...')
    await this.downloadAssets(root, versionJson)

    // 4. 下载版本核心 JAR 文件
    const versionJarPath = join(root, 'versions', versionId, `${versionId}.jar`)
    if (!fs.existsSync(versionJarPath)) {
      const clientDownload = versionJson.downloads?.client
      if (clientDownload) {
        this.sendProgress('downloading-files', `正在下载版本核心文件 ${versionId}.jar...`)
        const bmclUrl = `${BMCLAPI}/versions/${versionId}/${versionId}.jar`
        try {
          const dir = dirname(versionJarPath)
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
          }
          await this.downloadFile(bmclUrl, versionJarPath)
          log.info(`[downloadMissingFiles] 版本核心文件下载完成: ${versionJarPath}`)
        } catch (e: unknown) {
          log.error(`[downloadMissingFiles] 版本核心文件下载失败: ${(e as Error).message}`)
          return { success: false, error: `版本核心文件下载失败: ${versionId}.jar` }
        }
      } else {
        log.error(`[downloadMissingFiles] 版本 JSON 中没有 client 下载信息`)
        return { success: false, error: `版本核心文件下载信息缺失` }
      }
    }

    log.info(`[downloadMissingFiles] 缺失文件下载完成`)
    return { success: true }
  }

  /**
   * 检查库文件规则
   */
  private checkLibRules(rules?: Array<{ action: string; os?: { name?: string } }>): boolean {
    if (!rules?.length) return true

    let allowed = true

    for (const rule of rules) {
      const osMatches = !rule.os?.name || rule.os.name === process.platform

      if (rule.action === 'allow' && osMatches) {
        allowed = true
      } else if (rule.action === 'disallow' && osMatches) {
        allowed = false
      }
    }

    return allowed
  }

  /**
   * 下载并解压 natives
   */
  private async downloadAndExtractNatives(
    gameDir: string,
    versionJson: VersionJson
  ): Promise<void> {
    const versionId = versionJson.id
    const nativesDir = join(gameDir, 'versions', versionId, `${versionId}-natives`)
    if (!fs.existsSync(nativesDir)) fs.mkdirSync(nativesDir, { recursive: true })

    for (const lib of versionJson.libraries || []) {
      const classifiers = lib.downloads?.classifiers
      if (!classifiers) continue

      const key =
        process.platform === 'win32'
          ? 'natives-windows'
          : process.platform === 'darwin'
            ? 'natives-osx'
            : 'natives-linux'

      const nativeInfo = classifiers[key]
      if (!nativeInfo) continue

      const nativeUrl = nativeInfo.url || `${BMCLAPI}/libraries/${nativeInfo.path}`
      const jarName = path.basename(nativeInfo.path || `natives-${versionId}.jar`)
      const nativeJarPath = join(nativesDir, jarName)

      if (!fs.existsSync(nativeJarPath)) {
        this.sendProgress('checking-files', `下载原生库: ${jarName}`)
        try {
          await this.downloadFile(nativeUrl, nativeJarPath)
        } catch (e: unknown) {
          log.warn(`[natives] 下载失败: ${nativeUrl}, ${(e as Error).message}`)
          continue
        }
      }

      try {
        this.sendProgress('checking-files', `解压原生库: ${jarName}`)
        await this.extractJar(nativeJarPath, nativesDir)
      } catch (e: unknown) {
        log.warn(`[natives] 解压失败: ${nativeJarPath}, ${(e as Error).message}`)
      }
    }
  }

  /**
   * 下载资源文件（优化：并行下载）
   */
  private async downloadAssets(gameDir: string, versionJson: VersionJson): Promise<void> {
    const assetIndexId = versionJson.assetIndex?.id
    if (!assetIndexId || !versionJson.assetIndex) return

    const assetsPath = join(gameDir, 'assets')
    const indexPath = join(assetsPath, 'indexes', `${assetIndexId}.json`)

    if (!fs.existsSync(indexPath)) {
      this.sendProgress('checking-files', '正在下载资源索引...')
      const indexUrl = versionJson.assetIndex.url.replace(
        'https://launchermeta.mojang.com',
        BMCLAPI
      )
      try {
        await this.downloadFile(indexUrl, indexPath)
      } catch (e: unknown) {
        log.warn(`[downloadAssets] asset index 下载失败: ${indexUrl}: ${(e as Error).message}`)
        return
      }
    }

    if (fs.existsSync(indexPath)) {
      try {
        const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
        const objects: Array<{ hash: string; size: number }> = Object.values(
          indexData.objects || {}
        )

        // 收集缺失的资源文件
        const missingAssets: Array<{ url: string; path: string; fallbackUrl?: string }> = []
        for (const obj of objects) {
          const objPath = join(assetsPath, 'objects', obj.hash.substring(0, 2), obj.hash)
          const fileSize = fs.existsSync(objPath) ? fs.statSync(objPath).size : 0
          if (fileSize === 0 || (obj.size > 0 && fileSize !== obj.size)) {
            if (fs.existsSync(objPath)) {
              try {
                fs.unlinkSync(objPath)
              } catch {}
            }
            // 官方资源服务器作为主源（无速率限制），BMCLAPI 作为备用
            const prefix = obj.hash.substring(0, 2)
            const primaryUrl = `https://resources.download.minecraft.net/${prefix}/${obj.hash}`
            const fallbackUrl = `${BMCLAPI}/assets/${prefix}/${obj.hash}`
            missingAssets.push({ url: primaryUrl, path: objPath, fallbackUrl })
          }
        }

        if (missingAssets.length > 0) {
          this.sendProgress('checking-files', `正在并行补全资源文件 (${missingAssets.length} 个, 并发数 ${PARALLEL_DOWNLOAD_CONCURRENCY})...`)
          const result = await this.parallelDownload(
            missingAssets,
            PARALLEL_DOWNLOAD_CONCURRENCY,
            (completed, total) => {
              if (completed % 50 === 0 || completed === total) {
                this.sendProgress('checking-files', `正在补全资源文件 (${completed}/${total})`)
              }
            }
          )
          log.info(`[downloadAssets] 资源文件下载完成: 成功 ${result.success}, 失败 ${result.failed}`)
        }
      } catch (e: unknown) {
        log.warn(`[downloadAssets] asset index 解析失败: ${(e as Error).message}`)
      }
    }
  }

  /**
   * 构建类路径（PCL2风格：完整检查 + 详细日志）
   */
  private async buildClasspath(
    gameCoreConfig: GameCoreConfig,
    versionJson: VersionJson
  ): Promise<string[]> {
    const { root, version } = gameCoreConfig
    const baseLibPath = join(root, 'libraries')
    const cp: string[] = []
    let missingCount = 0
    let totalCount = 0

    log.info(`[buildClasspath] 开始构建类路径，版本: ${version}`)
    log.info(`[buildClasspath] 库文件根目录: ${baseLibPath}`)

    for (const lib of versionJson.libraries || []) {
      if (!this.checkLibRules(lib.rules)) continue

      const dl = lib.downloads?.artifact
      if (!dl) continue

      totalCount++
      const fullPath = join(baseLibPath, dl.path)
      if (fs.existsSync(fullPath)) {
        cp.push(fullPath)
      } else {
        missingCount++
        log.warn(`[buildClasspath] 库文件缺失: ${dl.path}`)
      }
    }

    log.info(
      `[buildClasspath] 库文件统计: 总计=${totalCount}, 有效=${cp.length}, 缺失=${missingCount}`
    )

    // 去重（部分整合包版本 JSON 存在重复的库声明）
    const uniqueCp = [...new Set(cp)]

    const versionJar = join(root, 'versions', version, `${version}.jar`)
    if (fs.existsSync(versionJar)) {
      uniqueCp.push(versionJar)
      log.info(`[buildClasspath] 版本 JAR 已添加: ${versionJar}`)
    } else {
      log.error(`[buildClasspath] 版本 JAR 缺失: ${versionJar}`)
      throw new Error(`版本核心文件缺失: ${version}.jar，请重新下载游戏版本`)
    }

    log.info(`[buildClasspath] 类路径构建完成，共 ${uniqueCp.length} 个文件`)
    return uniqueCp
  }

  /**
   * 构建 JVM 参数（PCL2风格：完整解析 + 详细日志）
   */
  private buildJvmArguments(
    versionJson: VersionJson,
    gameCoreConfig: GameCoreConfig,
    javaConfig: JavaConfig,
    classpathStr: string
  ): string[] {
    const { root, version } = gameCoreConfig
    const { maxMemory, minMemory, disabledOptimizationGcArgs, disabledOptimizationAdvancedArgs } =
      javaConfig

    const args: string[] = []

    log.info(`[buildJvmArguments] 开始构建 JVM 参数，版本: ${version}`)
    log.info(`[buildJvmArguments] 内存配置: min=${minMemory}M, max=${maxMemory}M`)

    // 内存参数
    args.push(`-Xms${minMemory}M`, `-Xmx${maxMemory}M`)

    // natives 路径
    const nativesPath = join(root, 'versions', version, `${version}-natives`)
    args.push(`-Djava.library.path=${nativesPath}`)
    log.info(`[buildJvmArguments] Natives 路径: ${nativesPath}`)

    // 基础系统参数
    args.push(
      '-Dfile.encoding=UTF-8',
      '-Duser.language=zh',
      '-Duser.country=CN',
      '-Dminecraft.launcher.brand=VoxVer',
      '-Dminecraft.launcher.version=2.0.0',
      '-Dorg.lwjgl.system.allocator=system'
    )

    // 处理版本自带 JVM 参数
    let versionJvmArgsCount = 0
    if (versionJson.arguments?.jvm) {
      log.info(`[buildJvmArguments] 处理版本自带 JVM 参数...`)

      // 检查是否包含实验性 JVM 选项，需要先添加解锁选项
      const hasExperimentalOption = versionJson.arguments.jvm.some((entry) => {
        if (typeof entry === 'string') {
          return entry.includes('G1NewSizePercent') || entry.includes('UnlockExperimental')
        }
        if (entry.value) {
          const values = Array.isArray(entry.value) ? entry.value : [entry.value]
          return values.some((v) => (v as string).includes('G1NewSizePercent'))
        }
        return false
      })

      if (hasExperimentalOption && !args.includes('-XX:+UnlockExperimentalVMOptions')) {
        args.push('-XX:+UnlockExperimentalVMOptions')
        log.info(`[buildJvmArguments] 已添加实验性选项解锁参数`)
      }

      const libraryPath = join(root, 'libraries')
      const pathSeparator = process.platform === 'win32' ? ';' : ':'

      for (const entry of versionJson.arguments.jvm) {
        if (typeof entry === 'string') {
          const val = entry
            .replace(/\$\{natives_directory\}/g, nativesPath)
            .replace(/\$\{launcher_name\}/g, 'VoxVer')
            .replace(/\$\{launcher_version\}/g, '2.0.0')
            .replace(/\$\{library_directory\}/g, libraryPath)
            .replace(/\$\{classpath_separator\}/g, pathSeparator)
            .replace(/\${classpath}/g, '')
            .trim()

          if (!val || val.startsWith('-cp')) continue

          if (val.includes('=') && val.includes('Main')) {
            const eqIdx = val.indexOf('=')
            const fabricFlag = val.substring(0, eqIdx + 1).trimEnd()
            if (fabricFlag) {
              args.push(fabricFlag)
              versionJvmArgsCount++
              log.debug(`[buildJvmArguments] 添加 Fabric 参数: ${fabricFlag}`)
            }
          } else {
            args.push(val)
            versionJvmArgsCount++
          }
        } else if (entry.rules) {
          const allowed = this.checkJvmRules(
            entry.rules as Array<{ action: string; os?: { name?: string | undefined } | undefined }>
          )
          if (allowed && entry.value) {
            const vals = Array.isArray(entry.value) ? entry.value : [entry.value]
            for (const v of vals) {
              const val = (v as string)
                .replace(/\$\{natives_directory\}/g, nativesPath)
                .replace(/\$\{library_directory\}/g, libraryPath)
                .replace(/\$\{classpath_separator\}/g, pathSeparator)
                .replace(/\${classpath}/g, '')
                .trim()
              if (val && !val.startsWith('-cp')) {
                args.push(val)
                versionJvmArgsCount++
              }
            }
          }
        }
      }
      log.info(`[buildJvmArguments] 版本自带 JVM 参数数量: ${versionJvmArgsCount}`)
    }

    // GC 参数（优化：根据内存大小智能选择）
    if (!disabledOptimizationGcArgs) {
      const baseVersion = extractBaseVersion(version)
      const isModernVersion = this.compareVersions(baseVersion, '1.18') >= 0

      if (isModernVersion) {
        // 1.18+ 使用 G1GC 并添加优化参数
        args.push(
          '-XX:+UseG1GC',
          '-XX:G1HeapRegionSize=8',
          '-XX:MaxGCPauseMillis=50',
          '-XX:+DisableExplicitGC'
        )

        // 根据最大内存动态调整 G1 预留区域
        // 注意：G1NewSizePercent/G1MaxNewSizePercent/G1ReservePercent 是实验性选项
        // 必须确保 -XX:+UnlockExperimentalVMOptions 在这些参数之前
        if (maxMemory >= 4096) {
          // 4GB+ 优化
          if (!args.includes('-XX:+UnlockExperimentalVMOptions')) {
            args.push('-XX:+UnlockExperimentalVMOptions')
          }
          args.push(
            '-XX:G1NewSizePercent=30',
            '-XX:G1MaxNewSizePercent=50',
            '-XX:G1ReservePercent=15'
          )
        } else if (maxMemory >= 2048) {
          // 2-4GB 默认优化
          if (!args.includes('-XX:+UnlockExperimentalVMOptions')) {
            args.push('-XX:+UnlockExperimentalVMOptions')
          }
          args.push(
            '-XX:G1NewSizePercent=20',
            '-XX:G1MaxNewSizePercent=40',
            '-XX:G1ReservePercent=20'
          )
        }
        // <2GB 使用保守设置，不额外添加参数

        log.info(`[buildJvmArguments] 已添加 G1 GC 优化参数 (现代版本 ${baseVersion})`)
      } else {
        // 1.17 及以下也使用 G1GC（CMS GC 在 Java 14+ 已被移除，现代 Java 环境均支持 G1GC）
        args.push(
          '-XX:+UseG1GC',
          '-XX:MaxGCPauseMillis=100',
          '-XX:+DisableExplicitGC'
        )
        log.info(`[buildJvmArguments] 已添加 G1 GC 参数 (旧版本 ${baseVersion})`)
      }
    }

    // 高级优化参数
    if (!disabledOptimizationAdvancedArgs) {
      args.push('-Xss1M')
    }

    // 网络优化参数
    if (!disabledOptimizationAdvancedArgs) {
      args.push(
        '-Djava.net.preferIPv4Stack=true', // 优先使用 IPv4
        '-Dio.netty.initialThreads=16' // Netty 线程优化
      )
    }

    // 过滤空值（不使用 Set 去重，因为 --add-opens/--add-exports 等参数需要多次出现）
    const finalArgs = args.filter(Boolean)
    log.info(`[buildJvmArguments] JVM 参数构建完成，共 ${finalArgs.length} 个参数`)
    return finalArgs
  }

  /**
   * 检查 JVM 规则
   */
  private checkJvmRules(
    rules: Array<{ action: string; os?: { name?: string | undefined } | undefined }>
  ): boolean {
    return rules.every((rule) => {
      if (rule.action === 'allow' && rule.os?.name && rule.os.name !== process.platform)
        return false
      return true
    })
  }

  /**
   * 构建游戏参数
   */
  private buildGameArguments(
    versionJson: VersionJson,
    gameCoreConfig: GameCoreConfig,
    account: GameAccount,
    windowConfig: GameWindowConfig
  ): string[] {
    const args: string[] = []
    const { root, version, gameDir } = gameCoreConfig
    const { width, height } = windowConfig
    const clientId = `VoxVer-${Date.now()}`
    const versionType = 'release'
    const assetsDir = join(root, 'assets')
    const effectiveGameDir = gameDir || root

    const hasMsa = !!(account.accessToken && account.xuid)
    const userType = hasMsa ? 'msa' : 'legacy'
    const isOffline = !account.accessToken || !hasMsa

    const replaceMap: Record<string, string> = {
      '${auth_player_name}': account.name,
      '${auth_uuid}': account.uuid,
      '${auth_access_token}': account.accessToken || 'offline',
      '${user_type}': userType,
      '${version_name}': version,
      '${game_directory}': effectiveGameDir,
      '${assets_root}': assetsDir,
      '${assets_index_name}': versionJson.assetIndex?.id || version,
      '${user_properties}': '{}',
      '${launcher_name}': 'VoxVer',
      '${launcher_version}': '2.0.0',
      '${width}': String(width),
      '${height}': String(height),
      '${clientid}': clientId,
      '${auth_xuid}': account.xuid || '',
      '${version_type}': versionType,
      '${resolution_width}': String(width),
      '${resolution_height}': String(height)
    }

    // 旧格式参数
    if (versionJson.minecraftArguments) {
      let str = versionJson.minecraftArguments
      for (const [k, v] of Object.entries(replaceMap)) {
        str = str.replace(new RegExp(k.replace(/\$/g, '\\$'), 'g'), v)
      }
      args.push(...str.split(' ').filter(Boolean))
    }

    // 新格式参数
    if (versionJson.arguments?.game) {
      args.push(...this.parseGameArguments(versionJson.arguments.game, replaceMap, { isOffline }))
    }

    // 添加自定义参数
    if (gameCoreConfig.gameArguments?.length) {
      args.push(...gameCoreConfig.gameArguments)
    }

    // 确保 --width 和 --height 始终存在（防止依赖 version JSON 占位符时缺失）
    this.ensureWindowArgs(args, windowConfig)

    // 过滤 quickPlay 和空参数
    return args.filter(
      (item) => !item.includes('quickPlay') && !item.startsWith('${quickPlay') && item.trim() !== ''
    )
  }

  /**
   * 确保游戏参数中包含窗口尺寸参数
   */
  private ensureWindowArgs(args: string[], windowConfig: GameWindowConfig): void {
    const hasWidth = args.some((a, i) => a === '--width' || (a === '--fullscreen'))
    const hasHeight = args.some((a, i) => a === '--height' || (a === '--fullscreen'))
    if (!hasWidth) {
      args.push('--width', String(windowConfig.width))
    }
    if (!hasHeight) {
      args.push('--height', String(windowConfig.height))
    }
  }

  /**
   * 验证并修复 options.txt 中不合理的窗口尺寸
   */
  private validateOptionsFile(gameDir: string): void {
    const optionsPath = join(gameDir, 'options.txt')
    try {
      if (!fs.existsSync(optionsPath)) return

      let content = fs.readFileSync(optionsPath, 'utf-8')
      let modified = false

      // 修复不合理的 overrideWidth (0 或负数)
      const widthMatch = content.match(/^overrideWidth:(-?\d+)/m)
      if (widthMatch) {
        const w = parseInt(widthMatch[1], 10)
        if (w <= 0 || w > 7680) {
          content = content.replace(/^overrideWidth:-?\d+/m, 'overrideWidth:0')
          modified = true
          log.info(`[validateOptions] 修复 overrideWidth: ${w} → 0`)
        }
      }

      // 修复不合理的 overrideHeight (0 或负数)
      const heightMatch = content.match(/^overrideHeight:(-?\d+)/m)
      if (heightMatch) {
        const h = parseInt(heightMatch[1], 10)
        if (h <= 0 || h > 4320) {
          content = content.replace(/^overrideHeight:-?\d+/m, 'overrideHeight:0')
          modified = true
          log.info(`[validateOptions] 修复 overrideHeight: ${h} → 0`)
        }
      }

      // 修复 fullscreen 可能导致的显示问题，确保 fullscreen:false 时不会出问题
      if (content.includes('fullscreen:true') && !content.includes('overrideWidth:') && !content.includes('overrideHeight:')) {
        // 全屏但没有覆盖分辨率，添加默认值防止窗口丢失
        // 不强制改动，仅记录日志
        log.info(`[validateOptions] 全屏模式且无覆盖分辨率，由游戏自行处理`)
      }

      if (modified) {
        fs.writeFileSync(optionsPath, content, 'utf-8')
      }
    } catch (e: unknown) {
      log.warn(`[validateOptions] 读取/修复 options.txt 失败: ${(e as Error).message}`)
    }
  }

  /**
   * 解析游戏参数
   */
  private parseGameArguments(
    gameArgArray: Array<string | { rules?: unknown[]; value?: string | string[] }>,
    replaceMap: Record<string, string>,
    extraRules: { isOffline: boolean }
  ): string[] {
    const args: string[] = []

    const replacePlaceholders = (str: string): string => {
      let result = str
      for (const [k, v] of Object.entries(replaceMap)) {
        result = result.replace(new RegExp(k.replace(/\$/g, '\\$'), 'g'), v)
      }
      return result
    }

    const checkFeatureRules = (rules: unknown[]): boolean => {
      return rules.every((rule) => {
        const r = rule as { action: string; os?: { name?: string; arch?: string }; features?: Record<string, boolean> }
        if (r.action !== 'allow') return true
        if (r.os?.name && r.os.name !== process.platform) return false
        if (r.os?.arch && process.arch !== r.os.arch) return false
        if (r.features) {
          if (r.features['is_demo_user'] === true && !extraRules.isOffline) return false
        }
        return true
      })
    }

    for (let i = 0; i < gameArgArray.length; i++) {
      const entry = gameArgArray[i]

      if (typeof entry === 'string') {
        const prevEntry = gameArgArray[i - 1]
        const isPrevKey = typeof prevEntry === 'string' && prevEntry.startsWith('--')

        if (isPrevKey) {
          const key = prevEntry as string
          const rawValue = entry

          if (key === '--xuid') {
            const xuidVal = replacePlaceholders(rawValue)
            if (xuidVal) args.push(key, xuidVal)
          } else if (key === '--userType') {
            const typeVal = replacePlaceholders(rawValue)
            if (typeVal) args.push(key, typeVal)
          } else {
            args.push(key, replacePlaceholders(rawValue))
          }
        } else {
          if (!entry.startsWith('--')) {
            const replaced = replacePlaceholders(entry)
            if (replaced) args.push(replaced)
          }
        }
      } else if (entry.rules) {
        if (checkFeatureRules(entry.rules)) {
          const vals = Array.isArray(entry.value) ? entry.value : [entry.value]
          for (const v of vals) {
            const replaced = replacePlaceholders(v as string)
            if (replaced) args.push(replaced)
          }
        }
      } else if (entry.value !== undefined) {
        const vals = Array.isArray(entry.value) ? entry.value : [entry.value]
        for (const v of vals) {
          const replaced = replacePlaceholders(v as string)
          if (replaced) args.push(replaced)
        }
      }
    }

    return args.filter(
      (item) => !item.startsWith('--quickPlay') && !item.includes('quickPlay') && item.trim() !== ''
    )
  }

  /**
   * 启动进程
   */
  private async spawnProcess(
    javaPath: string,
    jvmArgs: string[],
    mcArgs: string[],
    mainClass: string,
    cwd: string,
    classpathStr: string,
    version: string
  ): Promise<LaunchResult> {
    const allArgs = [...jvmArgs, '-cp', classpathStr, mainClass, ...mcArgs]

    // 移除重复的 -cp 和空参数
    const cleanArgs = allArgs.filter((arg, index) => {
      if (arg === '-cp' && allArgs[index + 1] === '') return false
      if (arg === '' && allArgs[index - 1] === '-cp') return false
      return arg.trim() !== ''
    })

    log.info(`[spawnProcess] ================ 启动命令信息 ================`)
    log.info(`[spawnProcess] Java 路径: ${javaPath}`)
    log.info(`[spawnProcess] 工作目录: ${cwd}`)
    log.info(`[spawnProcess] 主类: ${mainClass}`)
    log.info(`[spawnProcess] JVM 参数数量: ${jvmArgs.length}`)
    log.info(`[spawnProcess] 游戏参数数量: ${mcArgs.length}`)
    log.info(`[spawnProcess] 类路径文件数量预览: ${classpathStr.split(';').length}`)

    // 输出简化的类路径（只显示前几个和后几个）
    const cpFiles = classpathStr.split(';')
    if (cpFiles.length > 6) {
      log.info(`[spawnProcess] 类路径预览: `)
      cpFiles.slice(0, 3).forEach((f, i) => log.info(`[spawnProcess]   [${i + 1}] ${f}`))
      log.info(`[spawnProcess]   ... 省略 ${cpFiles.length - 6} 个文件 ...`)
      cpFiles
        .slice(-3)
        .forEach((f, i) => log.info(`[spawnProcess]   [${cpFiles.length - 2 + i}] ${f}`))
    } else {
      log.info(`[spawnProcess] 完整类路径: ${classpathStr}`)
    }

    log.info(`[spawnProcess] 完整启动参数（已清理）: ${cleanArgs.length} 个`)
    log.info(`[spawnProcess] =============================================`)

    this.sendProgress('launching-process', '正在启动游戏进程...')

    // Windows: 根据 Minecraft 版本选择 java.exe 或 javaw.exe
    // LWJGL 2（1.17及以下）必须使用 java.exe，否则窗口不可见
    // LWJGL 3（1.18及以上）使用 javaw.exe（GUI 子系统，无控制台）
    if (process.platform === 'win32') {
      const baseVersion = extractBaseVersion(version)
      const isLwjgl3 = this.compareVersions(baseVersion, '1.18') >= 0
      
      if (isLwjgl3 && javaPath.endsWith('java.exe')) {
        const javawPath = javaPath.replace(/java\.exe$/, 'javaw.exe')
        if (fs.existsSync(javawPath)) {
          log.info(`[spawnProcess] LWJGL 3 版本，切换到 javaw.exe: ${javawPath}`)
          javaPath = javawPath
        }
      } else if (!isLwjgl3 && javaPath.endsWith('javaw.exe')) {
        const javaExePath = javaPath.replace(/javaw\.exe$/, 'java.exe')
        if (fs.existsSync(javaExePath)) {
          log.info(`[spawnProcess] LWJGL 2 版本，切换到 java.exe: ${javaExePath}`)
          javaPath = javaExePath
        }
      }
    }

    // 设置环境变量（移除可能干扰的变量）
    const spawnEnv: Record<string, string | undefined> = {}
    for (const [k, v] of Object.entries(process.env)) {
      if (k === '_JAVA_OPTIONS' || k === 'JDK_JAVA_OPTIONS') {
        spawnEnv[k] = undefined
      } else {
        spawnEnv[k] = v
      }
    }

    return new Promise((resolve) => {
      let resolved = false
      let spawnFailed = false

      try {
        this.currentProcess = spawn(javaPath, cleanArgs, {
          cwd,
          env: spawnEnv,
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: false
        })
      } catch (e: unknown) {
        const err = e as Error
        log.error('[spawnProcess] spawn 异常:', err.message)
        this.setStatus('idle')
        this.sendProgress('error', '启动失败', err.message)
        resolve({ success: false, error: err.message })
        return
      }

      this.currentInstanceId = cwd
      const pid = this.currentProcess.pid
      log.info(`[spawnProcess] 进程已创建, pid=${pid}`)

      this.currentProcess.stdout?.on('data', (data: Buffer) => {
        const text = data.toString()
        this.logBuffer += text
        this.sendToWindow('game:log', { text, level: 'info' })
      })

      this.currentProcess.stderr?.on('data', (data: Buffer) => {
        const text = data.toString()
        this.logBuffer += text
        this.sendToWindow('game:log', { text, level: 'error' })
      })

      const processRef = this.currentProcess

      // 进程退出处理（独立于 launch 的 resolve）
      this.currentProcess.on('exit', (code, signal) => {
        log.info(`[spawnProcess] 进程退出: code=${code}, signal=${signal}`)
        const exitedId = this.currentInstanceId
        this.currentProcess = null
        this.currentInstanceId = null
        this.setStatus('idle')
        this.sendToWindow('game:exit', { code: code ?? -1, signal, instanceId: exitedId })

        if (code !== 0 && this.logBuffer.length > 0) {
          this.saveCrashLog(this.logBuffer)
        }

        // 如果 launch 还在等待（进程在启动检测期内退出），立即 resolve
        if (!resolved) {
          resolved = true
          if (code === 0) {
            resolve({ success: true, pid: processRef?.pid })
          } else {
            const crash = this.analyzeCrash(this.logBuffer, code ?? -1)
            if (crash) {
              this.sendToWindow('game:crash', crash)
              resolve({ success: false, error: `${crash.message}: ${crash.suggestion}` })
            } else {
              resolve({ success: false, error: `进程异常退出，代码: ${code}` })
            }
          }
        } else if (code !== 0) {
          // 已经 resolve 过（游戏曾正常运行），崩溃时通知前端
          const crash = this.analyzeCrash(this.logBuffer, code ?? -1)
          if (crash) {
            this.sendToWindow('game:crash', crash)
          }
          this.sendProgress('error', '游戏已退出', `退出代码: ${code}`)
        }
      })

      this.currentProcess.on('error', (err) => {
        log.error('[spawnProcess] 启动失败:', err.message)
        spawnFailed = true
        this.currentProcess = null
        this.currentInstanceId = null
        this.setStatus('idle')
        this.sendToWindow('game:error', { message: err.message })
        this.sendProgress('error', '启动失败', err.message)
        if (!resolved) {
          resolved = true
          resolve({ success: false, error: err.message })
        }
      })

      // 进程成功启动后短暂等待，确认没有立即崩溃，然后 resolve
      // 这样 launch() 可以继续执行，将状态切换为 'running'
      setTimeout(() => {
        if (!resolved && !spawnFailed) {
          resolved = true
          log.info(`[spawnProcess] 进程启动检测通过, pid=${pid}`)
          resolve({ success: true, pid })
        }
      }, 1500)
    })
  }

  /**
   * 分析崩溃日志
   */
  private analyzeCrash(logBuffer: string, exitCode: number): CrashReport | null {
    if (logBuffer.includes('OutOfMemoryError')) {
      return {
        type: 'OutOfMemory',
        message: '内存不足',
        suggestion: '请降低最大内存设置，或关闭其他占用内存的程序',
        stackTrace: this.extractStackTrace(logBuffer)
      }
    }

    if (
      logBuffer.includes('UnsatisfiedLinkError') ||
      logBuffer.includes('Native code library failed to load')
    ) {
      return {
        type: 'NativeLibraryError',
        message: '原生库加载失败',
        suggestion: '请重新下载游戏文件，或更新显卡驱动',
        stackTrace: this.extractStackTrace(logBuffer)
      }
    }

    if (logBuffer.includes('java.lang.ClassNotFoundException')) {
      return {
        type: 'ClassNotFound',
        message: '类文件缺失',
        suggestion: '请重新下载游戏文件',
        stackTrace: this.extractStackTrace(logBuffer)
      }
    }

    if (exitCode === 1) {
      const logPath = path.join(app.getPath('userData'), 'logs', 'latest.log')
      return {
        type: 'GenericError',
        message: '游戏启动失败',
        suggestion: `请检查日志获取更多信息。日志位置: ${logPath}。常见原因：Java版本不兼容（1.20.x需要Java 17）、游戏文件缺失、内存不足。`,
        stackTrace: this.extractStackTrace(logBuffer)
      }
    }

    return null
  }

  /**
   * 提取堆栈跟踪
   */
  private extractStackTrace(logBuffer: string): string | undefined {
    const lines = logBuffer.split('\n')
    const stackStart = lines.findIndex((line) => line.startsWith('java.lang.'))
    if (stackStart === -1) return undefined

    const stackEnd = lines
      .slice(stackStart)
      .findIndex((line) => !line.startsWith('\t') && !line.startsWith('java.lang.'))
    const stackLines =
      stackEnd === -1
        ? lines.slice(stackStart, stackStart + 20)
        : lines.slice(stackStart, stackStart + stackEnd)

    return stackLines.join('\n')
  }

  /**
   * 保存崩溃日志到文件
   */
  private saveCrashLog(logBuffer: string): void {
    try {
      const logsDir = path.join(app.getPath('userData'), 'logs')
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const logPath = path.join(logsDir, `crash-${timestamp}.log`)

      fs.writeFileSync(logPath, logBuffer, 'utf-8')
      log.info(`[saveCrashLog] 崩溃日志已保存到: ${logPath}`)
    } catch (e) {
      log.error(`[saveCrashLog] 保存日志失败: ${e}`)
    }
  }

  /**
   * 下载文件（支持重定向）
   */
  downloadFile(url: string, destPath: string, timeout = 30000, maxRedirects = 5): Promise<void> {
    return new Promise((resolve, reject) => {
      if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) return resolve()
      const dir = path.dirname(destPath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

      const followRedirect = (currentUrl: string, redirectsLeft: number) => {
        const protocol = currentUrl.startsWith('https') ? https : http
        const req = protocol.get(currentUrl, { timeout }, (res) => {
          // 处理重定向
          if (
            [301, 302, 303, 307, 308].includes(res.statusCode || 0) &&
            res.headers.location
          ) {
            if (redirectsLeft <= 0) {
              req.destroy()
              return reject(new Error(`重定向次数超过限制: ${url}`))
            }
            const redirectUrl = res.headers.location.startsWith('http')
              ? res.headers.location
              : new URL(res.headers.location, currentUrl).href
            req.destroy()
            followRedirect(redirectUrl, redirectsLeft - 1)
            return
          }

          if (res.statusCode === 404) {
            req.destroy()
            return reject(new Error(`404: ${url}`))
          }

          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            req.destroy()
            return reject(new Error(`HTTP ${res.statusCode}: ${url}`))
          }

          const file = fs.createWriteStream(destPath)
          res.pipe(file)
          file.on('finish', () => {
            file.close()
            const stats = fs.statSync(destPath)
            if (stats.size === 0) {
              reject(new Error(`下载文件为空: ${url}`))
            } else {
              resolve()
            }
          })
          file.on('error', (err) => {
            reject(err)
          })
        })
        req.on('error', reject)
        req.on('timeout', () => {
          req.destroy()
          reject(new Error('下载超时'))
        })
      }

      followRedirect(url, maxRedirects)
    })
  }

  /**
   * 解压 JAR
   */
  private extractJar(jarPath: string, destDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(jarPath)) return resolve()
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })

      if (process.platform === 'win32') {
        const psScript = [
          '[System.Reflection.Assembly]::LoadWithPartialName("System.IO.Compression.FileSystem") | Out-Null',
          `[System.IO.Compression.ZipFile]::ExtractToDirectory('${jarPath.replace(/'/g, "''")}', '${destDir.replace(/'/g, "''")}')`
        ].join('\n')

        const tmpPs = join(require('os').tmpdir(), `mcla-extract-${Date.now()}.ps1`)
        fs.writeFileSync(tmpPs, psScript, 'utf-8')

        const ps = spawn('powershell.exe', [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          tmpPs
        ])
        let errMsg = ''
        ps.stderr?.on('data', (d: Buffer) => {
          errMsg += d.toString()
        })
        ps.on('exit', (code) => {
          try {
            fs.unlinkSync(tmpPs)
          } catch {}
          if (code === 0) resolve()
          else reject(new Error(`PowerShell 解压失败(code=${code}): ${errMsg}`))
        })
        ps.on('error', reject)
      } else {
        const unzip = spawn('unzip', ['-o', jarPath, '-d', destDir])
        let errMsg = ''
        unzip.stderr?.on('data', (d: Buffer) => {
          errMsg += d.toString()
        })
        unzip.on('exit', (code) => {
          if (code === 0) resolve()
          else reject(new Error(`unzip 失败(code=${code}): ${errMsg}`))
        })
        unzip.on('error', reject)
      }
    })
  }

  /**
   * 版本比较
   */
  private compareVersions(a: string, b: string): number {
    const pa = a.split('.').map(Number)
    const pb = b.split('.').map(Number)
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      if ((pa[i] || 0) > (pb[i] || 0)) return 1
      if ((pa[i] || 0) < (pb[i] || 0)) return -1
    }
    return 0
  }

  /**
   * 设置状态
   */
  private setStatus(status: GameStatus): void {
    this.gameStatus = status
    this.sendToWindow('game:status', { status })
  }

  /**
   * 发送进度
   */
  private sendProgress(phase: LaunchPhase, message: string, detail?: string): void {
    this.sendToWindow('game:progress', { phase, message, detail })
  }

  /**
   * 发送消息到窗口
   */
  private sendToWindow(channel: string, data: unknown): void {
    if (this.mainWindow && this.mainWindow.webContents) {
      try {
        this.mainWindow.webContents.send(channel, data)
      } catch (e) {
        log.warn(`[sendToWindow] 发送失败: ${channel}`, e)
      }
    }
  }
}

// ===== 全局实例管理 =====

let launcherInstance: MinecraftLauncher | null = null

function getLauncher(mainWindow: BrowserWindow): MinecraftLauncher {
  if (!launcherInstance) {
    launcherInstance = new MinecraftLauncher(mainWindow)
  }
  return launcherInstance
}

/**
 * 获取当前启动器实例（用于 IPC 调用）
 */
export function getLauncherInstance(): MinecraftLauncher | null {
  return launcherInstance
}

// ===== 公共 API =====

/**
 * 创建启动配置
 */
export function createLaunchConfig(
  mainWindow: BrowserWindow,
  options: {
    versionId: string
    accountId?: string
    gameDir?: string
    /** 实例独立目录（版本隔离模式），mods/configs/saves 存储位置 */
    instancePath?: string
    javaPath?: string
    jvmArgs?: string
    width?: number
    height?: number
    maxMemory?: number
    minMemory?: number
  }
): LaunchConfig {
  const db = getDatabase()

  // 获取游戏目录
  let mcDir = options.gameDir
  if (!mcDir) {
    const lastFolder = db
      .prepare("SELECT value FROM configs WHERE key = 'last_selected_folder'")
      .get() as { value: string } | undefined
    if (lastFolder?.value && fs.existsSync(lastFolder.value)) {
      mcDir = lastFolder.value
    }
  }
  if (!mcDir) {
    const customPath = db
      .prepare("SELECT value FROM configs WHERE key = 'custom_minecraft_path'")
      .get() as { value: string } | undefined
    if (customPath?.value && fs.existsSync(customPath.value)) {
      mcDir = customPath.value
    }
  }
  if (!mcDir || !fs.existsSync(mcDir)) {
    mcDir = defaultMcDir()
  }

  // 实例独立目录（版本隔离）
  const instancePath = options.instancePath
  const isIsolated = !!(instancePath && instancePath !== mcDir)

  // 获取账户
  let account: GameAccount = { name: 'Steve', uuid: offlineUUID('Steve') }

  if (options.accountId) {
    const row = db
      .prepare('SELECT name, uuid, access_token, xuid FROM accounts WHERE id = ?')
      .get(options.accountId) as AccountRow | undefined
    if (row) {
      account = {
        name: row.name,
        uuid: row.uuid,
        accessToken: row.access_token,
        xuid: row.xuid
      }
    }
  }

  const activeRow = db
    .prepare('SELECT name, uuid, access_token, xuid FROM accounts WHERE is_active = 1 LIMIT 1')
    .get() as AccountRow | undefined
  if (activeRow) {
    account = {
      name: activeRow.name,
      uuid: activeRow.uuid,
      accessToken: activeRow.access_token,
      xuid: activeRow.xuid
    }
  }

  // 获取内存设置（实例配置优先）
  const memRow = db.prepare("SELECT value FROM configs WHERE key = 'global_max_memory'").get() as
    | { value: string }
    | undefined
  let maxMem = options.maxMemory || parseInt(memRow?.value || '2048')
  const minMem = options.minMemory || Math.min(512, Math.floor(maxMem / 4))

  // 限制最大内存不超过系统可用内存的 60%（防止 JVM 创建失败）
  const totalMem = os.totalmem() / (1024 * 1024)
  const availableMem = Math.floor(totalMem * 0.6)
  if (maxMem > availableMem) {
    maxMem = Math.max(512, availableMem)
    log.warn(`[createLaunchConfig] 内存配置 ${options.maxMemory || memRow?.value}MB 超过系统可用，限制为 ${maxMem}MB`)
  }

  // 获取 Java 路径（实例配置优先）
  const presetRow = db.prepare("SELECT value FROM configs WHERE key = 'java_preset'").get() as
    | { value: string }
    | undefined
  const preset = presetRow?.value || 'auto'
  const customJavaRow = db
    .prepare("SELECT value FROM configs WHERE key = 'java_custom_path'")
    .get() as { value: string } | undefined
  const customJavaPath = customJavaRow?.value || ''

  let effectiveJavaPath = ''
  if (options.javaPath && fs.existsSync(options.javaPath)) {
    effectiveJavaPath = options.javaPath
  } else if (preset === 'custom' && customJavaPath && fs.existsSync(customJavaPath)) {
    effectiveJavaPath = customJavaPath
  }

  return {
    account,
    gameWindowConfig: {
      width: options.width || 854,
      height: options.height || 480,
      isFullScreen: false
    },
    gameCoreConfig: {
      root: mcDir,
      version: options.versionId,
      gameDir: instancePath,
      isVersionIsolation: isIsolated
    },
    javaConfig: {
      javaPath: effectiveJavaPath,
      maxMemory: maxMem,
      minMemory: minMem,
      disabledOptimizationAdvancedArgs: false,
      disabledOptimizationGcArgs: false
    }
  }
}

/**
 * 提取纯版本号（从完整路径或带 loader 的版本名中提取）
 */
function extractBaseVersion(versionId: string): string {
  // 如果是完整路径，提取文件名
  let name = versionId
  if (versionId.includes('\\') || versionId.includes('/')) {
    name = versionId.split(/[\\/]/).pop() || versionId
  }
  // 只在版本名以数字开头时才提取版本号（避免从 "整合包V1.4.2" 中错误提取 "1.4.2"）
  const match = name.match(/^(\d+\.\d+(?:\.\d+)?)/)
  if (match) {
    return match[1]
  }
  return name
}

/**
 * 按版本 ID 启动游戏（主入口）
 */
export async function launchByVersion(
  mainWindow: BrowserWindow,
  options: {
    versionId: string
    accountId?: string
    instancePath?: string
    javaPath?: string
    maxMemory?: number
    minMemory?: number
    width?: number
    height?: number
  }
): Promise<LaunchResult> {
  const config = createLaunchConfig(mainWindow, options)
  const launcher = getLauncher(mainWindow)
  // 提取纯版本号用于 Java 选择
  const baseVersion = extractBaseVersion(options.versionId)
  log.info(`[launchByVersion] 版本ID: ${options.versionId}, 基础版本: ${baseVersion}`)
  return launcher.launch(config)
}

/**
 * 按实例启动游戏
 */
export async function launchGame(
  mainWindow: BrowserWindow,
  options: { instanceId: string; accountId?: string }
): Promise<LaunchResult> {
  const db = getDatabase()
  const instance = db
    .prepare(
      'SELECT version_id, path, java_path, jvm_args, min_memory, max_memory, width, height FROM instances WHERE id = ?'
    )
    .get(options.instanceId) as {
      version_id: string
      path: string
      java_path: string
      jvm_args: string
      min_memory: number
      max_memory: number
      width: number
      height: number
    } | undefined

  if (!instance) {
    return { success: false, error: '实例不存在' }
  }

  return launchByVersion(mainWindow, {
    versionId: instance.version_id,
    accountId: options.accountId,
    instancePath: instance.path || undefined,
    javaPath: instance.java_path || undefined,
    maxMemory: instance.max_memory || undefined,
    minMemory: instance.min_memory || undefined,
    width: instance.width || undefined,
    height: instance.height || undefined
  })
}

/**
 * 终止游戏
 */
export function terminateGame(): void {
  if (launcherInstance) {
    launcherInstance.terminate()
  }
}

/**
 * 获取当前状态
 */
export function getGameStatus(): GameStatus {
  return launcherInstance?.status ?? 'idle'
}

/**
 * 检查游戏是否正在运行
 */
export function isRunning(): boolean {
  return launcherInstance?.status === 'running'
}

/**
 * 获取当前日志
 */
export function getCurrentLog(): string {
  return launcherInstance ? (launcherInstance as { logBuffer?: string }).logBuffer || '' : ''
}

// ===== 工具函数 =====

function offlineUUID(name: string): string {
  const crypto = require('crypto')
  const hash = crypto.createHash('md5').update(`OfflinePlayer:${name}`).digest('hex')
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32)
  ].join('-')
}

/**
 * 继续启动流程（用户确认下载后调用）
 * 此方法会下载缺失文件，然后继续启动游戏
 */
export async function continueLaunchAfterDownload(
  mainWindow: BrowserWindow,
  options: {
    versionId: string
    accountId?: string
    instancePath?: string
    javaPath?: string
    maxMemory?: number
    minMemory?: number
    width?: number
    height?: number
  }
): Promise<LaunchResult> {
  const config = createLaunchConfig(mainWindow, options)
  const launcher = getLauncher(mainWindow)
  const baseVersion = extractBaseVersion(options.versionId)
  log.info(`[continueLaunchAfterDownload] 版本ID: ${options.versionId}, 基础版本: ${baseVersion}`)

  // 1. 获取版本信息
  const versionJson = await launcher.resolveVersionJson(config.gameCoreConfig)
  if (!versionJson) {
    return { success: false, error: `版本文件不存在: ${options.versionId}` }
  }

  // 2. 处理继承版本
  const finalVersionJson = await launcher.resolveInheritedVersion(config.gameCoreConfig, versionJson)

  // 3. 下载缺失文件
  const downloadResult = await launcher.downloadMissingFiles(config.gameCoreConfig, finalVersionJson)
  if (!downloadResult.success) {
    return { success: false, error: downloadResult.error || '下载缺失文件失败' }
  }

  // 4. 继续启动游戏（跳过文件检测，避免死循环）
  return launcher.launchDirect(config)
}

export function defaultMcDir(): string {
  const os = require('os')
  if (process.platform === 'win32') {
    return join(os.homedir(), 'AppData', 'Roaming', '.minecraft')
  } else if (process.platform === 'darwin') {
    return join(os.homedir(), 'Library', 'Application Support', 'minecraft')
  } else {
    return join(os.homedir(), '.minecraft')
  }
}

/**
 * 从 Java 路径获取 Java 信息（PCL2风格：完整探测）
 */
async function getJavaInfoFromPath(
  javaPath: string
): Promise<{ path: string; vendor: string; version: string; majorVersion: number } | null> {
  try {
    const info = await probeJava(javaPath)
    if (info) {
      return {
        path: info.path,
        vendor: info.vendor,
        version: info.version,
        majorVersion: info.majorVersion
      }
    }
  } catch (e) {
    log.warn(`[getJavaInfoFromPath] 探测 Java 失败: ${javaPath}`, e)
  }
  return null
}

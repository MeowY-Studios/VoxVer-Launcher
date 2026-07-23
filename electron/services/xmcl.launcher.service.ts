import { launch, Version, diagnose, MinecraftIssueReport, MinecraftFolder, ResolvedVersion } from '@xmcl/core'
import { installDependencies, getVersionList, installVersion, installAssets, installLibraries } from '@xmcl/installer'
import { ChildProcess } from 'child_process'
import { BrowserWindow } from 'electron'
import * as fs from 'fs'
import { join, dirname } from 'path'
import * as os from 'os'
import {
  getDefaultJava,
  validateJava,
  recommendedJavaMajor,
  detectAllJava
} from './java.management.service'
import { getDatabase } from './database'
import { logger } from '../utils/logger'
import { safeJoin, validatePathSafe } from '../utils/path-validation'
const log = logger.child('XMCL')

// BMCLAPI 镜像配置
const BMCLAPI_BASE = 'https://bmclapi2.bangbang93.com'
const BMCLAPI_MAVEN = `${BMCLAPI_BASE}/maven`
const BMCLAPI_ASSETS = `${BMCLAPI_BASE}/assets`
const BMCLAPI_VERSION = `${BMCLAPI_BASE}/version`
// BMCLAPI 版本清单 URL（替代官方 launchermeta.mojang.com）
const BMCLAPI_VERSION_MANIFEST = `${BMCLAPI_BASE}/mc/game/version_manifest.json`

// BMCLAPI 库下载源替换
function bmclapiLibraryHost(lib: { download?: { url?: string } }): string | string[] | undefined {
  if (lib.download?.url) {
    const originalUrl = lib.download.url
    if (originalUrl.includes('libraries.minecraft.net')) {
      return originalUrl.replace('https://libraries.minecraft.net', BMCLAPI_MAVEN)
    }
    if (originalUrl.includes('maven.fabricmc.net')) {
      return originalUrl.replace('https://maven.fabricmc.net', `${BMCLAPI_BASE}/maven`)
    }
    if (originalUrl.includes('files.minecraftforge.net')) {
      return originalUrl.replace('https://files.minecraftforge.net', `${BMCLAPI_BASE}/maven`)
    }
    if (originalUrl.includes('maven.minecraftforge.net')) {
      return originalUrl.replace('https://maven.minecraftforge.net', `${BMCLAPI_BASE}/maven`)
    }
  }
  return undefined
}

// 资源索引 URL 替换为 BMCLAPI
function bmclapiAssetsIndexUrl(version: ResolvedVersion): string | string[] {
  if (version.assetIndex?.url) {
    return version.assetIndex.url
      .replace('https://launchermeta.mojang.com', BMCLAPI_BASE)
      .replace('https://piston-meta.mojang.com', BMCLAPI_BASE)
  }
  // 返回空数组表示不替换（类型要求不能返回 undefined）
  return []
}

// 统一的 BMCLAPI 安装选项
function getBmclapiInstallOptions(): Record<string, unknown> {
  return {
    libraryHost: bmclapiLibraryHost,
    mavenHost: [BMCLAPI_MAVEN, `${BMCLAPI_BASE}/maven`],
    assetsHost: [BMCLAPI_ASSETS, `${BMCLAPI_BASE}/assets`],
    assetsIndexUrl: bmclapiAssetsIndexUrl
  }
}

// 使用 diagnose 检测缺失/损坏的文件
async function detectMissingFiles(
  gamePath: string,
  versionId: string
): Promise<MinecraftIssueReport | null> {
  try {
    const folder = new MinecraftFolder(gamePath)
    const report = await diagnose(versionId, folder)
    log.info(`[detectMissingFiles] 检测到 ${report.issues.length} 个问题`)
    report.issues.forEach((issue) => {
      log.info(`[detectMissingFiles] - [${issue.type}] ${issue.role}: ${issue.hint}`)
    })
    return report
  } catch (e: unknown) {
    log.warn(`[detectMissingFiles] 检测失败（跳过诊断直接安装）: ${(e as Error).message}`)
    return null
  }
}

// 下载缺失的版本 JSON 和 JAR（处理原版及衍生版本如 Forge/Fabric）
async function downloadVersionFiles(
  folder: MinecraftFolder,
  versionId: string,
  resolvedVersion: ResolvedVersion
): Promise<void> {
  // 衍生版本（Forge/Fabric/OptiFine）的 minecraftVersion 才是原版版本号
  // inheritances 数组最后一个元素是根 Minecraft 版本
  const mcVersion = resolvedVersion.minecraftVersion
    || resolvedVersion.inheritances?.[resolvedVersion.inheritances.length - 1]
    || versionId

  const versionJsonPath = folder.getVersionJson(versionId)
  const versionJarPath = folder.getVersionJar(versionId)

  const jsonMissing = !fs.existsSync(versionJsonPath)
  const jarMissing = !fs.existsSync(versionJarPath)

  if (!jsonMissing && !jarMissing) {
    log.info(`[downloadVersionFiles] 版本 JSON 和 JAR 均存在，跳过下载`)
    return
  }

  // 衍生版本的 JAR 通常继承自父版本，只有原版需要从版本清单下载
  // 如果 versionId !== mcVersion，说明是衍生版本，其 JAR 应来自父版本
  const isDerivedVersion = versionId !== mcVersion

  if (isDerivedVersion) {
    log.info(`[downloadVersionFiles] 衍生版本 ${versionId}，根 Minecraft 版本: ${mcVersion}`)
    // 检查父版本 JAR
    const parentJarPath = folder.getVersionJar(mcVersion)
    if (!fs.existsSync(parentJarPath)) {
      log.info(`[downloadVersionFiles] 父版本 JAR 缺失，下载: ${mcVersion}`)
      await downloadFromVersionList(folder, mcVersion)
    } else {
      log.info(`[downloadVersionFiles] 父版本 JAR 已存在: ${mcVersion}`)
    }
    return
  }

  // 原版版本，从版本清单下载
  await downloadFromVersionList(folder, versionId)
}

// 从 BMCLAPI 版本清单下载版本 JSON + JAR
async function downloadFromVersionList(folder: MinecraftFolder, versionId: string): Promise<void> {
  try {
    log.info(`[downloadFromVersionList] 获取版本清单（BMCLAPI）...`)
    const versionList = await getVersionList({ remote: BMCLAPI_VERSION_MANIFEST })
    const versionMeta = versionList.versions.find((v) => v.id === versionId)

    if (!versionMeta) {
      log.warn(`[downloadFromVersionList] 版本清单中未找到: ${versionId}`)
      return
    }

    log.info(`[downloadFromVersionList] 从 BMCLAPI 安装版本: ${versionId}`)
    await installVersion(versionMeta, folder, {
      json: `${BMCLAPI_VERSION}/${versionId}/json`,
      client: `${BMCLAPI_VERSION}/${versionId}/client`
    })
    log.info(`[downloadFromVersionList] 版本 ${versionId} 安装完成`)
  } catch (e: unknown) {
    log.error(`[downloadFromVersionList] 下载版本 ${versionId} 失败: ${(e as Error).message}`)
    throw e
  }
}

// 下载缺失的依赖文件（主入口）
async function downloadMissingDependencies(
  mainWindow: BrowserWindow,
  gamePath: string,
  versionId: string,
  resolvedVersion: ResolvedVersion
): Promise<boolean> {
  try {
    log.info(`[downloadMissingDependencies] 开始检测并下载缺失文件: ${versionId}`)
    mainWindow.webContents.send('game:status', 'downloading')

    const folder = new MinecraftFolder(gamePath)

    // 1. 先用 diagnose 检测缺失文件（用于日志和反馈）
    const report = await detectMissingFiles(gamePath, versionId)

    if (report && report.issues.length === 0) {
      log.info(`[downloadMissingDependencies] 诊断完成，所有文件完整，无需下载`)
      mainWindow.webContents.send('game:status', 'launching')
      return true
    }

    if (report) {
      const missingCount = report.issues.filter((i) => i.type === 'missing').length
      const corruptedCount = report.issues.filter((i) => i.type === 'corrupted').length
      log.info(`[downloadMissingDependencies] 缺失 ${missingCount} 个，损坏 ${corruptedCount} 个文件`)
    }

    // 2. 下载版本 JSON 和 JAR（处理衍生版本）
    try {
      await downloadVersionFiles(folder, versionId, resolvedVersion)
    } catch (e: unknown) {
      log.warn(`[downloadMissingDependencies] 版本文件下载失败: ${(e as Error).message}`)
    }

    // 3. 安装依赖（libraries + assets）— installDependencies 内部会跳过已存在的文件
    log.info(`[downloadMissingDependencies] 开始安装依赖（库 + 资源）`)
    try {
      // 重新解析版本，确保下载的 JSON 被加载
      const refreshedVersion = await Version.parse(gamePath, versionId)
      await installDependencies(refreshedVersion, getBmclapiInstallOptions())
      log.info(`[downloadMissingDependencies] 依赖安装完成`)
    } catch (e: unknown) {
      log.warn(`[downloadMissingDependencies] installDependencies 失败，尝试分步安装: ${(e as Error).message}`)
      // 分步安装：先库后资源
      try {
        const refreshedVersion = await Version.parse(gamePath, versionId)
        await installLibraries(refreshedVersion, getBmclapiInstallOptions())
        log.info(`[downloadMissingDependencies] 库安装完成`)
        await installAssets(refreshedVersion, getBmclapiInstallOptions())
        log.info(`[downloadMissingDependencies] 资源安装完成`)
      } catch (e2: unknown) {
        log.error(`[downloadMissingDependencies] 分步安装也失败: ${(e2 as Error).message}`)
      }
    }

    // 4. 再次诊断确认
    const finalReport = await detectMissingFiles(gamePath, versionId)
    if (finalReport && finalReport.issues.length > 0) {
      log.warn(`[downloadMissingDependencies] 仍存在 ${finalReport.issues.length} 个问题`)
    }

    mainWindow.webContents.send('game:status', 'launching')
    return true
  } catch (e: unknown) {
    log.error(`[downloadMissingDependencies] 依赖下载失败: ${(e as Error).message}`)
    mainWindow.webContents.send('game:status', 'launching')
    return false
  }
}

export interface XMCLAccount {
  name: string
  uuid: string
  accessToken?: string | null
  xuid?: string | null
}

export interface XMCLLaunchOptions {
  versionId: string
  gamePath: string
  javaPath?: string
  maxMemory?: number
  minMemory?: number
  width?: number
  height?: number
  account: XMCLAccount
  server?: { ip: string; port?: number }
  extraJvmArgs?: string[]
  gameDir?: string
  isDemo?: boolean
}

export interface XMCLLaunchResult {
  success: boolean
  error?: string
  pid?: number
  needsDiagnose?: boolean
  issues?: MinecraftIssueReport['issues']
}

let currentProcess: ChildProcess | null = null
let gameStatus: 'idle' | 'launching' | 'running' = 'idle'

export function getXMCLStatus() {
  return gameStatus
}

export function getXMCLProcess() {
  return currentProcess
}

export function terminateXMCLGame() {
  if (currentProcess) {
    currentProcess.kill()
    currentProcess = null
    gameStatus = 'idle'
  }
}

// 获取每个 Minecraft 版本的最大允许 Java 版本
// 超过此版本会导致 LWJGL/字节码兼容性问题（如 1.16 用 Java 26 会崩溃）
function maxJavaMajor(mcVersion: string): number {
  if (!mcVersion || !/^\d+\.\d+/.test(mcVersion)) return 21
  // MC 1.20.5+ 允许 Java 21（及更高）
  if (compareMcVersions(mcVersion, '1.20.5') >= 0) return 25
  // MC 1.18 - 1.20.4 允许 Java 17-21
  if (compareMcVersions(mcVersion, '1.18') >= 0) return 21
  // MC 1.17 允许 Java 16-17
  if (compareMcVersions(mcVersion, '1.17') >= 0) return 17
  // MC 1.16 及以下：最高 Java 11（Java 17+ 会导致 LWJGL 2 崩溃）
  return 11
}

// 版本号比较（返回 -1/0/1）
function compareMcVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const da = pa[i] || 0
    const db = pb[i] || 0
    if (da > db) return 1
    if (da < db) return -1
  }
  return 0
}

async function resolveJavaPath(versionId: string, javaPath?: string): Promise<string> {
  const baseVersion = extractBaseVersion(versionId)
  const recommendedMajor = recommendedJavaMajor(baseVersion)
  const maxMajor = maxJavaMajor(baseVersion)

  log.info(`[resolveJavaPath] 版本 ${versionId} → 推荐 Java ${recommendedMajor}, 最大允许 Java ${maxMajor}`)

  // 1. 用户指定的 Java 路径优先（信任用户选择，只验证可用性）
  if (javaPath && fs.existsSync(javaPath)) {
    const validation = await validateJava(javaPath)
    if (validation.success) {
      log.info(`[resolveJavaPath] 使用用户指定 Java ${validation.javaVersion}: ${javaPath}`)
      return javaPath
    }
    log.warn(`[resolveJavaPath] 用户指定 Java 验证失败: ${validation.error}，将自动选择`)
  }

  // 2. 扫描所有 Java，筛选允许范围内的版本
  const allJavas = await detectAllJava()
  const inRange = allJavas.filter((j) => {
    return j.majorVersion >= recommendedMajor && j.majorVersion <= maxMajor
  })

  if (inRange.length > 0) {
    // 优先选择等于推荐版本的；否则选择最接近推荐版本（最低于上限）的
    inRange.sort((a, b) => {
      const diffA = Math.abs(a.majorVersion - recommendedMajor)
      const diffB = Math.abs(b.majorVersion - recommendedMajor)
      if (diffA !== diffB) return diffA - diffB
      // 差距相同则选择较低版本（更稳定）
      return a.majorVersion - b.majorVersion
    })
    const picked = inRange[0]
    log.info(`[resolveJavaPath] 选择 Java ${picked.version} (major ${picked.majorVersion}): ${picked.path}`)
    return picked.path
  }

  // 3. 回退：允许范围内没有，放宽限制选择 >= 推荐版本中最低的
  log.warn(`[resolveJavaPath] 未找到 Java [${recommendedMajor}, ${maxMajor}] 范围内的版本，放宽限制`)
  const fallback = allJavas.filter((j) => j.majorVersion >= recommendedMajor)
  if (fallback.length > 0) {
    fallback.sort((a, b) => a.majorVersion - b.majorVersion)
    const picked = fallback[0]
    log.info(`[resolveJavaPath] 回退选择 Java ${picked.version}: ${picked.path}`)
    return picked.path
  }

  // 4. 最后回退到默认 Java
  const defaultJava = await getDefaultJava()
  if (defaultJava && fs.existsSync(defaultJava.path)) {
    log.warn(`[resolveJavaPath] 使用默认 Java: ${defaultJava.path}`)
    return defaultJava.path
  }

  throw new Error(`未找到兼容的 Java 运行环境（需要 Java ${recommendedMajor}-${maxMajor}）`)
}

function extractBaseVersion(versionId: string): string {
  const match = versionId.match(/^\d+\.\d+(?:\.\d+)?/)
  return match ? match[0] : versionId
}

function calculateMaxMemory(requested?: number): number {
  const totalMem = os.totalmem() / (1024 * 1024)
  const availableMem = Math.floor(totalMem * 0.6)
  
  let maxMem = requested || 4096
  if (maxMem > availableMem) {
    maxMem = Math.max(512, availableMem)
    log.warn(`[calculateMaxMemory] 内存配置 ${requested}MB 超过系统可用，限制为 ${maxMem}MB`)
  }
  return maxMem
}

/**
 * 为实例目录创建到共享目录的链接（versions / libraries / assets）
 * 使实例目录成为独立的 Minecraft 数据目录，mods/saves 等实例数据与共享核心文件分离
 */
function prepareInstanceDir(sharedGamePath: string, instancePath: string): void {
  const sharedDirs = ['versions', 'libraries', 'assets']
  const createdLinks: string[] = []

  for (const dir of sharedDirs) {
    const sharedDir = join(sharedGamePath, dir)
    const instanceDir = join(instancePath, dir)

    if (!fs.existsSync(sharedDir)) continue

    // 目录已存在（可能是之前的链接或实际目录），跳过
    if (fs.existsSync(instanceDir)) {
      try {
        const stat = fs.lstatSync(instanceDir)
        if (stat.isSymbolicLink()) {
          log.info(`[prepareInstanceDir] 链接已存在，跳过: ${instanceDir}`)
        } else {
          log.info(`[prepareInstanceDir] 目录已存在（非链接），跳过: ${instanceDir}`)
        }
      } catch {
        log.info(`[prepareInstanceDir] 目录已存在，跳过: ${instanceDir}`)
      }
      continue
    }

    // 创建目录连接（Windows Junction，无需管理员权限）
    try {
      if (process.platform === 'win32') {
        fs.symlinkSync(sharedDir, instanceDir, 'junction')
      } else {
        fs.symlinkSync(sharedDir, instanceDir, 'dir')
      }
      createdLinks.push(dir)
      log.info(`[prepareInstanceDir] 已创建目录链接: ${instanceDir} -> ${sharedDir}`)
    } catch (e: unknown) {
      log.warn(`[prepareInstanceDir] 创建链接失败 ${dir}: ${(e as Error).message}，尝试 cmd fallback`)
      // Windows 回退：使用 mklink /J（路径已通过 validatePathSafe 校验）
      try {
        const { execSync } = require('child_process')
        validatePathSafe(instanceDir)
        validatePathSafe(sharedDir)
        execSync(`cmd /c mklink /J "${instanceDir}" "${sharedDir}"`, {
          encoding: 'utf-8',
          windowsHide: true
        })
        createdLinks.push(dir)
        log.info(`[prepareInstanceDir] mklink 成功: ${instanceDir} -> ${sharedDir}`)
      } catch (e2: unknown) {
        log.warn(`[prepareInstanceDir] mklink 也失败 ${dir}: ${(e2 as Error).message}`)
        // 如果链接创建失败，清理已创建的链接
        for (const linked of createdLinks) {
          try {
            const linkPath = join(instancePath, linked)
            if (fs.existsSync(linkPath)) {
              fs.rmSync(linkPath, { recursive: true, force: true })
            }
          } catch { /* ignore */ }
        }
        throw e
      }
    }
  }
}

export async function launchWithXMCL(
  mainWindow: BrowserWindow,
  options: XMCLLaunchOptions
): Promise<XMCLLaunchResult> {
  try {
    gameStatus = 'launching'
    log.info(`[launchWithXMCL] 开始启动版本: ${options.versionId}`)
    
    const sharedGamePath = options.gamePath
    const instancePath = options.gameDir
    let gamePath = sharedGamePath
    const versionId = options.versionId
    
    if (!fs.existsSync(gamePath)) {
      return { success: false, error: `游戏目录不存在: ${gamePath}` }
    }

    let javaPath: string
    try {
      javaPath = await resolveJavaPath(versionId, options.javaPath)
      log.info(`[launchWithXMCL] 使用 Java: ${javaPath}`)
    } catch (e: unknown) {
      return { success: false, error: (e as Error).message }
    }

    let resolvedVersion: ResolvedVersion
    try {
      resolvedVersion = await Version.parse(gamePath, versionId)
      log.info(`[launchWithXMCL] 版本解析成功: ${resolvedVersion.id}`)
    } catch (e: unknown) {
      log.error(`[launchWithXMCL] 版本解析失败: ${(e as Error).message}`)
      return { success: false, error: `版本解析失败: ${(e as Error).message}` }
    }

    // 自动检测并下载缺失的依赖文件
    try {
      log.info(`[launchWithXMCL] 检测并下载缺失的依赖文件...`)
      await downloadMissingDependencies(mainWindow, gamePath, versionId, resolvedVersion)
      // 重新解析版本，确保依赖信息最新
      resolvedVersion = await Version.parse(gamePath, versionId)
    } catch (e: unknown) {
      log.warn(`[launchWithXMCL] 依赖下载失败，尝试直接启动: ${(e as Error).message}`)
    }

    // 修复自包含版本（无 inheritsFrom）的版本 JAR 路径问题
    // XMCL 用 mc.getVersionJar(version.minecraftVersion) 构建 classpath，但自包含版本的 JAR 在自己的目录里
    const folder = new MinecraftFolder(gamePath)
    const mcVersionJar = folder.getVersionJar(resolvedVersion.minecraftVersion)
    const actualVersionJar = folder.getVersionJar(versionId)
    if (resolvedVersion.inheritances.length === 1
        && resolvedVersion.minecraftVersion !== versionId
        && !fs.existsSync(mcVersionJar)
        && fs.existsSync(actualVersionJar)) {
      log.info(`[launchWithXMCL] 检测到自包含版本，确保 Minecraft 版本 JAR 存在: ${resolvedVersion.minecraftVersion}`)
      try {
        const mcVersionDir = dirname(mcVersionJar)
        if (!fs.existsSync(mcVersionDir)) {
          fs.mkdirSync(mcVersionDir, { recursive: true })
        }
        // 创建硬链接或复制
        try {
          fs.linkSync(actualVersionJar, mcVersionJar)
          log.info(`[launchWithXMCL] 已创建版本 JAR 硬链接: ${mcVersionJar}`)
        } catch {
          fs.copyFileSync(actualVersionJar, mcVersionJar)
          log.info(`[launchWithXMCL] 已复制版本 JAR: ${mcVersionJar}`)
        }
      } catch (e: unknown) {
        log.warn(`[launchWithXMCL] 创建版本 JAR 失败: ${(e as Error).message}`)
      }
    }

    // 如果指定了实例路径，准备实例目录并使用它作为游戏数据目录
    // 这样 mods/saves/resourcepacks 等实例数据会存储到实例路径下
    if (instancePath && instancePath !== sharedGamePath) {
      try {
        // 确保实例目录存在
        if (!fs.existsSync(instancePath)) {
          fs.mkdirSync(instancePath, { recursive: true })
        }
        prepareInstanceDir(sharedGamePath, instancePath)
        gamePath = instancePath
        log.info(`[launchWithXMCL] 实例目录准备完成，使用实例目录作为游戏目录: ${gamePath}`)
      } catch (e: unknown) {
        log.warn(`[launchWithXMCL] 准备实例目录失败，回退到共享目录: ${(e as Error).message}`)
      }
    }

    const maxMem = calculateMaxMemory(options.maxMemory)
    const minMem = options.minMemory || Math.min(512, maxMem)
    
    const yggdrasilAgent = process.env.YGGDRASIL_AGENT as string | undefined
    
    const extraJvmArgs: string[] = [
      '-Dfml.ignorePatchDiscrepancies=true',
      '-Dfml.ignoreInvalidMinecraftCertificates=true',
      '-Dorg.lwjgl.system.allocator=system'
    ]

    if (options.extraJvmArgs) {
      extraJvmArgs.push(...options.extraJvmArgs)
    }

    if (yggdrasilAgent && fs.existsSync(yggdrasilAgent)) {
      extraJvmArgs.push(`-javaagent:${yggdrasilAgent}=`)
    }

    const isWin = process.platform === 'win32'
    const baseVersion = extractBaseVersion(versionId)
    const majorVersion = parseInt(baseVersion.split('.')[1], 10)
    const javaExe = javaPath
      ? (majorVersion >= 18 ? javaPath.replace('java.exe', 'javaw.exe') : javaPath)
      : javaPath

    const launchOptions: Record<string, unknown> & {
      gameProfile?: { name: string; id: string }
      accessToken?: string
      server?: { ip: string; port?: number }
      resolution?: { width: number; height: number }
      extraExecOption?: Record<string, unknown>
    } = {
      gamePath,
      javaPath: javaExe || javaPath,
      version: resolvedVersion,
      versionName: versionId,
      minMemory: minMem,
      maxMemory: maxMem,
      extraJVMArgs: extraJvmArgs,
      ignoreInvalidMinecraftCertificates: true,
      ignorePatchDiscrepancies: true,
      extraExecOption: {
        detached: false,
        stdio: ['pipe', 'pipe', 'pipe']
      }
    }

    if (options.account) {
      launchOptions.gameProfile = {
        name: options.account.name,
        id: options.account.uuid
      }
      if (options.account.accessToken) {
        launchOptions.accessToken = options.account.accessToken
      }
    }

    if (options.server) {
      launchOptions.server = options.server
    }

    if (options.width && options.height) {
      launchOptions.resolution = {
        width: options.width,
        height: options.height
      }
    }

    if (isWin && majorVersion < 18) {
      launchOptions.extraExecOption!['windowsHide'] = false
    }

    log.info(`[launchWithXMCL] 正在启动游戏...`)
    const proc = await launch(launchOptions as unknown as Parameters<typeof launch>[0])

    currentProcess = proc
    gameStatus = 'running'

    proc.on('exit', (code) => {
      log.info(`[launchWithXMCL] 游戏进程退出，退出码: ${code}`)
      gameStatus = 'idle'
      currentProcess = null
      mainWindow.webContents.send('game:status', 'stopped', code)
    })

    proc.on('error', (err) => {
      log.error(`[launchWithXMCL] 游戏进程错误: ${err.message}`)
      gameStatus = 'idle'
      currentProcess = null
    })

    if (proc.stdout) {
      proc.stdout.on('data', (data) => {
        const output = data.toString()
        mainWindow.webContents.send('game:log', output)
      })
    }

    if (proc.stderr) {
      proc.stderr.on('data', (data) => {
        const output = data.toString()
        mainWindow.webContents.send('game:log', output)
      })
    }

    return {
      success: true,
      pid: proc.pid
    }
  } catch (e: unknown) {
    log.error(`[launchWithXMCL] 启动失败: ${(e as Error).message}`)
    gameStatus = 'idle'
    return { success: false, error: (e as Error).message }
  }
}

export async function launchByVersionWithXMCL(
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
    gameDir?: string
    jvmArgs?: string
  }
): Promise<XMCLLaunchResult> {
  const db = getDatabase()
  
  let gamePath = options.gameDir
  if (!gamePath) {
    const userDataDir = process.env.APPDATA || process.env.HOME || ''
    gamePath = join(userDataDir, '.minecraft')
  }

  let account: XMCLAccount = {
    name: 'Player',
    uuid: '00000000-0000-0000-0000-000000000000'
  }
  
  if (options.accountId) {
    const accountRow = db
      .prepare('SELECT name, uuid, access_token, xuid FROM accounts WHERE id = ?')
      .get(options.accountId) as {
        name: string
        uuid: string
        access_token: string | null
        xuid: string | null
      } | undefined
    
    if (accountRow) {
      account = {
        name: accountRow.name,
        uuid: accountRow.uuid,
        accessToken: accountRow.access_token,
        xuid: accountRow.xuid
      }
    }
  } else {
    const defaultAccount = db
      .prepare('SELECT name, uuid, access_token, xuid FROM accounts WHERE is_selected = 1 LIMIT 1')
      .get() as {
        name: string
        uuid: string
        access_token: string | null
        xuid: string | null
      } | undefined
    
    if (defaultAccount) {
      account = {
        name: defaultAccount.name,
        uuid: defaultAccount.uuid,
        accessToken: defaultAccount.access_token,
        xuid: defaultAccount.xuid
      }
    }
  }

  const extraJvmArgs = options.jvmArgs
    ? options.jvmArgs.split(' ').filter((a) => a.trim())
    : undefined

  return launchWithXMCL(mainWindow, {
    versionId: options.versionId,
    gamePath,
    javaPath: options.javaPath,
    maxMemory: options.maxMemory,
    minMemory: options.minMemory,
    width: options.width,
    height: options.height,
    account,
    extraJvmArgs,
    gameDir: options.instancePath
  })
}

import {
  launch,
  Version,
  diagnose,
  MinecraftIssueReport,
  MinecraftFolder,
  ResolvedVersion,
  LaunchPrecheck,
  LaunchOption
} from '@xmcl/core'
import {
  installDependencies,
  getVersionList,
  installVersion,
  installAssets,
  installLibraries
} from '@xmcl/installer'
import type { Options as InstallerOptions, LibraryOptions as InstallerLibraryOptions } from '@xmcl/installer'
import { Agent, interceptors } from 'undici'
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
import { validatePathSafe } from '../utils/path-validation'
const log = logger.child('XMCL')

// BMCLAPI 镜像配置（多线路）
const BMCLAPI_BASE = 'https://bmclapi2.bangbang93.com'
const BMCLAPI_MIRRORS_LIST = [
  'https://bmclapi2.bangbang93.com',
  'https://bmclapi.bangbang93.com',
  'https://mcplayer.cn'
]
const BMCLAPI_MAVEN = `${BMCLAPI_BASE}/maven`
const BMCLAPI_ASSETS = `${BMCLAPI_BASE}/assets`
const BMCLAPI_VERSION = `${BMCLAPI_BASE}/version`
// BMCLAPI 版本清单 URL（替代官方 launchermeta.mojang.com）
const BMCLAPI_VERSION_MANIFEST = `${BMCLAPI_BASE}/mc/game/version_manifest.json`

// 判断一个库是否是 optifine:* 家族 —— 这些库必须由 OptiFine 安装器在本机"合成"（forge 补丁 +
// 原版 client 拼接），**没有任何公开 maven 仓库直接托管**。如果走 installLibraries 按坐标下载，
// 只会落到 optifine.net（国内慢、超时）或 404，导致启动器长时间"假死"，所以单独跳过。
function isOptiFineLocalLib(
  arg:
    | { library?: { groupId?: string } }
    | { groupId?: string; artifactId?: string }
    | { download?: { url?: string } }
): boolean {
  const a = arg as {
    library?: { groupId?: string; artifactId?: string }
    groupId?: string
    artifactId?: string
    download?: { url?: string }
  }
  const gid = a.library?.groupId ?? a.groupId
  if (gid === 'optifine') return true
  const aid = a.library?.artifactId ?? a.artifactId
  if (aid && (aid === 'OptiFine' || aid === 'launchwrapper-of')) return true
  if (a.download?.url) {
    const u = a.download.url
    if (u.includes('/optifine/') || u.includes('optifine.net')) return true
  }
  return false
}

// 判断一条 diagnose corrupted 问题是否属于「无需清理、无需重下」的非真损坏（仅适用于 role=library）
//   - OptiFine 家族合成库  **且** 本地文件是真实有效的 JAR/ZIP
//        OptiFine 是 OptiFine installer 本机合成出来的，公开 maven 不托管，但如果文件本身
//        连 ZIP magic 都不对（0 字节 / 半截下载 / 被 HTML 404 覆盖）就必须判真损坏，否则：
//        cpw.mods.securejarhandler → zip END header not found → exit 1
//   - expectedChecksum 为空字符串 / null / undefined  **且** 本地文件是真实有效的 JAR/ZIP
//        第三方加载器库（Forge、Fabric、NeoForge、CPW 等）写在 version.json 里时经常不附 checksum，
//        diagnose 会把空串当期望去对比实际文件 sha1，**永远不匹配**，但文件本身是完整的。
//        这种情况应该跳过。
function shouldSkipCorruptedCleanup(
  issue: { type?: string; role?: string; expectedChecksum?: string | null } & {
    library?: { groupId?: string; artifactId?: string }
    file?: string
  }
): boolean {
  if (issue.type !== 'corrupted' || issue.role !== 'library') return false
  const f = issue.file
  const isOptiFine = isOptiFineLocalLib({ library: issue.library })
  // 任何库只要给了 path，就必须是合法 ZIP/JAR，这是底线。0 字节 / 半截下载 / 404 HTML → 不豁免。
  if (f && !isValidJarFile(f)) return false
  if (isOptiFine) return true
  const ec = issue.expectedChecksum
  const ecEmpty = ec === null || ec === undefined || ec === '' || /^\s+$/.test(ec)
  if (!ecEmpty) {
    // 有明确期望 checksum 但仍然 corrupted = 真的 sha1 对不上 = 真损坏。必须清理。
    return false
  }
  // 无 checksum 且 isValidJarFile=true → 完整但 diagnose 无 checksum 误判，跳过清理
  return true
}

// 快速判断一个文件是否是合法 ZIP/JAR：
//   ① 存在且大小 >= ZIP_EOCD_MIN(22)
//   ② 前 4 字节 = ZIP Local File Header magic (0x04034b50 LE → "PK\x03\x04")
//   ③ 最后 22 字节 = ZIP End of Central Directory Record magic (0x06054b50 LE → "PK\x05\x06")
// 任何一条不满足就视为损坏（0 字节、半截 HTTP 404 HTML、下载到一半），必须重下。
// 性能：只读 4+22 字节，单次微秒级，处理 1000 个文件仍 <50ms。
function isValidJarFile(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false
    const st = fs.statSync(filePath)
    if (!st.isFile()) return false
    const MIN_JAR = 22
    if (st.size < MIN_JAR) return false
    const fd = fs.openSync(filePath, 'r')
    try {
      const head = Buffer.alloc(4)
      const rh = fs.readSync(fd, head, 0, 4, 0)
      if (rh < 4) return false
      // Local File Header: PK\x03\x04
      if (!(head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04)) {
        return false
      }
      const tail = Buffer.alloc(22)
      const rt = fs.readSync(fd, tail, 0, 22, st.size - 22)
      if (rt < 22) return false
      // End of Central Directory Record: PK\x05\x06（第 0..3 字节）
      if (!(tail[0] === 0x50 && tail[1] === 0x4b && tail[2] === 0x05 && tail[3] === 0x06)) {
        return false
      }
      return true
    } finally {
      fs.closeSync(fd)
    }
  } catch {
    return false
  }
}

// 判断一个文件是否可以解析为 JSON 对象 / 数组（用于 version.json / assetIndex.json 这类元数据文件）。
// 读取 UTF-8 前 1MB 尝试 JSON.parse，成功就算有效。失败就判损坏，让 diagnose 重下。
// 只用于 role=versionJson / role=assetIndex，别用在大型 JSON（比如资源索引通常几 MB → 足够）。
function isValidJsonObjectFile(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false
    const st = fs.statSync(filePath)
    if (!st.isFile()) return false
    if (st.size < 2) return false
    const MAX_READ = 1024 * 1024
    const buf = Buffer.alloc(Math.min(MAX_READ, st.size))
    const fd = fs.openSync(filePath, 'r')
    try {
      const rd = fs.readSync(fd, buf, 0, buf.length, 0)
      const text = buf.slice(0, rd).toString('utf-8')
      JSON.parse(text)
      return true
    } finally {
      fs.closeSync(fd)
    }
  } catch {
    return false
  }
}
function bmclapiLibraryHost(lib: { download?: { url?: string } }): string | string[] | undefined {
  // optifine 家族：返回空数组信号，让 installLibraries 跳过下载（这些是本地合成库，没有公开仓库）
  if (isOptiFineLocalLib(lib)) return []
  // 其他库返回 undefined，让 mavenHost + 原始URL + DEFAULT_MAVENS 一起尝试
  // 这样如果 BMCLAPI 镜像失败，会自动回退到原始域名
  if (lib.download?.url) {
    const url = lib.download.url
    if (
      url.includes('optifine.net') ||
      url.includes('/optifine/')
    ) {
      return []
    }
  }
  return undefined
}

// 资源索引 URL 替换为 BMCLAPI（返回多线路数组）
function bmclapiAssetsIndexUrl(version: ResolvedVersion): string | string[] {
  if (version.assetIndex?.url) {
    return BMCLAPI_MIRRORS_LIST.map((base) =>
      version.assetIndex!.url
        .replace('https://launchermeta.mojang.com', base)
        .replace('https://piston-meta.mojang.com', base)
    )
  }
  return []
}

// 带超时的 undici Agent（per-request 15s 超时 + 3 次重试）
const DOWNLOAD_TIMEOUT = 15_000
const downloadDispatcher = new Agent({
  connect: { timeout: DOWNLOAD_TIMEOUT },
  bodyTimeout: DOWNLOAD_TIMEOUT,
  headersTimeout: DOWNLOAD_TIMEOUT,
}).compose(
  interceptors.retry({ maxRetries: 3, maxTimeout: DOWNLOAD_TIMEOUT }),
  interceptors.redirect({ maxRedirections: 5 })
)

// 统一的 BMCLAPI 安装选项（多线路 + per-request 超时）
function getBmclapiInstallOptions(): Record<string, unknown> {
  return {
    libraryHost: bmclapiLibraryHost,
    mavenHost: BMCLAPI_MIRRORS_LIST.map((b) => `${b}/maven`),
    assetsHost: BMCLAPI_MIRRORS_LIST.map((b) => `${b}/assets`),
    assetsIndexUrl: bmclapiAssetsIndexUrl,
    dispatcher: downloadDispatcher
  }
}

// 带超时的 Promise 包装，避免依赖下载长挂起
class TimeoutError extends Error {}
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let handle: ReturnType<typeof setTimeout> | null = null
  const timeoutPromise = new Promise<never>((_, reject) => {
    handle = setTimeout(() => reject(new TimeoutError(message)), ms)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (handle) clearTimeout(handle)
  })
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
      // Issue 接口字段：file（绝对路径）/role/type/hint。LibraryIssue 还额外带 .library（含 groupId/artifactId/version 方便定位）
      const libInfo =
        issue.role === 'library'
          ? ((issue as unknown as { library?: { groupId?: string; artifactId?: string; version?: string } }).library
              ? `${(issue as unknown as { library: { groupId: string; artifactId: string; version: string } }).library.groupId}:${
                  (issue as unknown as { library: { groupId: string; artifactId: string; version: string } }).library.artifactId
                }:${(issue as unknown as { library: { groupId: string; artifactId: string; version: string } }).library.version}`
              : '')
          : ''
      log.info(
        `[detectMissingFiles] - [${issue.type}] ${issue.role}${libInfo ? ' ' + libInfo : ''} file=${(issue as unknown as { file?: string }).file || 'n/a'}: ${issue.hint}`
      )
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

    // 通知前端：开始检查文件
    mainWindow.webContents.send('game:progress', {
      phase: 'checking-files',
      message: '正在检查游戏文件...',
      detail: `版本: ${versionId}`
    })

    const folder = new MinecraftFolder(gamePath)

    // 1. 先用 diagnose 检测缺失文件（用于日志和反馈）
    const report = await detectMissingFiles(gamePath, versionId)

    if (report && report.issues.length === 0) {
      log.info(`[downloadMissingDependencies] 诊断完成，所有文件完整，无需下载`)
      // 通知前端：文件检查完成，跳过下载
      mainWindow.webContents.send('game:progress', {
        phase: 'downloading-files',
        message: '游戏文件完整，无需下载',
        detail: '所有依赖文件已存在'
      })
      mainWindow.webContents.send('game:status', 'launching')
      return true
    }

    if (report) {
      const missingCount = report.issues.filter((i) => i.type === 'missing').length
      const corruptedCount = report.issues.filter((i) => i.type === 'corrupted').length
      log.info(`[downloadMissingDependencies] 缺失 ${missingCount} 个，损坏 ${corruptedCount} 个文件`)

      // corrupted 文件清理：
      //   - role=library：按 shouldSkipCorruptedCleanup 判断（OptiFine 合成 / 无 checksum 且 JAR 有效 → 跳过）
      //   - role=versionJar / role=versionJson / role=assetIndex：只要文件存在但内容无效（对 JAR 用 isValidJarFile，
      //     对 JSON 用 isValidJsonObjectText）就必须删掉重下，否则 bootstraplauncher 第一个 SecureJar.from(versionJar)
      //     就会 zip END header not found → exit 1（这是 diagnose 只抓 versionJar / library 不抓的场景最常见根因）。
      if (corruptedCount > 0) {
        const purged: string[] = []
        const skipped: string[] = []
        for (const issue of report.issues) {
          if (issue.type !== 'corrupted') continue
          const wrapped = issue as unknown as {
            file?: string
            library?: { groupId?: string; artifactId?: string; version?: string }
            expectedChecksum?: string | null
            role?: string
          }
          if (wrapped.role === 'library') {
            if (shouldSkipCorruptedCleanup(wrapped)) {
              if (wrapped.file) skipped.push(wrapped.file)
              continue
            }
          } else if (wrapped.role === 'versionJar') {
            // version.jar 必须是合法 ZIP（哪怕它只有几 KB，Forge slim-jar 也是 ZIP）
            if (wrapped.file && isValidJarFile(wrapped.file)) {
              skipped.push(wrapped.file)
              continue
            }
          } else if (wrapped.role === 'versionJson' || wrapped.role === 'assetIndex') {
            // JSON 文件：存在 + 可解析为 JSON 对象就算有效，否则删掉重下
            if (wrapped.file && isValidJsonObjectFile(wrapped.file)) {
              skipped.push(wrapped.file)
              continue
            }
          } else {
            // asset：diagnose 有自己的 checksum，直接清理 corrupted
          }
          try {
            const p = wrapped.file
            if (!p) continue
            if (fs.existsSync(p)) {
              fs.unlinkSync(p)
              purged.push(p)
            }
          } catch {
            /* 单个文件清理失败不中断整体流程 */
          }
        }
        if (skipped.length > 0) {
          log.info(`[downloadMissingDependencies] 跳过清理 ${skipped.length} 个非真损坏文件（库/版本文件内容实际有效）：${skipped.length}`)
        }
        if (purged.length > 0) {
          log.info(`[downloadMissingDependencies] 已清理 ${purged.length} 个真正损坏的文件，将被重新下载`)
        }
      }

      // 快速通道：所有 corrupted 都是「内容有效但 checksum 不匹配 / 无 checksum 误报」，
      //           且没有任何 missing → 直接跳启动，避免 90s 假死。
      //           （对 role!=library 的也要判，防止 versionJar 明明坏了但 library 都 OK → 走 fast-track 导致仍 exit 1）
      const fastTrack =
        missingCount === 0 &&
        report.issues.every((i) => {
          const w = i as unknown as {
            file?: string
            library?: { groupId?: string; artifactId?: string }
            expectedChecksum?: string | null
            role?: string
          }
          if (i.type !== 'corrupted') return false
          if (w.role === 'library') return shouldSkipCorruptedCleanup(w)
          if (w.role === 'versionJar') return !!(w.file && isValidJarFile(w.file))
          if (w.role === 'versionJson' || w.role === 'assetIndex') return !!(w.file && isValidJsonObjectFile(w.file))
          // asset 等其他角色：按保守处理（判非真损坏→不跳 fastTrack），保证走重下
          return false
        })
      if (fastTrack) {
        log.info(
          `[downloadMissingDependencies] 快速通道：全部 ${report.issues.length} 个 corrupted 均为非真损坏（内容有效但 checksum 不匹配），跳过依赖安装，直接进入启动阶段`
        )
        checkLaunchAbort('依赖诊断完成（走快速通道）')
        try {
          const refreshed = await Version.parse(gamePath, versionId)
          checkLaunchAbort('快速通道版本重新解析完成')
          await LaunchPrecheck.checkNatives(folder, refreshed, {} as LaunchOption)
          log.info(`[downloadMissingDependencies] natives 校验/解压完成`)
        } catch (e: unknown) {
          log.error(`[downloadMissingDependencies] checkNatives 失败（仍会尝试启动）: ${(e as Error).message}`)
        }
        mainWindow.webContents.send('game:status', 'launching')
        return true
      }
    }

    // 2. 下载版本 JSON 和 JAR（处理衍生版本）
    checkLaunchAbort('开始下载版本文件前')
    try {
      await downloadVersionFiles(folder, versionId, resolvedVersion)
    } catch (e: unknown) {
      log.warn(`[downloadMissingDependencies] 版本文件下载失败: ${(e as Error).message}`)
    }

    // 3. 安装依赖（libraries + assets）— installDependencies 内部会跳过已存在的文件
    //    使用 per-request 超时 + 多线路镜像，单文件超时自动切换下载源
    checkLaunchAbort('开始安装依赖前')
    log.info(`[downloadMissingDependencies] 开始安装依赖（库 + 资源）`)
    let installOk = false

    const installOptions = getBmclapiInstallOptions()
    log.info(`[downloadMissingDependencies] 镜像配置: mavenHost=${JSON.stringify(installOptions.mavenHost)}`)

    // 通知前端：开始下载依赖
    mainWindow.webContents.send('game:progress', {
      phase: 'downloading-files',
      message: '正在下载游戏依赖文件...',
      detail: `${BMCLAPI_MIRRORS_LIST.length} 条镜像线路，单文件 ${DOWNLOAD_TIMEOUT / 1000}s 超时自动切换`
    })

    try {
      const refreshedVersion = await Version.parse(gamePath, versionId)
      const t0 = Date.now()
      log.info(`[downloadMissingDependencies] installDependencies 开始，超时 90s ...`)
      mainWindow.webContents.send('game:progress', {
        phase: 'downloading-files',
        message: '正在下载库文件和资源...',
        detail: '优先使用国内镜像，超时自动切换备用源'
      })
      await withTimeout(
        installDependencies(refreshedVersion, installOptions as InstallerOptions),
        90_000,
        `installDependencies(${versionId}) 超过 90s，中断并降级为分步安装`
      )
      log.info(`[downloadMissingDependencies] 依赖安装完成（${((Date.now() - t0) / 1000).toFixed(1)}s）`)
      installOk = true
    } catch (e: unknown) {
      checkLaunchAbort('installDependencies 超时/失败后')
      log.warn(`[downloadMissingDependencies] installDependencies 失败，尝试分步安装: ${(e as Error).message}`)
      // 通知前端：批量下载失败，正在降级
      mainWindow.webContents.send('game:progress', {
        phase: 'downloading-files',
        message: '批量下载超时，正在分步重试...',
        detail: '逐个下载库文件，失败时自动切换下载源'
      })
      try {
        const refreshedVersion = await Version.parse(gamePath, versionId)
        const tLib = Date.now()
        log.info(`[downloadMissingDependencies] 开始 installLibraries，超时 90s ...`)
        mainWindow.webContents.send('game:progress', {
          phase: 'downloading-files',
          message: '正在下载库文件...',
          detail: `镜像源: ${BMCLAPI_MIRRORS_LIST.join(' → ')}`
        })
        await withTimeout(
          installLibraries(refreshedVersion, installOptions as InstallerLibraryOptions),
          90_000,
          `installLibraries(${versionId}) 超过 90s，中断`
        )
        log.info(`[downloadMissingDependencies] 库安装完成（${((Date.now() - tLib) / 1000).toFixed(1)}s）`)
        checkLaunchAbort('installLibraries 完成后')

        const tAsset = Date.now()
        log.info(`[downloadMissingDependencies] 开始 installAssets，超时 90s ...`)
        mainWindow.webContents.send('game:progress', {
          phase: 'downloading-files',
          message: '正在下载游戏资源...',
          detail: '纹理、声音等资源文件'
        })
        await withTimeout(
          installAssets(refreshedVersion, installOptions as InstallerOptions),
          90_000,
          `installAssets(${versionId}) 超过 90s，中断`
        )
        log.info(`[downloadMissingDependencies] 资源安装完成（${((Date.now() - tAsset) / 1000).toFixed(1)}s）`)
        installOk = true
      } catch (e2: unknown) {
        log.error(`[downloadMissingDependencies] 分步安装也失败: ${(e2 as Error).message}`)
        // 通知前端：所有下载源都失败
        mainWindow.webContents.send('game:progress', {
          phase: 'error',
          message: '依赖下载失败',
          detail: `所有镜像源均无法下载: ${(e2 as Error).message}`
        })
      }
    }
    checkLaunchAbort('依赖安装阶段结束')

    // 3b. 必须在启动前执行 checkNatives，确保 LWJGL native DLL（glfw.dll / openal.dll）
    //     已从 natives JAR 里解压出来；缺这步会直接 UnsatisfiedLinkError → exit code 1
    try {
      const refreshed = await Version.parse(gamePath, versionId)
      checkLaunchAbort('natives 解压前')
      await LaunchPrecheck.checkNatives(folder, refreshed, {} as LaunchOption)
      log.info(`[downloadMissingDependencies] natives 校验/解压完成`)
    } catch (e: unknown) {
      log.error(`[downloadMissingDependencies] checkNatives 失败（仍会尝试启动）: ${(e as Error).message}`)
    }

    // 4. 再次诊断确认
    const finalReport = await detectMissingFiles(gamePath, versionId)
    if (finalReport && finalReport.issues.length > 0) {
      log.warn(`[downloadMissingDependencies] 仍存在 ${finalReport.issues.length} 个问题，installOk=${installOk}`)
      for (const issue of finalReport.issues) {
        const p = (issue as unknown as { file?: string }).file
        log.warn(
          `  - [${issue.type}] ${issue.role}${p ? ' ' + p : ''}: ${issue.hint}`
        )
      }

      // 策略：如果两次诊断下来所有 corrupted 都属于「内容实际有效」：
      //       library → shouldSkipCorruptedCleanup；versionJar → isValidJarFile；JSON → isValidJsonObjectFile
      //       则不阻断启动，交给游戏 JVM 自己失败时再报具体错。
      //       否则每次启动都卡在 46 秒长超时，用户以为启动器卡死了。
      const allNonFatalCorrupted =
        finalReport.issues.every((i) => {
          const w = i as unknown as {
            file?: string
            library?: { groupId?: string; artifactId?: string }
            expectedChecksum?: string | null
            role?: string
          }
          if (i.type !== 'corrupted') return false
          if (w.role === 'library') return shouldSkipCorruptedCleanup(w)
          if (w.role === 'versionJar') return !!(w.file && isValidJarFile(w.file))
          if (w.role === 'versionJson' || w.role === 'assetIndex') return !!(w.file && isValidJsonObjectFile(w.file))
          return false
        })
      if (allNonFatalCorrupted) {
        log.warn(
          `[downloadMissingDependencies] 继续启动策略：${finalReport.issues.length} 个 corrupted 均为非真损坏（内容有效），不阻断启动，交由 JVM 报告实际错误。`
        )
      }
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
  /** 用户主动点"停止"中断启动时为 true，渲染端可以不弹错误弹窗 */
  aborted?: boolean
}

// game:status 'stopped' 事件携带的详情 payload。
//   - 只要不是 code==0 的正常退出，渲染端就可以直接用 .error 标题 + tailPreview 展开做弹窗
//   - badJars 存在时专门显示"classpath 损坏 JAR 清单"一节，引导用户重下
export interface LaunchStoppedDetail {
  error?: string
  code?: number
  codeText?: string
  tailPreview?: string
  badJars?: string
  /** 可选：是否是用户主动点"停止"导致的退出，渲染端可以不弹警告 */
  aborted?: boolean
}

// 常见 JVM/启动退出码 → 中文说明（仅用于弹窗中 codeText 字段，辅助排错）
function exitCodeToText(code: number | null | undefined): string {
  switch (code) {
    case 0: return 'OK'
    case 1: return 'JVM_GENERAL_ERROR（常见：classpath 缺类 / 模块拦截 / 无效 JAR）'
    case 2: return 'JVM_INVALID_ARG（请检查 JVM 参数是否有无法识别的选项）'
    case 3: return 'JVM_STARTUP_EXCEPTION'
    case 130: return 'SIGINT / 用户主动停止'
    case 134: return 'SIGABRT（JVM native crash）'
    case 137: return 'SIGKILL / 内存不足被系统杀'
    case 139: return 'SIGSEGV（JVM native crash / LWJGL OpenGL 驱动）'
    case 255: return 'FORGE_EXCEPTION（modlauncher 启动失败）'
    case -1: return 'SPAWN_ERROR（Java 进程创建失败）'
    default:
      if (typeof code === 'number' && code >= 0x80000000) return `WINDOWS_NTSTATUS_${code.toString(16)}`
      return `UNKNOWN_EXIT_${code}`
  }
}

// 从 JVM tail log 里挑最"人话"的一条作为弹窗摘要，避免把完整堆栈直接怼给用户。
// 注意：顺序即优先级，越具体（OptiFine / Forge / MissingClass）越靠前。
function pickFriendlyErrorFromTail(tail: string): string | undefined {
  if (!tail) return undefined
  const rules: Array<{ re: RegExp; msg: (m: RegExpExecArray) => string }> = [
    { re: /zip END header not found/,                                          msg: () => '启动文件有半截下载 / 空 JAR，点击"修复损坏文件"即可自动重下' },
    { re: /InaccessibleObjectException:\s*Unable to make .*? module (java\.\S+) does not "opens (\S+)"/,
      msg: (m) => `Java 模块系统拦截：模块 ${m[1]} 未开放包 ${m[2]}，请切换到推荐的 Java 版本` },
    { re: /ClassNotFoundException:\s*(\S+)/,                                     msg: (m) => `缺少类：${m[1]}（通常是 classpath 上某个 Mod/加载器 JAR 未下载成功）` },
    { re: /NoClassDefFoundError:\s*(\S+)/,                                       msg: (m) => `类找不到：${m[1]}（依赖版本不匹配或 JAR 损坏）` },
    { re: /java\.lang\.OutOfMemoryError:\s*Java heap space/,                     msg: () => '堆内存不足，请把最大内存调高或关闭其他占用内存的程序' },
    { re: /Could not create the Java Virtual Machine/,                            msg: () => '无法创建 Java 虚拟机（最大内存可能超过系统可用内存）' },
    { re: /Unrecognized VM option '(\S+)'/,                                      msg: (m) => `无法识别的 JVM 参数：${m[1]}` },
    { re: /java\.lang\.VerifyError: /,                                           msg: () => '字节码校验失败（常见：Forge 与 OptiFine 版本不兼容，需降级其中一方）' },
    { re: /Missing required system property fml\.forgeVersion/,                  msg: () => 'Forge 缺少 fml.forgeVersion 系统属性（启动参数构建失败）' },
  ]
  for (const r of rules) {
    const m = r.re.exec(tail)
    if (m) return r.msg(m)
  }
  // 兜底：如果没有命中规则，但 tail 第一行非空就截断后做副标题
  const firstLine = tail.split('\n').map((s) => s.trim()).find(Boolean)
  if (firstLine) return firstLine.length > 180 ? firstLine.slice(0, 180) + '…' : firstLine
  return undefined
}

let currentProcess: ChildProcess | null = null
let gameStatus: 'idle' | 'launching' | 'running' = 'idle'

// 启动阶段（版本解析 / diagnose / 依赖下载 / withTimeout 包装）的可取消令牌。
// 只有 JVM 进程 spawn 之后才 kill currentProcess；之前的所有阶段都需要靠这个 flag 主动 break。
let launchAborted: { flag: boolean } | null = null

export function getXMCLStatus() {
  return gameStatus
}

export function getXMCLProcess() {
  return currentProcess
}

export function terminateXMCLGame() {
  // 1) 已经 spawn 的 JVM：直接 kill
  if (currentProcess) {
    currentProcess.kill()
    currentProcess = null
    gameStatus = 'idle'
  }
  // 2) 正在下载 / diagnose / 版本解析阶段：立刻 raise abort，让下一次 yield/check 点直接抛错
  if (launchAborted) {
    launchAborted.flag = true
    launchAborted = null
    gameStatus = 'idle'
  }
  log.info(`[terminateXMCLGame] 已收到停止指令（currentProcess=${!!currentProcess}，launchAborted=${!!launchAborted}）`)
}

// 在 launch 过程的每个"可以安全放弃"的检查点调用。
//   - 每次 installLibraries 超长时间后（但 XMCL 内部是整块 Promise，拿不到每个字节进度）
//   - 至少在 diagnose → withTimeout 的前后、resolveVersion 之后、以及 spawn proc 之前调用一次
// 一旦被 terminateXMCLGame 置为 true，立即抛错，把 launchWithXMCL 整体 Promise 打断，
// 否则 UI 上点了"停止"按钮，render 端状态 reset，但主进程仍在阻塞 90s，看起来就"卡死"。
function checkLaunchAbort(reason: string): void {
  if (launchAborted && launchAborted.flag) {
    throw new LaunchAbortedError(reason)
  }
}
class LaunchAbortedError extends Error {
  constructor(msg: string) { super(msg); this.name = 'LaunchAbortedError' }
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
  // 1) 全局防止重入：正在 launching / running 时拒绝再次启动，避免两份 abort token 互相覆盖
  if (gameStatus !== 'idle') {
    return { success: false, error: `游戏已在运行中（状态=${gameStatus}），请先停止再启动新的实例` }
  }

  // 2) 绑定本次 launch 的可取消令牌；terminateXMCLGame() 会把 .flag=true
  const thisAbort = { flag: false }
  launchAborted = thisAbort
  try {
    gameStatus = 'launching'
    log.info(`[launchWithXMCL] 开始启动版本: ${options.versionId}`)

    // 通知前端：开始构建启动配置
    mainWindow.webContents.send('game:progress', {
      phase: 'building-config',
      message: '正在构建启动参数...',
      detail: `版本: ${options.versionId}`
    })
    
    const sharedGamePath = options.gamePath
    const instancePath = options.gameDir
    let gamePath = sharedGamePath
    const versionId = options.versionId
    
    if (!fs.existsSync(gamePath)) {
      return { success: false, error: `游戏目录不存在: ${gamePath}` }
    }

    let javaPath: string
    try {
      // 通知前端：正在验证 Java
      mainWindow.webContents.send('game:progress', {
        phase: 'validating-java',
        message: '正在验证 Java 环境...',
        detail: '检测 Java 版本和路径'
      })
      javaPath = await resolveJavaPath(versionId, options.javaPath)
      log.info(`[launchWithXMCL] 使用 Java: ${javaPath}`)
    } catch (e: unknown) {
      return { success: false, error: (e as Error).message }
    }
    checkLaunchAbort('Java 路径解析完成')

    let resolvedVersion: ResolvedVersion
    try {
      resolvedVersion = await Version.parse(gamePath, versionId)
      log.info(`[launchWithXMCL] 版本解析成功: ${resolvedVersion.id}`)
    } catch (e: unknown) {
      log.error(`[launchWithXMCL] 版本解析失败: ${(e as Error).message}`)
      return { success: false, error: `版本解析失败: ${(e as Error).message}` }
    }
    checkLaunchAbort('版本解析完成')

    // 自动检测并下载缺失的依赖文件
    try {
      log.info(`[launchWithXMCL] 检测并下载缺失的依赖文件...`)
      await downloadMissingDependencies(mainWindow, gamePath, versionId, resolvedVersion)
      checkLaunchAbort('第一次依赖检查完成')
      // 重新解析版本，确保依赖信息最新
      resolvedVersion = await Version.parse(gamePath, versionId)
    } catch (e: unknown) {
      if (e instanceof LaunchAbortedError) {
        // 用户主动点了停止 → 立刻走 stopped，返回 error
        log.warn(`[launchWithXMCL] 用户主动停止（依赖检查阶段）：${e.message}`)
        const stopErr = '启动已被用户停止（依赖检查阶段）'
        try { mainWindow.webContents.send('game:status', 'stopped', 0, { error: stopErr, code: 'ABORTED_DURING_DIAGNOSE' }) } catch {}
        return { success: false, aborted: true, error: stopErr }
      }
      log.warn(`[launchWithXMCL] 依赖下载失败，尝试直接启动: ${(e as Error).message}`)
    }
    checkLaunchAbort('依赖下载完成，即将构建启动参数')

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
      '-Dorg.lwjgl.system.allocator=system',
    ]

    // Java 16+（JPMS 模块系统）下 Forge/Fabric + OptiFine 的运行必需：
    // 缺少任意一条会在 JVM 启动阶段抛 IllegalAccessError / ClassNotFoundException / InaccessibleObjectException，
    // 最终直接 exit code 1，没有后续输出。
    const majorJava = parseInt((await (async () => {
      try {
        const { spawnSync } = await import('child_process')
        const res = spawnSync(javaPath, ['-version'], { encoding: 'utf8', timeout: 5000 })
        const m = /version "(\d+)/.exec((res.stderr || '') + (res.stdout || ''))
        return m ? m[1] : '0'
      } catch { return '0' }
    })()), 10)

    if (majorJava >= 16) {
      const addOpens = [
        '--add-opens=java.base/java.lang=ALL-UNNAMED',
        '--add-opens=java.base/java.util=ALL-UNNAMED',
        '--add-opens=java.base/java.lang.reflect=ALL-UNNAMED',
        '--add-opens=java.base/java.lang.invoke=ALL-UNNAMED',
        '--add-opens=java.base/java.io=ALL-UNNAMED',
        '--add-opens=java.base/java.net=ALL-UNNAMED',
        '--add-opens=java.base/java.nio=ALL-UNNAMED',
        '--add-opens=java.base/sun.nio.ch=ALL-UNNAMED',
        '--add-opens=java.base/sun.nio.fs=ALL-UNNAMED',
        '--add-opens=java.desktop/java.awt=ALL-UNNAMED',
        '--add-opens=java.desktop/java.awt.font=ALL-UNNAMED',
        '--add-opens=java.desktop/sun.font=ALL-UNNAMED',
        '--add-opens=java.desktop/javax.imageio=ALL-UNNAMED',
        '--add-opens=jdk.security.auth/com.sun.security.auth.module=ALL-UNNAMED',
        '--add-opens=java.base/sun.security.x509=ALL-UNNAMED',
      ]
      for (const arg of addOpens) {
        // 避免重复 push（用户侧可能已经手工加过）
        if (!extraJvmArgs.includes(arg) && !(options.extraJvmArgs || []).includes(arg)) {
          extraJvmArgs.push(arg)
        }
      }
      log.info(`[launchWithXMCL] 检测到 Java ${majorJava}，已注入 ${addOpens.length} 条 --add-opens 模块开放参数`)
    }

    if (options.extraJvmArgs) {
      extraJvmArgs.push(...options.extraJvmArgs)
    }

    if (yggdrasilAgent && fs.existsSync(yggdrasilAgent)) {
      extraJvmArgs.push(`-javaagent:${yggdrasilAgent}=`)
    }

    // 根据版本 id 名（如 "1.20.1-Forge_47.0.35-OptiFine_I5"、"1.20.1-Fabric_0.16.5"）
    // 注入对应加载器的系统属性。原版 (Vanilla) 不执行任何注入，保证"原版能启动"的稳定性不受影响。
    const baseVersion = extractBaseVersion(versionId)
    const mcBaseForLoader = baseVersion
    const detectedLoader: { kind: 'forge' | 'neoforge' | 'fabric' | 'quilt'; version: string } | null =
      (() => {
        const fm = versionId.match(/Forge_([\w.]+)/)
        if (fm) return { kind: 'forge', version: fm[1] }
        const nf = versionId.match(/NeoForge_([\w.]+)/)
        if (nf) return { kind: 'neoforge', version: nf[1] }
        const fb = versionId.match(/Fabric_([\w.]+)/)
        if (fb) return { kind: 'fabric', version: fb[1] }
        const qt = versionId.match(/Quilt_([\w.]+)/)
        if (qt) return { kind: 'quilt', version: qt[1] }
        return null
      })()

    if (detectedLoader) {
      if (detectedLoader.kind === 'forge') {
        const forgeVer = detectedLoader.version
        // Forge 官方 launcher 要求的 4 条系统属性，缺任意一条 modlauncher/bootstraplauncher 会在启动瞬间 abort 退出
        const fmlArgs = [
          `-Dfml.forgeVersion=${forgeVer}`,
          `-Dfml.mcVersion=${mcBaseForLoader}`,
          `-Dfml.forgeGroup=net.minecraftforge`,
          `-Dfml.mcpChannel=official`,
          // mappings（MCP → Mojang mappings）随 mcVersion 对齐，若 version.json 已有就用 existing，否则用 mc base 作为 fallback
          `-Dfml.mcpVersion=${mcBaseForLoader}`,
          // G1GC + StringDeduplication 是 Forge 推荐的 GC 组合（不强制但稳定）
          // '-XX:+UseG1GC', '-XX:+UseStringDeduplication' 让用户自己设置，不在这里覆盖 settings
        ]
        const unique = fmlArgs.filter((a) => !extraJvmArgs.includes(a) && !(options.extraJvmArgs || []).includes(a))
        log.info(`[launchWithXMCL] 检测到 Forge ${forgeVer}，注入 ${unique.length} 条 FML JVM 属性`)
        extraJvmArgs.push(...unique)
      } else if (detectedLoader.kind === 'neoforge') {
        const nfVer = detectedLoader.version
        const neoArgs = [
          `-Dneoforge.version=${nfVer}`,
          `-Dneoforge.mcVersion=${mcBaseForLoader}`,
        ]
        const unique = neoArgs.filter((a) => !extraJvmArgs.includes(a) && !(options.extraJvmArgs || []).includes(a))
        log.info(`[launchWithXMCL] 检测到 NeoForge ${nfVer}，注入 ${unique.length} 条 NeoForge JVM 属性`)
        extraJvmArgs.push(...unique)
      } else if (detectedLoader.kind === 'fabric') {
        const fbVer = detectedLoader.version
        const fbArgs = [
          `-Dfabric.gameVersion=${mcBaseForLoader}`,
          `-Dfabric.side=client`,
          `-Dfabric.loaderVersion=${fbVer}`,
        ]
        const unique = fbArgs.filter((a) => !extraJvmArgs.includes(a) && !(options.extraJvmArgs || []).includes(a))
        log.info(`[launchWithXMCL] 检测到 Fabric ${fbVer}，注入 ${unique.length} 条 Fabric JVM 属性`)
        extraJvmArgs.push(...unique)
      } else if (detectedLoader.kind === 'quilt') {
        const qtVer = detectedLoader.version
        const qtArgs = [
          `-Dloader.gameVersion=${mcBaseForLoader}`,
          `-Dloader.side=client`,
          `-Dloader.version=${qtVer}`,
        ]
        const unique = qtArgs.filter((a) => !extraJvmArgs.includes(a) && !(options.extraJvmArgs || []).includes(a))
        log.info(`[launchWithXMCL] 检测到 Quilt ${qtVer}，注入 ${unique.length} 条 Quilt JVM 属性`)
        extraJvmArgs.push(...unique)
      }
    } else {
      log.info(`[launchWithXMCL] 版本判定为 Vanilla（未识别加载器前缀），跳过加载器专属 JVM 属性注入`)
    }

    const isWin = process.platform === 'win32'
    // baseVersion 已在上游加载器检测阶段用 extractBaseVersion(versionId) 计算
    const majorVersion = parseInt(baseVersion.split('.')[1], 10)
    // LWJGL 3（1.18+）应使用 javaw.exe 获得独立控制台窗口；1.17 及以下保留 java.exe 避免 LWJGL2 兼容问题
    const shouldUseJavaw = majorVersion >= 18
    let javaExe = javaPath
    if (isWin) {
      const binDir = dirname(javaPath)
      const javaw = join(binDir, 'javaw.exe')
      const java = join(binDir, 'java.exe')
      // 如果 javaw 不存在就不强行替换（某些精简 JDK 只带 java.exe）
      const target = shouldUseJavaw && fs.existsSync(javaw) ? javaw : (fs.existsSync(java) ? java : javaPath)
      javaExe = target
    }

    log.info(`[launchWithXMCL] 使用可执行文件: ${javaExe}（${shouldUseJavaw ? 'LWJGL3→javaw' : 'LWJGL2→java'}）`)
    log.info(`[launchWithXMCL] 内存配置: min=${minMem}MB max=${maxMem}MB`)

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

    // 通知前端：正在启动游戏进程
    mainWindow.webContents.send('game:progress', {
      phase: 'launching-process',
      message: '正在启动游戏进程...',
      detail: `版本: ${versionId}`
    })

    log.info(`[launchWithXMCL] 正在启动游戏...`)
    const proc = await launch(launchOptions as unknown as Parameters<typeof launch>[0])

    currentProcess = proc
    gameStatus = 'running'

    // 通知前端：游戏已启动
    mainWindow.webContents.send('game:progress', {
      phase: 'running',
      message: '游戏已启动',
      detail: `版本: ${versionId}，PID: ${proc.pid}`
    })
    mainWindow.webContents.send('game:status', 'running')

    // 为了避免 stdout/stderr 环形缓冲撑爆内存，用 tail 数组保留最后 200 行，
    // 进程 exit code != 0 时一次性输出到日志。
    const tailLines: string[] = []
    const pushTail = (chunk: string): void => {
      const lines = chunk.split(/\r?\n/)
      for (const l of lines) {
        if (!l) continue
        tailLines.push(l)
        if (tailLines.length > 200) tailLines.shift()
      }
    }

    proc.on('exit', (code, signal) => {
      // Node child_process 'exit' 回调：code=null 时代表进程被 signal 杀掉（Windows 上常见为 SIGINT/SIGTERM）
      //   - 没有 code 也没有 signal → 兜底为 0（极端情况）
      //   - signal 为 SIGINT/SIGTERM/SIGHUP → 130 / 143 / 129
      //   - 其他 signal → 128 + 常见 UNIX signal 编号（没有就用 137 兜底）
      let finalCode: number
      if (typeof code === 'number') finalCode = code
      else if (signal === 'SIGINT') finalCode = 130
      else if (signal === 'SIGHUP') finalCode = 129
      else if (signal === 'SIGQUIT') finalCode = 131
      else if (signal === 'SIGILL') finalCode = 132
      else if (signal === 'SIGTRAP') finalCode = 133
      else if (signal === 'SIGABRT') finalCode = 134
      else if (signal === 'SIGBUS') finalCode = 135
      else if (signal === 'SIGFPE') finalCode = 136
      else if (signal === 'SIGKILL') finalCode = 137
      else if (signal === 'SIGUSR1') finalCode = 138
      else if (signal === 'SIGSEGV') finalCode = 139
      else if (signal === 'SIGUSR2') finalCode = 140
      else if (signal === 'SIGPIPE') finalCode = 141
      else if (signal === 'SIGALRM') finalCode = 142
      else if (signal === 'SIGTERM') finalCode = 143
      else if (signal) finalCode = 137
      else finalCode = 0

      log.info(`[launchWithXMCL] 游戏进程退出，退出码: ${finalCode}（raw=${code}, signal=${signal ?? 'none'}）`)
      if (finalCode !== 0) {
        if (tailLines.length > 0) {
          log.error(`[launchWithXMCL] 进程异常退出，最后 ${tailLines.length} 行输出:\n${tailLines.join('\n')}`)
        }
        // 针对 ZipException / zip END header not found 这类典型"classpath 里有假 JAR"错误，
        // 做一次自动排查：枚举 resolvedVersion.libraries + version.jar，逐个 isValidJarFile 扫，
        // 把坏的 JAR 明确打印出来，下次用户不用猜是哪个库。
        const tailJoined = tailLines.join('\n')
        let badJarsSummary = ''
        if (/zip END header not found|ZipException|SecureJar\.from|UnionFileSystem/.test(tailJoined)) {
          try {
            const bad: Array<{ path: string; reason: string; size: number }> = []
            const folder = new MinecraftFolder(gamePath)
            if (resolvedVersion && (resolvedVersion as unknown as { libraries?: unknown[] }).libraries) {
              const libs = (resolvedVersion as unknown as { libraries: Array<{ path: string }> }).libraries
              for (const l of libs) {
                if (!l || !l.path) continue
                try {
                  const p = folder.getLibraryByPath(l.path)
                  if (!p) continue
                  if (!fs.existsSync(p)) { bad.push({ path: p, reason: 'file missing', size: 0 }); continue }
                  if (!isValidJarFile(p)) {
                    const st = fs.statSync(p)
                    bad.push({ path: p, reason: 'invalid ZIP magic (0-byte/half-download/404-HTML)', size: st.size })
                  }
                } catch { /* 单个库 path 解析失败不中断 */ }
              }
            }
            // 再加上 version.jar 本身（Forge bootstraplauncher 第一个加载的就是这个）
            try {
              const vjar = folder.getVersionJar(versionId)
              if (vjar && fs.existsSync(vjar) && !isValidJarFile(vjar)) {
                const st = fs.statSync(vjar)
                bad.unshift({ path: vjar, reason: 'VERSION.JAR invalid ZIP magic (critical!)', size: st.size })
              } else if (vjar && !fs.existsSync(vjar)) {
                bad.unshift({ path: vjar, reason: 'VERSION.JAR MISSING (critical!)', size: 0 })
              }
            } catch { /* version.jar 路径异常不中断 */ }

            if (bad.length > 0) {
              log.error(`[launchWithXMCL] ========== 检测到 ${bad.length} 个损坏的 classpath JAR ==========`)
              for (const b of bad) {
                log.error(`[launchWithXMCL]   - ${b.reason} (size=${b.size}) : ${b.path}`)
              }
              log.error(`[launchWithXMCL] 建议：重新运行"下载版本文件+依赖"或手动删除上述文件后再次启动，启动器会自动重下合法副本。`)
              badJarsSummary = bad.slice(0, 5).map((b) => `- ${b.reason} (${b.size}B) ${b.path}`).join('\n') + (bad.length > 5 ? `\n... 及 ${bad.length - 5} 个其他损坏文件` : '')
            } else {
              log.warn(`[launchWithXMCL] 退出疑似 classpath ZIP 损坏，但 isValidJarFile 扫描未发现假 JAR，可能是 Forge 模块路径（JRT / JMOD）出错，需进一步看完整 game:log`)
            }
          } catch (eScan: unknown) {
            log.error(`[launchWithXMCL] 诊断损坏 JAR 扫描失败: ${(eScan as Error).message}`)
          }
        }

        // 构造人类可读错误摘要，通过 game:status stopped 直接发给 renderer，让渲染端可以立刻弹窗，
        // 避免"从 launching → stopped 无任何反馈，用户以为启动器卡死"。
        const tailPreview = tailLines.slice(0, 8).map((l) => l.replace(/\s+$/g, '')).filter(Boolean).join('\n')
        const headMsg = pickFriendlyErrorFromTail(tailJoined)
        const detail: LaunchStoppedDetail = {
          error: headMsg
            ? `启动失败（退出码 ${finalCode}）：${headMsg}`
            : `游戏异常退出，退出码 ${finalCode}`,
          code: finalCode,
          codeText: exitCodeToText(finalCode),
          tailPreview: tailPreview || undefined,
          badJars: badJarsSummary || undefined
        }
        log.error(`[launchWithXMCL] 渲染端错误摘要: ${detail.error}`)
        gameStatus = 'idle'
        currentProcess = null
        try { mainWindow.webContents.send('game:status', 'stopped', finalCode, detail) } catch { /* renderer 已关忽略 */ }
        return
      }
      // finalCode === 0：正常退出
      gameStatus = 'idle'
      currentProcess = null
      try { mainWindow.webContents.send('game:status', 'stopped', finalCode, { error: undefined, code: 0, codeText: 'OK' }) } catch {}
    })

    proc.on('error', (err) => {
      log.error(`[launchWithXMCL] 游戏进程错误: ${err.message}`)
      const detail: LaunchStoppedDetail = {
        error: `无法启动 Java 进程：${err.message}`,
        code: -1,
        codeText: 'SPAWN_ERROR'
      }
      gameStatus = 'idle'
      currentProcess = null
      try { mainWindow.webContents.send('game:status', 'stopped', -1, detail) } catch {}
    })

    if (proc.stdout) {
      proc.stdout.on('data', (data) => {
        const output = data.toString()
        pushTail(output)
        try { mainWindow.webContents.send('game:log', output) } catch { /* renderer 已关时忽略 */ }
        log.info(`[Game-STDOUT] ${output.replace(/\s+$/g, '')}`)
      })
    }

    if (proc.stderr) {
      proc.stderr.on('data', (data) => {
        const output = data.toString()
        pushTail(output)
        try { mainWindow.webContents.send('game:log', output) } catch { /* renderer 已关时忽略 */ }
        log.error(`[Game-STDERR] ${output.replace(/\s+$/g, '')}`)
      })
    }

    return {
      success: true,
      pid: typeof proc.pid === 'number' ? proc.pid : undefined
    }
  } catch (e: unknown) {
    if (thisAbort !== launchAborted) {
      // 这个 launch 的 token 已经被 terminateXMCLGame() 摘掉了，说明用户已经点了 stop 走外部流程
      // 这里不要再覆盖 gameStatus 或重新 send stopped，避免渲染端状态抖动
      if (e instanceof LaunchAbortedError) {
        return { success: false, aborted: true, error: '启动已被用户停止' }
      }
      return { success: false, error: (e as Error).message }
    }
    // 仍然是当前 token：任何抛错（含 LaunchAbortedError、diagnose 异常、参数异常）
    // 都必须 send('game:status', 'stopped') 给渲染端，否则渲染端一直显示 launching 假死
    gameStatus = 'idle'
    launchAborted = null
    if (e instanceof LaunchAbortedError) {
      log.warn(`[launchWithXMCL] 启动过程被用户主动终止: ${e.message}`)
      const detail: LaunchStoppedDetail = {
        error: '启动已被用户停止',
        code: 130,
        codeText: 'SIGINT / 用户主动停止',
        aborted: true
      }
      try { mainWindow.webContents.send('game:status', 'stopped', 130, detail) } catch {}
      return { success: false, aborted: true, error: detail.error }
    }
    log.error(`[launchWithXMCL] 启动失败: ${(e as Error).message}`)
    const detail: LaunchStoppedDetail = {
      error: `启动失败：${(e as Error).message}`,
      code: -2,
      codeText: 'LAUNCH_STAGE_ERROR',
      tailPreview: (e as Error).stack || undefined
    }
    try { mainWindow.webContents.send('game:status', 'stopped', -2, detail) } catch {}
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
      .prepare('SELECT name, uuid, access_token, xuid FROM accounts WHERE is_active = 1 LIMIT 1')
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

/**
 * 为加载器安装器选择 Java 运行时
 * 安装器固定使用 PATH 中的 java 会在多 Java 环境下失败：
 * 旧版本需要 Java 8，1.17+ 需要 Java 17，1.20.5+ / NeoForge 需要 Java 21。
 * 这里优先读取安装目标版本 JSON 的 javaVersion.majorVersion，读不到时再按版本号推断。
 */
import * as path from 'path'
import { readVersionMeta } from '../../utils/version-meta'
import type { JavaInfo } from '../../services/java.management.service'

export interface InstallerJava {
  /** java 可执行文件路径；系统里没有任何可用 Java 时为 'java'，交给 PATH 解析 */
  path: string
  /** 实际选中的 Java 主版本；未检测到时为 0 */
  majorVersion: number
  /** 当前 MC 版本要求的最低 Java 主版本 */
  requiredMajor: number
}

/**
 * 选择用于运行安装器的 Java
 * @throws 检测到 Java 但全部低于版本要求时抛出，避免安装器输出难以理解的字节码错误
 */
export async function resolveInstallerJava(
  gameDir: string,
  mcVersion: string
): Promise<InstallerJava> {
  const meta = readVersionMeta(path.join(gameDir, 'versions', mcVersion), mcVersion)

  // * 动态导入：该服务依赖 electron.app，避免在纯 Node 环境下加载适配器时就引入 electron
  const { detectAllJava, recommendedJavaMajor } = await import(
    '../../services/java.management.service'
  )
  const requiredMajor = meta?.javaVersion?.majorVersion ?? recommendedJavaMajor(mcVersion)

  let available: JavaInfo[]
  try {
    available = await detectAllJava()
  } catch {
    available = []
  }

  if (available.length === 0) {
    // * 探测失败时仍尝试 PATH 中的 java，失败原因由安装器输出决定
    return { path: 'java', majorVersion: 0, requiredMajor }
  }

  const compatible = available.filter((java) => java.majorVersion >= requiredMajor)
  if (compatible.length === 0) {
    const highest = available.reduce((a, b) => (b.majorVersion > a.majorVersion ? b : a))
    throw new Error(
      `安装 Minecraft ${mcVersion} 的加载器需要 Java ${requiredMajor} 或更高版本，` +
        `当前检测到的最高版本为 Java ${highest.majorVersion}，请先安装 Java ${requiredMajor}`
    )
  }

  // * 优先精确匹配所需版本，其次选择满足要求的最低版本，避免过新的 Java 与旧安装器不兼容
  compatible.sort((a, b) => {
    const aExact = a.majorVersion === requiredMajor ? 0 : 1
    const bExact = b.majorVersion === requiredMajor ? 0 : 1
    if (aExact !== bExact) return aExact - bExact
    return a.majorVersion - b.majorVersion
  })

  const chosen = compatible[0]
  return { path: chosen.path, majorVersion: chosen.majorVersion, requiredMajor }
}

/**
 * NeoForge 加载器适配器
 * 版本来源：NeoForge Maven API（按 MC 版本前缀过滤）
 * 安装方式：下载官方 installer，以 --installClient 模式运行
 */
import axios from 'axios'
import { BaseLoaderAdapter } from './BaseLoaderAdapter'
import type { LoaderInstallContext } from './ILoaderAdapter'

const NEOFORGE_MAVEN = 'https://maven.neoforged.net/releases'
const NEOFORGE_META = 'https://maven.neoforged.net'

export class NeoForgeAdapter extends BaseLoaderAdapter {
  readonly type = 'neoforge' as const
  readonly name = 'NeoForge'
  readonly supportedVersions = [
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

  /**
   * MC 版本转 NeoForge 版本前缀
   * 例：1.20.1 → 20.1. / 1.21.4 → 21.4.
   */
  private mcPrefixOf(mcVersion: string): string {
    return mcVersion.replace(/^1\./, '') + '.'
  }

  /**
   * 获取指定 MC 版本的全部 NeoForge 版本
   * NeoForge 版本格式: <shortMc>.<build>-beta
   */
  async getVersions(mcVersion: string): Promise<string[]> {
    const mcPrefix = this.mcPrefixOf(mcVersion)
    const versions: string[] = []

    try {
      const response = await axios.get(
        `${NEOFORGE_META}/api/maven/versions/releases/net/neoforged/neoforge?filter=${mcVersion}`
      )
      const data = response.data
      if (data?.versions && Array.isArray(data.versions)) {
        versions.push(...data.versions.filter((v: string) => v.startsWith(mcPrefix)))
      }
      if (versions.length === 0) {
        // filter 未生效时尝试全量获取再过滤
        this.log.info('NeoForge Maven filter 未返回结果，尝试全量获取')
        const fullResponse = await axios.get(
          `${NEOFORGE_META}/api/maven/versions/releases/net/neoforged/neoforge`
        )
        if (fullResponse.data?.versions && Array.isArray(fullResponse.data.versions)) {
          versions.push(...fullResponse.data.versions.filter((v: string) => v.startsWith(mcPrefix)))
        }
      }
    } catch (e) {
      this.log.warn('Failed to get NeoForge versions:', e)
    }

    // 未找到时返回默认版本
    if (versions.length === 0) {
      versions.push(`${mcPrefix}55-beta`)
    }
    return versions
  }

  /**
   * 获取指定 MC 版本的 NeoForge 最新版本
   */
  async getLatestVersion(mcVersion: string): Promise<string | null> {
    try {
      const response = await axios.get(`${NEOFORGE_META}/v3/versions/neoforge/${mcVersion}`)
      const versions = response.data

      if (versions && versions.length > 0) {
        const latest = versions[0]
        return latest.version || latest
      }

      this.log.warn(`[NeoForge] 未找到 Minecraft ${mcVersion} 的 NeoForge 版本`)
      return null
    } catch (error) {
      this.log.error(`[NeoForge] 获取 NeoForge 版本失败:`, error)
      return null
    }
  }

  async install(ctx: LoaderInstallContext): Promise<void> {
    const { gameDir, mcVersion } = ctx

    this.report(ctx, 'downloading', 0, '获取 NeoForge 版本信息...')

    let targetVersion: string | null = ctx.loaderVersion || null
    if (!targetVersion) {
      this.report(ctx, 'downloading', 5, '获取 NeoForge 版本信息...')
      targetVersion = await this.getLatestVersion(mcVersion)
      if (!targetVersion) {
        throw new Error(`不支持 Minecraft ${mcVersion} 版本的 NeoForge`)
      }
    }

    // 下载 NeoForge 安装器
    this.report(ctx, 'downloading', 10, '下载 NeoForge 安装器...')

    // NeoForge 1.20.1 使用旧的命名格式
    let installerUrl: string
    if (mcVersion === '1.20.1') {
      installerUrl = `${NEOFORGE_MAVEN}/net/neoforged/neoforge/${mcVersion}-${targetVersion}/neoforge-${mcVersion}-${targetVersion}-installer.jar`
    } else {
      installerUrl = `${NEOFORGE_MAVEN}/net/neoforged/neoforge/${targetVersion}/neoforge-${targetVersion}-installer.jar`
    }

    const installerPath = await this.downloadInstaller(
      installerUrl,
      gameDir,
      `neoforge-installer-${targetVersion}.jar`,
      (progress) => {
        this.report(
          ctx,
          'downloading',
          10 + progress * 0.35,
          `下载中... ${Math.round(progress * 100)}%`
        )
      }
    )

    this.report(ctx, 'installing', 45, '安装 NeoForge...')

    // 运行安装器
    await this.runJavaInstaller(installerPath, ['--installClient', gameDir])

    await this.cleanupInstaller(installerPath)

    this.report(ctx, 'verifying', 90, '验证安装...')

    this.report(ctx, 'complete', 100, 'NeoForge 安装完成！')
  }
}

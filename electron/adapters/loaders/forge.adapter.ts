/**
 * Forge 加载器适配器
 * 版本来源：Forge promotions_slim.json（推荐/最新）与 Maven metadata（全量列表）
 * 安装方式：下载官方 installer，以 --installClient 模式运行
 */
import { promises as fs } from 'fs'
import * as path from 'path'
import axios from 'axios'
import { BaseLoaderAdapter } from './BaseLoaderAdapter'
import type { LoaderInstallContext } from './ILoaderAdapter'

const FORGE_PROMO_URL =
  'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json'
const FORGE_MAVEN_META =
  'https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml'
const FORGE_MAVEN = 'https://maven.minecraftforge.net'

export class ForgeAdapter extends BaseLoaderAdapter {
  readonly type = 'forge' as const
  readonly name = 'Forge'
  readonly supportedVersions = [
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
    '1.20.3',
    '1.20.4',
    // ! Forge 跳过了 1.20.5，没有任何构建。白名单命中会跳过在线校验，
    // ! 一旦把不存在的版本写进来，页面会显示支持但安装必然失败。
    '1.20.6',
    '1.21',
    '1.21.1',
    '1.21.3',
    '1.21.4',
    '1.21.5',
    '1.21.6',
    '1.21.7',
    '1.21.8',
    '1.21.9',
    '1.21.10',
    '1.21.11'
  ]

  /**
   * 获取指定 MC 版本的全部 Forge 版本（最新在前）
   * Forge 版本格式: <mcVersion>-<buildNumber>
   */
  async getVersions(mcVersion: string): Promise<string[]> {
    const prefix = `${mcVersion}-`
    const versions: string[] = []

    try {
      const response = await axios.get(FORGE_MAVEN_META, { responseType: 'text' })
      const xml = response.data as string
      const versionRegex = /<version>(\d+\.\d+\.\d+-[^<]+)<\/version>/g
      let match: RegExpExecArray | null
      while ((match = versionRegex.exec(xml)) !== null) {
        const ver = match[1]
        if (ver.startsWith(prefix)) {
          versions.push(ver)
        }
      }
    } catch (e) {
      this.log.warn('Failed to get Forge versions from Maven:', e)
    }

    // 找不到对应版本时返回空数组，让上层判定为“不支持”，
    // 不能伪造一个版本号，否则会显示为可选却无法安装

    // 倒序（最新在前）
    versions.sort((a, b) => {
      const aNum = parseInt(a.split('-')[1].replace(/\./g, '')) || 0
      const bNum = parseInt(b.split('-')[1].replace(/\./g, '')) || 0
      return bNum - aNum
    })
    return versions
  }

  /**
   * 获取指定 MC 版本的 Forge 推荐/最新版本
   */
  async getRecommendedVersion(mcVersion: string): Promise<string | null> {
    try {
      const response = await axios.get(FORGE_PROMO_URL)
      const promos = response.data.promos

      const recommendedKey = `${mcVersion}-recommended`
      const latestKey = `${mcVersion}-latest`

      if (promos[recommendedKey]) {
        return `${mcVersion}-${promos[recommendedKey]}`
      } else if (promos[latestKey]) {
        return `${mcVersion}-${promos[latestKey]}`
      }

      this.log.warn(`[Forge] 未找到 Minecraft ${mcVersion} 的推荐版本`)
      return null
    } catch (error) {
      this.log.error(`[Forge] 获取 Forge 版本失败:`, error)
      return null
    }
  }

  async install(ctx: LoaderInstallContext): Promise<void> {
    const { gameDir, mcVersion } = ctx

    this.report(ctx, 'downloading', 0, '获取 Forge 版本信息...')

    let targetVersion: string | null = ctx.loaderVersion || null
    if (!targetVersion) {
      this.report(ctx, 'downloading', 5, '获取 Forge 版本信息...')
      // * 优先用 Maven 中该 MC 版本的实际构建，promotions 只作为兜底：
      // * 很多版本只有 latest 没有 recommended，甚至 promotions 缺失但 Maven 有构建
      const versions = await this.getVersions(mcVersion)
      targetVersion = versions[0] || (await this.getRecommendedVersion(mcVersion))
      if (!targetVersion) {
        throw new Error(`Minecraft ${mcVersion} 没有可用的 Forge 构建`)
      }
    }

    // 下载 Forge 安装器
    this.report(ctx, 'downloading', 10, '下载 Forge 安装器...')

    const installerUrl = `${FORGE_MAVEN}/net/minecraftforge/forge/${targetVersion}/forge-${targetVersion}-installer.jar`
    const installerPath = await this.downloadInstaller(
      installerUrl,
      gameDir,
      `forge-installer-${targetVersion}.jar`,
      (progress) => {
        this.report(
          ctx,
          'downloading',
          10 + progress * 0.35,
          `下载中... ${Math.round(progress * 100)}%`
        )
      }
    )

    this.report(ctx, 'installing', 45, '安装 Forge...')

    // 运行安装器（仅安装到客户端）
    await this.runJavaInstaller(installerPath, ['--installClient', gameDir])

    await this.cleanupInstaller(installerPath)

    this.report(ctx, 'verifying', 90, '验证安装...')

    // 验证安装
    const versionJsonPath = path.join(
      gameDir,
      'versions',
      `forge-${targetVersion}`,
      `forge-${targetVersion}.json`
    )
    try {
      await fs.access(versionJsonPath)
    } catch {
      // 尝试另一种命名格式
      const altVersionJsonPath = path.join(
        gameDir,
        'versions',
        `${mcVersion}-forge-${targetVersion.split('-').pop()}`,
        `${mcVersion}-forge-${targetVersion.split('-').pop()}.json`
      )
      await fs.access(altVersionJsonPath)
    }

    this.report(ctx, 'complete', 100, 'Forge 安装完成！')
  }
}

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
    '1.20.4',
    '1.20.5',
    '1.20.6'
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

    // 未找到时返回默认版本
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
      targetVersion = await this.getRecommendedVersion(mcVersion)
      if (!targetVersion) {
        throw new Error(`不支持 Minecraft ${mcVersion} 版本的 Forge`)
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

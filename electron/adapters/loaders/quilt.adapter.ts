/**
 * Quilt 加载器适配器
 * 版本来源：Quilt Meta API（loader + installer 版本对）
 * 安装方式：下载官方 installer，以 install client 模式运行
 */
import { promises as fs } from 'fs'
import * as path from 'path'
import axios from 'axios'
import { BaseLoaderAdapter } from './BaseLoaderAdapter'
import type { LoaderInstallContext, LoaderVersion } from './ILoaderAdapter'

const QUILT_META_BASE = 'https://meta.quiltmc.org/v3'
const QUILT_MAVEN = 'https://maven.quiltmc.org/repository/release'

export class QuiltAdapter extends BaseLoaderAdapter {
  readonly type = 'quilt' as const
  readonly name = 'Quilt'
  readonly supportedVersions = [
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

  /**
   * 获取指定 MC 版本的全部 Quilt Loader 版本
   */
  async getVersions(mcVersion: string): Promise<string[]> {
    const response = await axios.get(`${QUILT_META_BASE}/versions/loader/${mcVersion}`)
    const data = response.data
    if (Array.isArray(data)) {
      return data.map((v: { loader: { version: string } }) => v.loader?.version).filter(Boolean)
    }
    return []
  }

  /**
   * 获取指定 MC 版本的 Quilt 最新 loader + installer 版本对
   */
  async getLatestLoaderVersion(mcVersion: string): Promise<LoaderVersion | null> {
    try {
      const response = await axios.get(`${QUILT_META_BASE}/versions/loader/${mcVersion}`)
      const data = response.data

      if (data.length > 0) {
        const latest = data[0]
        return {
          loader: latest.loader.version,
          installer: latest.installer.version
        }
      }
      return null
    } catch (error) {
      this.log.error(`[Quilt] 获取 ${mcVersion} 的 Quilt 版本失败:`, error)
      return null
    }
  }

  async install(ctx: LoaderInstallContext): Promise<void> {
    const { gameDir, mcVersion } = ctx

    this.report(ctx, 'downloading', 0, '获取 Quilt 版本信息...')

    const versionInfo = await this.getLatestLoaderVersion(mcVersion)
    if (!versionInfo) {
      throw new Error(`不支持 Minecraft ${mcVersion} 版本的 Quilt`)
    }

    // 下载 Quilt 安装器
    this.report(ctx, 'downloading', 10, '下载 Quilt 安装器...')

    const installerUrl = `${QUILT_MAVEN}/org/quiltmc/quilt-installer/${versionInfo.installer}/quilt-installer-${versionInfo.installer}.jar`
    const installerPath = await this.downloadInstaller(
      installerUrl,
      gameDir,
      `quilt-installer-${versionInfo.installer}.jar`,
      (progress) => {
        this.report(
          ctx,
          'downloading',
          10 + progress * 0.35,
          `下载中... ${Math.round(progress * 100)}%`
        )
      }
    )

    this.report(ctx, 'installing', 45, '安装 Quilt...')

    // 运行安装器
    await this.runJavaInstaller(installerPath, [
      'install',
      'client',
      mcVersion,
      '--dir',
      gameDir,
      '--no-profile'
    ])

    await this.cleanupInstaller(installerPath)

    this.report(ctx, 'verifying', 90, '验证安装...')

    // 验证安装
    const quiltDir = path.join(gameDir, 'libraries', 'org', 'quiltmc', 'quilt-loader')
    try {
      await fs.access(quiltDir)
    } catch {
      // 尝试其他位置
      const altDir = path.join(gameDir, 'mods')
      await fs.access(altDir)
    }

    this.report(ctx, 'complete', 100, 'Quilt 安装完成！')
  }
}

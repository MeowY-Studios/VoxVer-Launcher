/**
 * Fabric 加载器适配器
 * 版本来源：Fabric Meta API（loader + installer 版本对）
 * 安装方式：下载官方 installer，以 install client 模式运行
 */
import { promises as fs } from 'fs'
import * as path from 'path'
import axios from 'axios'
import { BaseLoaderAdapter } from './BaseLoaderAdapter'
import type { LoaderInstallContext, LoaderVersion } from './ILoaderAdapter'

const FABRIC_META_BASE = 'https://meta.fabricmc.net/v2'
const FABRIC_DOWNLOAD_BASE = 'https://maven.fabricmc.net'

export class FabricAdapter extends BaseLoaderAdapter {
  readonly type = 'fabric' as const
  readonly name = 'Fabric'
  readonly supportedVersions = [
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

  /**
   * 获取指定 MC 版本的全部 Fabric Loader 版本
   */
  async getVersions(mcVersion: string): Promise<string[]> {
    const response = await axios.get(`${FABRIC_META_BASE}/versions/loader/${mcVersion}`)
    const data = response.data
    if (Array.isArray(data)) {
      return data.map((v: { loader: { version: string } }) => v.loader?.version).filter(Boolean)
    }
    return []
  }

  /**
   * 获取指定 MC 版本的 Fabric 最新 loader + installer 版本对
   */
  async getLatestLoaderVersion(mcVersion: string): Promise<LoaderVersion | null> {
    try {
      const response = await axios.get(`${FABRIC_META_BASE}/versions/loader/${mcVersion}`)
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
      this.log.error(`[Fabric] 获取 ${mcVersion} 的 Fabric 版本失败:`, error)
      return null
    }
  }

  async install(ctx: LoaderInstallContext): Promise<void> {
    const { gameDir, mcVersion } = ctx

    this.report(ctx, 'downloading', 0, '获取 Fabric 版本信息...')

    const versionInfo = await this.getLatestLoaderVersion(mcVersion)
    if (!versionInfo) {
      throw new Error(`不支持 Minecraft ${mcVersion} 版本的 Fabric`)
    }

    // 下载 Fabric 安装器
    this.report(ctx, 'downloading', 10, '下载 Fabric 安装器...')

    const installerUrl = `${FABRIC_DOWNLOAD_BASE}/net/fabricmc/fabric-installer/${versionInfo.installer}/fabric-installer-${versionInfo.installer}.jar`
    const installerPath = await this.downloadInstaller(
      installerUrl,
      gameDir,
      `fabric-installer-${versionInfo.installer}.jar`,
      (progress) => {
        this.report(
          ctx,
          'downloading',
          10 + progress * 0.35,
          `下载中... ${Math.round(progress * 100)}%`
        )
      }
    )

    this.report(ctx, 'installing', 45, '安装 Fabric...')

    // 运行安装器
    await this.runJavaInstaller(installerPath, [
      'install',
      'client',
      mcVersion,
      '--dir',
      gameDir,
      '--noprofile'
    ])

    await this.cleanupInstaller(installerPath)

    this.report(ctx, 'verifying', 90, '验证安装...')

    // 验证安装（仅告警，不阻断）
    const fabricDir = path.join(gameDir, 'libraries', 'net', 'fabricmc', 'fabric-loader')
    try {
      await fs.access(fabricDir)
    } catch (err) {
      this.log.warn('[Fabric] 验证警告:', err)
    }

    this.report(ctx, 'complete', 100, 'Fabric 安装完成！')
  }
}

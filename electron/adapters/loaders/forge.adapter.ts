/**
 * Forge 加载器适配器
 * 版本元数据由 loader catalog 提供，安装流程由统一安装计划与执行器完成。
 */
import { BaseLoaderAdapter } from './BaseLoaderAdapter'
import { getForgeBuilds, getForgeRecommendedVersion } from '../../loaders/catalog/providers/forge.provider'

export class ForgeAdapter extends BaseLoaderAdapter {
  readonly type = 'forge' as const
  readonly name = 'Forge'
  /**
   * 兼容性判断以官方 Maven 元数据为准，这里只作为网络失败时的兜底。
   * ! 不要把它当成支持列表来源，否则新版本（26.x）会被漏掉。
   */
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
    '1.21.11',
    '26.1',
    '26.1.1',
    '26.1.2',
    '26.2',
    '26.3'
  ]

  /**
   * 获取指定 MC 版本的全部 Forge 版本（稳定版优先，最新在前）
   */
  async getVersions(mcVersion: string): Promise<string[]> {
    const builds = await getForgeBuilds(mcVersion)
    return builds.map((build) => build.version)
  }

  /**
   * 获取指定 MC 版本的 Forge 推荐/最新版本
   */
  async getRecommendedVersion(mcVersion: string): Promise<string | null> {
    return getForgeRecommendedVersion(mcVersion)
  }
}

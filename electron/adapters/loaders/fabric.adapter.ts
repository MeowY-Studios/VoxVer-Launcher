/**
 * Fabric 加载器适配器
 * 版本元数据由 loader catalog 提供，安装流程由统一安装计划与执行器完成。
 */
import { BaseLoaderAdapter } from './BaseLoaderAdapter'
import { getFabricBuilds } from '../../loaders/catalog/providers/fabric.provider'

export class FabricAdapter extends BaseLoaderAdapter {
  readonly type = 'fabric' as const
  readonly name = 'Fabric'
  /** 兼容性判断以 Meta API 为准，这里只作为网络失败时的兜底。 */
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

  /** 获取指定 MC 版本的全部 Fabric Loader 版本 */
  async getVersions(mcVersion: string): Promise<string[]> {
    const builds = await getFabricBuilds(mcVersion)
    return builds.map((build) => build.version)
  }
}

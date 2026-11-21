/**
 * NeoForge 加载器适配器
 * 版本元数据由 loader catalog 提供，安装流程由统一安装计划与执行器完成。
 *
 * 工件说明：
 * - 1.20.1 是 legacy 分支，构建发布在 net/neoforged/forge，版本形如 1.20.1-47.1.106
 * - 1.20.2 起使用 net/neoforged/neoforge，版本形如 20.2.88 / 21.1.77 / 26.1.2.127
 */
import { BaseLoaderAdapter } from './BaseLoaderAdapter'
import { getNeoForgeBuilds } from '../../loaders/catalog/providers/neoforge.provider'

export class NeoForgeAdapter extends BaseLoaderAdapter {
  readonly type = 'neoforge' as const
  readonly name = 'NeoForge'
  /**
   * 兼容性判断以官方 Maven 元数据为准，这里只作为网络失败时的兜底。
   */
  readonly supportedVersions = [
    '1.20.1',
    '1.20.2',
    '1.20.4',
    '1.20.5',
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
   * 获取指定 MC 版本的全部 NeoForge 版本
   * 1.20.1 返回完整版本（1.20.1-47.1.106），其余返回 NeoForge 自身版本（21.1.77）
   */
  async getVersions(mcVersion: string): Promise<string[]> {
    const builds = await getNeoForgeBuilds(mcVersion)
    return builds.map((build) => build.version)
  }
}

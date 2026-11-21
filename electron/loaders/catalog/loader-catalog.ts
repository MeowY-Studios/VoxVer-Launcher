/**
 * 加载器目录（LoaderCatalog）
 * 统一对外提供「某 MC 版本 × 某加载器」的可用构建与兼容性分级，
 * 各 provider 负责官方元数据的解析，缓存由 provider 内部按 TTL 处理。
 */
import {
  PROVIDERS
} from './providers'
import type { LoaderCatalogProvider, LoaderKind, LoaderSupport, SupportLevel } from './types'
import type { LoaderBuild } from './types'

const LEVEL_RANK: Record<SupportLevel, number> = { A: 0, B: 1, C: 2, D: 3 }

export class LoaderCatalog {
  constructor(private readonly providers: Record<LoaderKind, LoaderCatalogProvider> = PROVIDERS) {}

  /** 获取指定加载器在指定 MC 版本下的全部构建 */
  getBuilds(loader: LoaderKind, mcVersion: string): Promise<LoaderBuild[]> {
    return this.providers[loader].getBuilds(mcVersion)
  }

  /** 只取版本号列表，供现有适配器复用 */
  async getVersions(loader: LoaderKind, mcVersion: string): Promise<string[]> {
    const builds = await this.getBuilds(loader, mcVersion)
    return builds.map((build) => build.version)
  }

  /** 推荐构建：稳定版优先，列表首个即最新可用 */
  async getRecommendedBuild(loader: LoaderKind, mcVersion: string): Promise<LoaderBuild | null> {
    const builds = await this.getBuilds(loader, mcVersion)
    return builds[0] ?? null
  }

  /**
   * 获取兼容性结论
   * A/B 可安装；C 表示仅元数据或不支持一键安装；D 表示官方没有构建。
   */
  async getSupport(loader: LoaderKind, mcVersion: string): Promise<LoaderSupport> {
    try {
      const builds = await this.getBuilds(loader, mcVersion)
      if (builds.length === 0) {
        return {
          loader,
          mcVersion,
          level: 'D',
          builds: [],
          reason: '官方元数据中不存在该 Minecraft 版本的构建'
        }
      }

      const best = builds.reduce((current, build) =>
        LEVEL_RANK[build.support] < LEVEL_RANK[current.support] ? build : current
      )
      return {
        loader,
        mcVersion,
        level: best.support,
        builds,
        reason: best.note
      }
    } catch (error) {
      return {
        loader,
        mcVersion,
        level: 'C',
        builds: [],
        reason: `获取加载器元数据失败：${error instanceof Error ? error.message : String(error)}`
      }
    }
  }
}

export const loaderCatalog = new LoaderCatalog()
